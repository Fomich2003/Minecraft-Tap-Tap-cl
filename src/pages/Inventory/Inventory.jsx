import "./Inventory.scss"
import "./Bench.scss"
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useUserContext } from "../../context/UserContext"
import ServerImage from "../../components/ServerImage/ServerImage"
import { INVENTORY_CONF } from "../../config/inventory.config"
import { STATION_LAYOUTS, stationFace } from "../../config/stations.config"
import { EFFECTS } from "../../config/effects.config"
import { formatLeft } from "../Tap/useCountdown"
import { formatNumber } from "../../utils/format"
import { haptic } from "../../utils/telegram"
import getInventorySize from "../../utils/inventory"
import { describeComponents, potionMark, stackLabel } from "../../utils/item-details"
import { itemIcon } from "../../utils/item-icon"
import { itemName, t } from "../../i18n"
import { addToSlot, clearSlot, identityOf, moveBetweenSlots, reconcilePlacement, remainingByStack, spendFromSlots } from "../../utils/placement"
import StationPanel from "./StationPanel"
import JobPanel from "./JobPanel"
import CartographyPanel from "./CartographyPanel"
import StationsSheet from "./StationsSheet"
import ShopSheet from "./ShopSheet"
import RecipeSheet from "./RecipeSheet"
import Banner from "../../components/Banner/Banner"
import useItemDrag from "./useItemDrag"

const STORAGE_KEY = "minecraft-tap-tap-inventory-layout"
const NO_SLOTS = {}
const NOTICE_MS = 3500
const AMOUNTS = [
    { value: 1, label: "1" },
    { value: 8, label: "8" },
    { value: 16, label: "16" },
    { value: 32, label: "32" },
    { value: "all", label: "Усе" },
]

const SORT_MOVE_MS = 420
const SORT_STAGGER_MS = 14
const SORT_STAGGER_LIMIT = 30

function readSavedLayout() {
    try {
        const value = localStorage.getItem(STORAGE_KEY)
        return value ? JSON.parse(value) : null
    } catch {
        return null
    }
}

function saveLayout(slots) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(slots))
    } catch (error) {
        console.warn("Не вдалося зберегти розкладку інвентаря", error)
    }
}

function clearLayout() {
    try {
        localStorage.removeItem(STORAGE_KEY)
    } catch {
        // Без сховища розкладка й так не зберігається
    }
}

function stackRects(grid) {
    return new Map([...grid.querySelectorAll("[data-stack-id]")].map(node => [node.dataset.stackId, node.getBoundingClientRect()]))
}

function animateToSlots(grid, start) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    grid.querySelectorAll("[data-stack-id]").forEach((node, index) => {
        const from = start.get(node.dataset.stackId)
        if (!from) return
        const to = node.getBoundingClientRect()
        const x = from.left - to.left
        const y = from.top - to.top
        if (!x && !y) return
        node.animate?.([{ transform: `translate(${x}px, ${y}px)` }, { transform: "none" }], {
            delay: Math.min(index, SORT_STAGGER_LIMIT) * SORT_STAGGER_MS,
            duration: SORT_MOVE_MS,
            easing: "cubic-bezier(.2, .8, .2, 1)",
            fill: "backwards",
        })
    })
}

function arrangeStacks(items) {
    const saved = readSavedLayout()
    const size = Math.max(getInventorySize(items.length), Array.isArray(saved) ? saved.length : 0)
    const order = Array(size).fill(null)
    const known = new Set(items.map(item => String(item._id)))
    const placed = new Set()

    if (Array.isArray(saved)) saved.forEach((id, index) => {
        if (index < size && known.has(String(id)) && !placed.has(String(id))) {
            order[index] = String(id)
            placed.add(String(id))
        }
    })
    items.forEach(item => {
        if (placed.has(String(item._id))) return
        const slot = order.indexOf(null)
        if (slot !== -1) order[slot] = String(item._id)
    })
    return order
}

