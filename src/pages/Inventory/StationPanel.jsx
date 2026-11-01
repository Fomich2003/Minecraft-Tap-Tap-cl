import { useEffect, useState } from "react"
import ServerImage from "../../components/ServerImage/ServerImage"
import Banner from "../../components/Banner/Banner"
import { StationSlot, ResultButton } from "./StationSlots"
import stationService from "../../services/station.service"
import { useUserContext } from "../../context/UserContext"
import { STATION_LAYOUTS, slotsPayload } from "../../config/stations.config"
import { maxCraftTimes } from "../../utils/placement"
import { haptic } from "../../utils/telegram"
import { enchantmentName } from "../../utils/item-details"
import { gameName, itemName, t } from "../../i18n"

const PREVIEW_DELAY_MS = 120
const MAX_BOOKSHELVES = 18

function StationPanel({ station, placed, dragOver, handlers, onApplied }) {
    const { user, telegramData, catalog, applyResult, installBookshelves } = useUserContext()
    const layout = STATION_LAYOUTS[station.uiType]
    const [loaded, setLoaded] = useState(null)
    const [options, setOptions] = useState({})
    const [message, setMessage] = useState("")
    const [isBusy, setIsBusy] = useState(false)

    const hasItems = Object.keys(placed).length > 0
    const placementKey = JSON.stringify([Object.entries(placed).map(([key, value]) => [key, value.entry._id, value.count]), options])

    useEffect(() => {
        if (!hasItems) return
        let cancelled = false
        const timer = setTimeout(async () => {
            const response = await stationService.preview(telegramData, station.slug, slotsPayload(placed), options)
            if (!cancelled) setLoaded({ key: placementKey, preview: response.success ? response.preview : null })
        }, PREVIEW_DELAY_MS)
        return () => {
            cancelled = true
            clearTimeout(timer)
        }
    }, [hasItems, placed, options, placementKey, station.slug, telegramData])

    // Попередній результат лишається на екрані, але застарілий не можна натиснути
    const preview = hasItems ? loaded?.preview ?? null : null
    const isFresh = loaded?.key === placementKey
    const times = preview?.repeatable && preview.result ? maxCraftTimes(placed, preview.uses) : 1

    const apply = async requestedTimes => {
        setIsBusy(true)
        setMessage("")
        const response = applyResult(await stationService.apply(telegramData, station.slug, slotsPayload(placed), options, requestedTimes))
        setIsBusy(false)
        if (response.success) {
            haptic("success")
            if (!preview?.repeatable) setOptions({})
            onApplied(response.used)
        } else {
            haptic("error")
            setMessage(response.message || t("Не вдалося створити предмет"))
        }
    }

    const installShelves = async () => {
        setIsBusy(true)
        const result = await installBookshelves()
        setIsBusy(false)
        setMessage(result.success ? "" : result.message)
        haptic(result.success ? "success" : "error")
    }

    const choices = preview?.choices ?? []
    const shelves = user.bookshelves ?? 0
    const bannerBase = placed.banner?.entry.itemId.slug.replace(/_banner$/, "")
    const bannerLayers = placed.banner?.entry.components?.banner_patterns ?? []
    const dyeColor = placed.dye?.entry.itemId.slug.replace(/_dye$/, "")
    const chosenRecipe = options.recipeKey ? choices.find(choice => choice.recipeKey === options.recipeKey) : null
    const chosenItem = chosenRecipe && catalog?.items.find(entry => entry.slug === chosenRecipe.result.slug)
    const shownMessage = message || (preview?.message && t(preview.message))

    return <>
        <div className={`Inventory__craft-layout${layout.grid ? "" : " Inventory__craft-layout--slots"}`}>
            <div className={layout.grid ? "Inventory__craft-grid" : "Inventory__station-slots"}>
                {layout.slots.map(slot => <StationSlot key={slot.key} slot={slot} placed={placed} dragOver={dragOver} handlers={handlers} />)}
            </div>
            <span className="Inventory__craft-arrow" aria-hidden="true">▶</span>
            <div className="Inventory__result">
                <ResultButton result={preview?.result} catalog={catalog} disabled={isBusy || !isFresh} xpCost={preview?.xpCost} onClick={() => apply(1)} />
                {times > 1 && <button className="mc-btn mc-btn--small mc-btn--green Inventory__craft-all" disabled={isBusy || !isFresh} onClick={() => apply(times)}>
                    {t("Усе ×{count}", { count: times })}
                </button>}
            </div>
        </div>

        {station.uiType === "enchanting" && <div className="Inventory__shelves">
            <div className="Inventory__shelf-row" aria-hidden="true">
                {Array.from({ length: MAX_BOOKSHELVES }, (_, index) => <ServerImage key={index} imgSrc="/items/bookshelf.png" imgClass={index < shelves ? "" : "Inventory__shelf--empty"} />)}
            </div>
            <span>{t("Полиці: {count} / {max}", { count: shelves, max: MAX_BOOKSHELVES })}</span>
            {shelves < MAX_BOOKSHELVES && <button className="mc-btn mc-btn--small" disabled={isBusy} onClick={installShelves}>{t("Поставити полиці")}</button>}
        </div>}

        {layout.choices === "recipes" && chosenItem && <p className="Inventory__hint">{itemName(chosenItem)}</p>}
        {layout.choices === "recipes" && choices.length > 0 && <div className="Inventory__choices Inventory__choices--grid">
            {choices.map(choice => {
                const item = catalog?.items.find(entry => entry.slug === choice.result.slug)
                return <button key={choice.recipeKey} aria-label={item && itemName(item)}
                    className={`Inventory__choice${options.recipeKey === choice.recipeKey ? " Inventory__choice--active" : ""}`}
                    onClick={() => setOptions({ recipeKey: choice.recipeKey })}>
                    {item && <ServerImage imgSrc={item.icon} alt={itemName(item)} />}
                    <span>{choice.result.quantity}</span>
                </button>
            })}
        </div>}

        {layout.choices === "offers" && choices.length > 0 && <div className="Inventory__offers">
            {choices.map(choice => {
                const name = enchantmentName(choice.enchantments[0].id, catalog)
                return <button key={choice.index}
                    className={`Inventory__offer${options.offer === choice.index ? " Inventory__offer--active" : ""}`}
                    aria-label={t("{name}… · рівень {level} · лазурит {lapis} · досвід {xp}", { name, level: choice.level, lapis: choice.lapis, xp: choice.xpCost })}
                    onClick={() => setOptions({ offer: choice.index })}>
                    <strong>{name}…</strong>
                    <span aria-hidden="true">
                        <b>{choice.level}</b>
                        <ServerImage imgSrc="/items/lapis_lazuli.png" alt="" />{choice.lapis}
                        <ServerImage imgSrc="/items/experience_bottle.png" alt="" />{choice.xpCost}
                    </span>
                </button>
            })}
        </div>}

        {layout.choices === "patterns" && choices.length > 0 && <div className="Inventory__choices Inventory__choices--patterns">
            {choices.map(choice => <button key={choice.id} aria-label={gameName("banners", choice.id, choice.name)}
                className={`Inventory__choice${options.pattern === choice.id ? " Inventory__choice--active" : ""}`}
                onClick={() => setOptions({ pattern: choice.id })}>
                <Banner base={bannerBase} layers={[...bannerLayers, { pattern: choice.id, color: dyeColor }]} />
            </button>)}
        </div>}

        {shownMessage && <p className="Inventory__message">{shownMessage}</p>}
    </>
}

export default StationPanel
