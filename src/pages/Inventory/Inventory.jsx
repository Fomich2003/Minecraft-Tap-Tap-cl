import "./Inventory.scss"
import { useMemo, useRef, useState } from "react"
import { useUserContext } from "../../context/UserContext"
import ServerImage from "../../components/ServerImage/ServerImage"
import { INVENTORY_CONF } from "../../config/inventory.config"
import { STATION_LAYOUTS } from "../../config/stations.config"
import getInventorySize from "../../utils/inventory"
import { describeComponents } from "../../utils/item-details"
import StationPanel from "./StationPanel"
import JobPanel from "./JobPanel"
import StationsSheet from "./StationsSheet"
import ShopSheet from "./ShopSheet"

const STORAGE_KEY = "minecraft-tap-tap-inventory-layout"
const NO_SLOTS = {}

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
    const { inventory, stations, catalog } = useUserContext()
    const [layoutVersion, setLayoutVersion] = useState(0)
    const [placement, setPlacement] = useState({ station: null, slots: NO_SLOTS })
    const [selected, setSelected] = useState(null)
    const [dragOver, setDragOver] = useState(null)
    const [sheet, setSheet] = useState(null)
    const dragSource = useRef(null)

    const station = stations.find(entry => entry.active) ?? stations[0]
    const layout = station ? STATION_LAYOUTS[station.uiType] : null
    const stacks = useMemo(() => new Map((inventory?.items ?? []).map(item => [String(item._id), item])), [inventory])
    // eslint-disable-next-line react-hooks/exhaustive-deps -- розкладка читається з localStorage після кожного перестановлення
    const order = useMemo(() => arrangeStacks(inventory?.items ?? []), [inventory, layoutVersion])

    // Вміст слотів належить лише активному верстаку
    const placed = placement.station === station?.slug ? placement.slots : NO_SLOTS
    const setPlaced = update => setPlacement(current => ({
        station: station?.slug,
        slots: update(current.station === station?.slug ? current.slots : NO_SLOTS),
    }))

    const usedByStack = useMemo(() => {
        const used = new Map()
        for (const { entry, count } of Object.values(placed)) {
            const id = String(entry._id)
            used.set(id, (used.get(id) ?? 0) + count)
        }
        return used
    }, [placed])

    const remaining = id => {
        const stack = stacks.get(id)
        return stack ? stack.quantity - (usedByStack.get(id) ?? 0) : 0
    }

    const putIntoSlot = (stackId, slotKey) => {
        const stack = stacks.get(stackId)
        if (!stack) return
        const single = layout.single
        setPlaced(current => {
            const next = { ...current }
            delete next[slotKey]
            const others = Object.values(next).filter(value => String(value.entry._id) === stackId).reduce((sum, value) => sum + value.count, 0)
            const available = stack.quantity - others
            if (available < 1) return current
            next[slotKey] = { entry: stack, count: single ? 1 : available }
            return next
        })
    }

    const clearSlot = slotKey => setPlaced(current => {
        const next = { ...current }
        delete next[slotKey]
        return next
    })

    const dropOnSlot = slotKey => {
        const source = dragSource.current
        dragSource.current = null
        setDragOver(null)
        if (!source) return
        if (source.area === "inventory") {
            putIntoSlot(source.stackId, slotKey)
        } else if (source.key !== slotKey) {
            setPlaced(current => {
                const next = { ...current }
                const moved = next[source.key]
                if (!moved) return current
                if (next[slotKey]) next[source.key] = next[slotKey]
                else delete next[source.key]
                next[slotKey] = moved
                return next
            })
        }
    }

    const dropOnInventory = index => {
        const source = dragSource.current
        dragSource.current = null
        setDragOver(null)
        if (!source) return
        if (source.area === "craft") {
            clearSlot(source.key)
        } else if (source.index !== index) {
            const next = [...order]
            ;[next[source.index], next[index]] = [next[index], next[source.index]]
            saveLayout(next)
            setLayoutVersion(version => version + 1)
        }
    }

    const clickSlot = slotKey => {
        if (placed[slotKey]) clearSlot(slotKey)
        else if (selected && remaining(selected) > 0) putIntoSlot(selected, slotKey)
    }

    const finishTouchDrag = event => {
        const touch = event.changedTouches[0]
        if (!touch || !dragSource.current) return
        const target = document.elementFromPoint(touch.clientX, touch.clientY)
        const craftSlot = target?.closest("[data-craft-index]")
        const inventorySlot = target?.closest("[data-inventory-index]")
        if (craftSlot) {
            if (event.cancelable) event.preventDefault()
            const key = craftSlot.dataset.craftIndex
            if (dragSource.current.area === "craft" && dragSource.current.key === key) clearSlot(key)
            else dropOnSlot(key)
        } else if (inventorySlot) {
            dropOnInventory(Number(inventorySlot.dataset.inventoryIndex))
        }
        dragSource.current = null
    }

    const handlers = {
        setDragOver,
        dropOnSlot,
        clickSlot,
        dragFromSlot: key => { dragSource.current = { area: "craft", key } },
    }

    if (!inventory || !station) return <h1>Інвентар порожній</h1>

    const selectedStack = selected ? stacks.get(selected) : null
    const details = describeComponents(selectedStack, catalog)
    const onApplied = () => setPlaced(() => NO_SLOTS)
    const Panel = layout.timed ? JobPanel : StationPanel

    return <main id="Inventory" className="Inventory" onTouchEnd={finishTouchDrag} onTouchCancel={() => { dragSource.current = null }}>
        <div className="Inventory__wrapper">
            <section className="Inventory__craft" aria-label="Верстак">
                <div className="Inventory__toolbar">
                    <button className="Inventory__button" onClick={() => setSheet("stations")}>
                        <ServerImage imgSrc={station.icon} alt="" />
                        <span>{station.name}</span>
                    </button>
                    <button className="Inventory__button Inventory__button--ghost" onClick={() => setSheet("shop")}>Магазин</button>
                </div>
                <Panel key={station.slug} station={station} placed={placed} dragOver={dragOver} handlers={handlers} onApplied={onApplied} />
            </section>
            <section className="Inventory__items" aria-label="Інвентар">
                <p className="Inventory__details">
                    {selectedStack ? [selectedStack.itemId.name, ...details].join(" · ") : "Інвентар"}
                </p>
                <div className="Inventory__grid" style={{ gridTemplateColumns: `repeat(${INVENTORY_CONF.columns}, minmax(0, 1fr))` }}>
                    {order.map((id, index) => {
                        const stack = id ? stacks.get(id) : null
                        const quantity = id ? remaining(id) : 0
                        const item = quantity > 0 ? stack?.itemId : null
                        const damage = stack?.components?.damage ?? 0
                        return <div className={`Inventory__slot${dragOver === index ? " Inventory__slot--target" : ""}${selected === id && item ? " Inventory__slot--selected" : ""}`}
                            key={index} data-inventory-index={index}
                            onDragOver={event => { event.preventDefault(); setDragOver(index) }}
                            onDragLeave={() => setDragOver(null)}
                            onDrop={event => { event.preventDefault(); dropOnInventory(index) }}
                            onClick={() => item && setSelected(selected === id ? null : id)}
                            aria-label={item ? `${item.name}, кількість ${quantity}, слот ${index + 1}` : `Порожній слот ${index + 1}`}>
                            {item && <div className="Inventory__item" draggable
                                onDragStart={event => {
                                    dragSource.current = { area: "inventory", index, stackId: id }
                                    event.dataTransfer.effectAllowed = "move"
                                    event.dataTransfer.setData("text/plain", String(index))
                                }}
                                onDragEnd={() => { dragSource.current = null; setDragOver(null) }}
                                onTouchStart={() => { dragSource.current = { area: "inventory", index, stackId: id } }}>
                                <ServerImage imgSrc={item.icon} imgClass="Inventory__image" alt={item.name} />
                                {quantity > 1 && <span className="Inventory__count">{quantity}</span>}
                                {damage > 0 && <span className="Inventory__durability"><i style={{ width: `${100 - damage / item.maxDurability * 100}%` }} /></span>}
                            </div>}
                        </div>
                    })}
                </div>
            </section>
        </div>
        <StationsSheet open={sheet === "stations"} onClose={() => setSheet(null)} />
        <ShopSheet open={sheet === "shop"} onClose={() => setSheet(null)} />
    </main>
}

export default Inventory