function Inventory() {
    const { user, inventory, stations, catalog, mergeStacks, compactStacks, consumeItem, recycleStack, hangBanner } = useUserContext()
    const [layoutVersion, setLayoutVersion] = useState(0)
    const [placement, setPlacement] = useState({ station: null, slots: NO_SLOTS })
    const [amountChoice, setAmountChoice] = useState({ station: null, value: null })
    const [selected, setSelected] = useState(null)
    const [sheet, setSheet] = useState(null)
    const [notice, setNotice] = useState(null)
    const [recycling, setRecycling] = useState(null)
    const [isBusy, setIsBusy] = useState(false)
    const noticeTimer = useRef(null)
    const grid = useRef(null)
    const sortStart = useRef(null)

    const station = stations.find(entry => entry.active) ?? stations[0]
    const stationSlug = station?.slug
    const layout = station ? STATION_LAYOUTS[station.uiType] : null

    // Предмет, видалений із каталогу, приходить без даних і показати його неможливо
    const items = useMemo(() => (inventory?.items ?? []).filter(stack => stack.itemId), [inventory])
    const stacks = useMemo(() => new Map(items.map(item => [String(item._id), item])), [items])
    // eslint-disable-next-line react-hooks/exhaustive-deps -- розкладка читається з localStorage після кожного перестановлення
    const order = useMemo(() => arrangeStacks(items), [items, layoutVersion])

    // Вміст слотів належить лише активному верстаку й завжди відповідає інвентарю
    const placed = useMemo(
        () => (placement.station === stationSlug ? reconcilePlacement(placement.slots, items) : NO_SLOTS),
        [placement, stationSlug, items],
    )
    const remaining = useMemo(() => remainingByStack(items, placed), [items, placed])
    const amount = amountChoice.station === stationSlug && amountChoice.value ? amountChoice.value : layout?.amount ?? "all"

    const setPlaced = useCallback(update => setPlacement(current => ({
        station: stationSlug,
        slots: update(current.station === stationSlug ? reconcilePlacement(current.slots, items) : NO_SLOTS),
    })), [stationSlug, items])

    const putIntoSlot = useCallback((stackId, slotKey) => {
        const stack = stacks.get(stackId)
        if (stack) setPlaced(current => addToSlot(current, items, stack, slotKey, amount))
    }, [amount, items, setPlaced, stacks])

    const showNotice = useCallback(text => {
        setNotice(text)
        clearTimeout(noticeTimer.current)
        noticeTimer.current = setTimeout(() => setNotice(null), NOTICE_MS)
    }, [])

    // Дія сервера над інвентарем: одночасно лише одна, бо кожна повертає новий вміст
    const runAction = useCallback(async action => {
        setIsBusy(true)
        const result = await action()
        setIsBusy(false)
        haptic(result.success ? "success" : "error")
        if (!result.success) showNotice(result.message)
        return result
    }, [showNotice])

    const canMerge = useCallback((fromId, toId) => {
        const from = stacks.get(fromId)
        const to = stacks.get(toId)
        return Boolean(from && to && fromId !== toId && identityOf(from) === identityOf(to))
    }, [stacks])

    // Розкладка фіксується до злиття: решта предметів лишається у своїх клітинках, а порожній слот не заповнюється
    const mergeInto = useCallback((fromId, toId) => {
        saveLayout(order)
        runAction(() => mergeStacks(fromId, toId))
    }, [mergeStacks, order, runAction])

    const handleDrop = useCallback((source, target) => {
        if (!target) return
        if (source.area === "inventory") {
            if (target.area === "craft") putIntoSlot(source.stackId, target.key)
            else if (canMerge(source.stackId, order[target.index])) {
                mergeInto(source.stackId, order[target.index])
            } else if (target.index !== source.index) {
                const next = [...order]
                ;[next[source.index], next[target.index]] = [next[target.index], next[source.index]]
                saveLayout(next)
                setLayoutVersion(version => version + 1)
            }
        } else if (target.area === "inventory") {
            setPlaced(current => clearSlot(current, source.key))
        } else {
            setPlaced(current => moveBetweenSlots(current, source.key, target.key))
        }
    }, [canMerge, mergeInto, order, putIntoSlot, setPlaced])

    const drag = useItemDrag(handleDrop)

    const selectedStack = selected ? stacks.get(selected) : null
    const canPlaceSelected = selectedStack && (remaining.get(selected) ?? 0) > 0

    const clickSlot = slotKey => {
        const current = placed[slotKey]
        if (canPlaceSelected && (!current || identityOf(current.entry) !== identityOf(selectedStack) || current.count < (selectedStack.itemId.maxStack ?? 64))) {
            putIntoSlot(selected, slotKey)
        } else if (current) {
            setPlaced(slots => clearSlot(slots, slotKey))
        }
    }

    const handlers = {
        clickSlot,
        dragFromSlot: (event, key, value) => drag.begin(event, { area: "craft", key }, { icon: itemIcon(value.entry.itemId, value.entry.components), count: value.count }),
        // Щойно наповнені пляшечки одразу стають у стійку, а інгредієнт лишається на місці
        placeBottle: fresh => {
            const stacks = fresh.items.filter(stack => stack.itemId)
            const water = stacks.find(stack => stack.itemId.slug === "potion" && stack.components?.potion === "water")
            if (water) setPlaced(current => addToSlot(clearSlot(current, "bottle"), stacks, water, "bottle", 1))
        },
    }

    // Предмет їде зі старої клітинки в нову, а не з'являється там одразу
    useLayoutEffect(() => {
        const start = sortStart.current
        sortStart.current = null
        if (start && grid.current) animateToSlots(grid.current, start)
    }, [layoutVersion])

    if (!inventory || !station) return <main id="Inventory" className="Inventory"><p className="Inventory__empty">{t("Не вдалося завантажити інвентар")}</p></main>

    const details = describeComponents(selectedStack, catalog)
    const catalogItem = selectedStack && catalog?.items.find(entry => entry.slug === selectedStack.itemId.slug)
    const isFood = Boolean(catalogItem?.food)
    const isPotion = ["potion", "splash_potion", "lingering_potion", "experience_bottle"].includes(selectedStack?.itemId.slug)
    const isBanner = Boolean(selectedStack?.itemId.slug.endsWith("_banner"))
    const isXpBottle = selectedStack?.itemId.slug === "experience_bottle"
    const { experience } = user.loadout

    const clickStack = id => {
        if (selected && canMerge(selected, id)) mergeInto(selected, id)
        else setSelected(selected === id ? null : id)
    }

    const consumeSelected = () => runAction(async () => {
        const result = await consumeItem(selected)
        if (result.success && result.gainedXp) showNotice(t("+{xp} досвіду", { xp: result.gainedXp }))
        else if (result.success) showNotice(t("Ефект: {list}", {
            list: result.gained.map(({ id, seconds }) => `${t(EFFECTS[id].name)} ${formatLeft(seconds * 1000)}`).join(", "),
        }))
        return result
    })

    // Сервер зсипає стаки й сортує їх, а збережена розкладка скидається: предмети піднімаються до верхніх клітинок
    const sortStacks = () => runAction(async () => {
        const start = stackRects(grid.current)
        const result = await compactStacks()
        if (result.success) {
            clearLayout()
            sortStart.current = start
            setLayoutVersion(version => version + 1)
            setSelected(null)
        }
        return result
    })

    // Рецепт зілля ставить пляшечку й інгредієнт. Для води годяться й порожні пляшечки
    const placeBrewing = ({ brewing }) => {
        const bottle = items.find(entry => entry.itemId.slug === brewing.bottle && entry.components?.potion === brewing.potion)
            ?? (brewing.potion === "water" ? items.find(entry => entry.itemId.slug === "glass_bottle") : null)
        const reagent = items.find(entry => entry.itemId.slug === brewing.reagent)
        setSheet(null)
        if (!bottle || !reagent) {
            showNotice(t("Бракує інгредієнтів"))
            return
        }
        setPlaced(current => addToSlot(addToSlot(clearSlot(clearSlot(current, "bottle"), "reagent"), items, bottle, "bottle", 3), items, reagent, "reagent", 1))
    }

    // Книга рецептів розкладає інгредієнти по сітці верстака
    const placeRecipe = recipe => {
        if (recipe.brewing) {
            placeBrewing(recipe)
            return
        }
        let next = NO_SLOTS
        const missing = recipe.cells.some((options, index) => {
            if (!options) return false
            const row = Math.floor(index / recipe.width)
            const key = String(row * 3 + index % recipe.width)
            const stack = items.find(entry => options.includes(entry.itemId.slug) && !Object.values(next).some(value => identityOf(value.entry) === identityOf(entry) && value.count >= entry.quantity))
            if (!stack) return true
            next = addToSlot(next, items, stack, key, 1)
            return !next[key]
        })
        if (missing) {
            showNotice(t("Бракує інгредієнтів"))
            setSheet(null)
            return
        }
        setPlaced(() => next)
        setSheet(null)
    }

    // Переробка забирає весь стак, тому потребує другого натискання
    const recycleSelected = () => {
        if (recycling !== selected) {
            setRecycling(selected)
            return
        }
        setRecycling(null)
        runAction(async () => {
            const result = await recycleStack(selected, remaining.get(selected) ?? selectedStack.quantity)
            if (result.success) {
                showNotice(t("+{xp} досвіду", { xp: result.gainedXp }))
                setSelected(null)
            }
            return result
        })
    }
    const equipped = new Set(Object.values(user.loadout.tools).map(tool => tool?.stackId))
    const onApplied = used => setPlaced(current => (used ? spendFromSlots(current, used) : NO_SLOTS))
    const Panel = station.uiType === "cartography" ? CartographyPanel : layout.timed ? JobPanel : StationPanel
    const recipeStations = { grid: "crafting_table", brewing: "brewing_stand" }

    return <main id="Inventory" className="Inventory" onClickCapture={drag.suppressClickAfterDrag}>
        <div className="Inventory__wrapper">
            <section className="Inventory__craft" aria-label={t("Верстак")}>
                <div className="Inventory__toolbar">
                    <button className="mc-btn mc-btn--small Inventory__station" onClick={() => setSheet("stations")}>
                        <ServerImage imgSrc={station.icon} alt="" />
                        <span>{itemName(station)}</span>
                    </button>
                    <button className="mc-btn mc-btn--small Inventory__book" aria-label={t("Книга рецептів")} onClick={() => setSheet("recipes")}><ServerImage imgSrc="/items/knowledge_book.png" alt="" /></button>
                    <button className="mc-btn mc-btn--small" disabled={isBusy} aria-label={t("Скласти стаки")} onClick={sortStacks}>{t("Стаки")}</button>
                    <button className="mc-btn mc-btn--small mc-btn--green" onClick={() => setSheet("shop")}>{t("Магазин")}</button>
                </div>
                {/* Смуга з текстурою блока верстака: з першого погляду видно, за яким столом стоїш */}
                <div className={`Inventory__bench Inventory__bench--${station.uiType}`} style={{ "--bench-face": `url(${stationFace(station.slug)})` }}>
                    <Panel key={station.slug} station={station} placed={placed} dragOver={drag.over} handlers={handlers} onApplied={onApplied} />
                </div>
            </section>

            <section className="Inventory__items" aria-label={t("Інвентар")}>
                <div className="Inventory__bar">
                    <p className={`Inventory__details${notice ? " Inventory__details--notice" : ""}`}>
                        {notice ?? (selectedStack ? itemName(selectedStack.itemId) : `${t("Рівень досвіду {level}", { level: experience.level })} · ${t("Досвід: {xp}", { xp: formatNumber(experience.points) })}`)}
                    </p>
                    <div className="Inventory__amounts" role="group" aria-label={t("Скільки класти в слот")}>
                        {AMOUNTS.map(option => (
                            <button key={option.value} className={`Inventory__amount${amount === option.value ? " Inventory__amount--active" : ""}`}
                                aria-pressed={amount === option.value}
                                onClick={() => setAmountChoice({ station: stationSlug, value: option.value })}>
                                {t(option.label)}
                            </button>
                        ))}
                    </div>
                </div>
                {selectedStack && details.length > 0 && <div className="Inventory__tooltip">
                    <strong>{itemName(selectedStack.itemId)}</strong>
                    {details.map(line => <span key={line}>{line}</span>)}
                </div>}
                {selectedStack && <div className="Inventory__actions">
                    {isBanner && <button className="mc-btn mc-btn--green" disabled={isBusy} onClick={() => runAction(() => hangBanner(selected))}>{t("Повісити в профілі")}</button>}
                    {(isFood || isPotion) && <button className="mc-btn mc-btn--green Inventory__eat" disabled={isBusy} onClick={consumeSelected}>{t(isFood ? "З'їсти" : "Використати")}{isXpBottle && selectedStack.quantity > 1 ? ` (${selectedStack.quantity})` : ""}</button>}
                    {!equipped.has(selected) && <button className="mc-btn Inventory__recycle" disabled={isBusy} onClick={recycleSelected}>{t(recycling === selected ? "Точно переробити?" : "Переробити на досвід")}</button>}
                </div>}
                <div className="Inventory__grid" ref={grid} style={{ gridTemplateColumns: `repeat(${INVENTORY_CONF.columns}, minmax(0, 1fr))` }}>
                    {order.map((id, index) => {
                        const stack = id ? stacks.get(id) : null
                        const quantity = id ? remaining.get(id) ?? 0 : 0
                        const item = quantity > 0 ? stack?.itemId : null
                        const damage = stack?.components?.damage ?? 0
                        return <button type="button" className={`Inventory__slot${drag.over === `inventory-${index}` ? " Inventory__slot--target" : ""}${selected === id && item ? " Inventory__slot--selected" : ""}`}
                            key={index} data-inventory-index={index}
                            onClick={() => item && clickStack(id)}
                            aria-label={item ? t("{item}, кількість {count}, слот {number}", { item: stackLabel(stack, catalog), count: quantity, number: index + 1 }) : t("Порожній слот {number}", { number: index + 1 })}>
                            {item && <span className="Inventory__item" data-stack-id={id}
                                onPointerDown={event => drag.begin(event, { area: "inventory", index, stackId: id }, { icon: itemIcon(item, stack.components), count: amount === "all" ? quantity : Math.min(amount, quantity) })}
                                onContextMenu={event => event.preventDefault()}>
                                {stack.components?.banner_patterns?.length
                                    ? <Banner base={item.slug.replace(/_banner$/, "")} layers={stack.components.banner_patterns} className="Inventory__banner" />
                                    : <ServerImage imgSrc={itemIcon(item, stack.components)} imgClass="Inventory__image" alt="" />}
                                {(quantity > 1 || potionMark(stack.components?.potion)) && <span className="Inventory__count">{quantity > 1 ? quantity : potionMark(stack.components?.potion)}</span>}
                                {equipped.has(id) && <span className="Inventory__equipped" aria-hidden="true" />}
                                {damage > 0 && <span className="Inventory__durability"><i style={{ width: `${100 - damage / item.maxDurability * 100}%` }} /></span>}
                            </span>}
                        </button>
                    })}
                </div>
            </section>
        </div>

        {drag.ghost && <div className="Inventory__ghost" ref={drag.ghostNode} aria-hidden="true">
            <ServerImage imgSrc={drag.ghost.icon} imgClass="Inventory__image" />
            {drag.ghost.count > 1 && <span className="Inventory__count">{drag.ghost.count}</span>}
        </div>}

        <StationsSheet open={sheet === "stations"} onClose={() => setSheet(null)} />
        <ShopSheet open={sheet === "shop"} onClose={() => setSheet(null)} />
        <RecipeSheet open={sheet === "recipes"} onClose={() => setSheet(null)} placeStation={recipeStations[layout.grid ? "grid" : station.uiType]} onPlace={placeRecipe} />
    </main>
}

export default Inventory
