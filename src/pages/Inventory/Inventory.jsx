import "./Inventory.scss"
import { useEffect, useRef, useState } from "react"
import { useUserContext } from "../../context/UserContext"
import ServerImage from "../../components/ServerImage/ServerImage"
import { INVENTORY_CONF } from "../../config/inventory.config"
import getInventorySize from "../../utils/inventory"
import inventoryService from "../../services/inventory.service"

const STORAGE_KEY = "minecraft-tap-tap-inventory-layout"
const EMPTY_CRAFT = () => Array(9).fill(null)
const itemKey = entry => String(entry?.itemId?._id ?? entry?.itemId ?? "")
const stackKey = entry => String(entry?._id ?? itemKey(entry))

function readSavedLayout() {
    try {
        const value = localStorage.getItem(STORAGE_KEY)
        return value ? JSON.parse(value) : null
    } catch {
        return null
    }
}

function returnToInventory(slots, preferredIndex, entry) {
    let remaining = entry.quantity
    const maxStack = entry.itemId?.stackable === false ? 1 : Number(entry.itemId?.maxStack) || 64
    const matching = slots.map((slot, index) => ({ slot, index }))
        .filter(({ slot }) => slot && itemKey(slot) === itemKey(entry))
        .sort((a, b) => Number(b.index === preferredIndex) - Number(a.index === preferredIndex))

    for (const { slot, index } of matching) {
        const amount = Math.min(maxStack - slot.quantity, remaining)
        if (amount <= 0) continue
        slots[index] = { ...slot, quantity: slot.quantity + amount }
        remaining -= amount
        if (!remaining) return true
    }

    for (const index of [preferredIndex, ...slots.map((_, i) => i).filter(i => i !== preferredIndex)]) {
        if (slots[index]) continue
        const amount = Math.min(maxStack, remaining)
        slots[index] = { ...entry, quantity: amount }
        remaining -= amount
        if (!remaining) return true
    }
    return false
}

function Inventory() {
    const { inventory, telegramData, craftItems } = useUserContext()
    const [grid, setGrid] = useState([])
    const [craftGrid, setCraftGrid] = useState(EMPTY_CRAFT)
    const [recipes, setRecipes] = useState([])
    const [isCrafting, setIsCrafting] = useState(false)
    const [craftMessage, setCraftMessage] = useState("")
    const [draggedSlot, setDraggedSlot] = useState(null)
    const [dragOverSlot, setDragOverSlot] = useState(null)
    const dragSource = useRef(null)

    useEffect(() => {
        let cancelled = false
        inventoryService.getWorkbenchRecipes(telegramData).then(result => {
            if (!cancelled && result.success) setRecipes(result.recipes || [])
            else if (!cancelled) setCraftMessage(result.message || "Не вдалося завантажити рецепти")
        }).catch(() => {
            if (!cancelled) setCraftMessage("Не вдалося завантажити рецепти")
        })
        return () => { cancelled = true }
    }, [telegramData])

    useEffect(() => {
        if (!Array.isArray(inventory?.items)) return
        const items = inventory.items
        const saved = readSavedLayout()
        const size = Math.max(getInventorySize(items.length), Array.isArray(saved) ? saved.length : 0)
        const next = Array(size).fill(null)
        const byStack = new Map(items.filter(item => item._id).map(item => [String(item._id), item]))
        const byItem = new Map()
        items.forEach(item => {
            const id = itemKey(item)
            if (!byItem.has(id)) byItem.set(id, [])
            byItem.get(id).push(item)
        })
        const placed = new Set()
        if (Array.isArray(saved)) saved.forEach((id, index) => {
            if (!id || index >= size) return
            const item = byStack.get(String(id)) || byItem.get(String(id))?.find(candidate => !placed.has(stackKey(candidate)))
            if (!item || placed.has(stackKey(item))) return
            next[index] = item
            placed.add(stackKey(item))
        })
        items.forEach(item => {
            if (placed.has(stackKey(item))) return
            const slot = next.indexOf(null)
            if (slot !== -1) next[slot] = item
        })
        setGrid(next)
        setCraftGrid(EMPTY_CRAFT())
    }, [inventory])

    const saveLayout = slots => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(slots.map(item => item ? stackKey(item) : null)))
        } catch (error) {
            console.warn("Не вдалося зберегти розкладку інвентаря", error)
        }
    }

    const moveItem = targetIndex => {
        if (draggedSlot === null || draggedSlot === targetIndex) return
        setGrid(current => {
            const next = [...current]
            const source = next[draggedSlot]
            const target = next[targetIndex]
            if (source && target && itemKey(source) === itemKey(target)) {
                const max = source.itemId?.stackable === false ? 1 : Number(source.itemId?.maxStack) || 64
                const amount = Math.min(source.quantity, Math.max(0, max - target.quantity))
                if (!amount) return current
                next[targetIndex] = { ...target, quantity: target.quantity + amount }
                next[draggedSlot] = source.quantity === amount ? null : { ...source, quantity: source.quantity - amount }
            } else [next[draggedSlot], next[targetIndex]] = [next[targetIndex], next[draggedSlot]]
            saveLayout(next)
            return next
        })
        setDraggedSlot(null)
        setDragOverSlot(null)
    }

    const moveToCraft = targetIndex => {
        const source = dragSource.current
        if (!source) return
        if (source.area === "inventory") {
            const entry = grid[source.index]
            if (!entry) return
            const nextInventory = [...grid]
            const nextCraft = [...craftGrid]
            nextInventory[source.index] = entry.quantity > 1 ? { ...entry, quantity: entry.quantity - 1 } : null
            if (nextCraft[targetIndex] && !returnToInventory(nextInventory, source.index, nextCraft[targetIndex])) return
            nextCraft[targetIndex] = { ...entry, quantity: 1 }
            setGrid(nextInventory)
            setCraftGrid(nextCraft)
            saveLayout(nextInventory)
        } else if (source.area === "craft" && source.index !== targetIndex) {
            const next = [...craftGrid]
            ;[next[source.index], next[targetIndex]] = [next[targetIndex], next[source.index]]
            setCraftGrid(next)
        }
        dragSource.current = null
        setDraggedSlot(null)
        setDragOverSlot(null)
    }

    const moveToInventory = targetIndex => {
        const source = dragSource.current
        if (!source || source.area !== "craft") return moveItem(targetIndex)
        const entry = craftGrid[source.index]
        if (!entry) return
        const nextInventory = [...grid]
        const nextCraft = [...craftGrid]
        const destination = nextInventory[targetIndex]
        if (destination && itemKey(destination) === itemKey(entry)) {
            const max = entry.itemId?.stackable === false ? 1 : Number(entry.itemId?.maxStack) || 64
            const amount = Math.min(entry.quantity, Math.max(0, max - destination.quantity))
            if (!amount) return
            nextInventory[targetIndex] = { ...destination, quantity: destination.quantity + amount }
            nextCraft[source.index] = amount === entry.quantity ? null : { ...entry, quantity: entry.quantity - amount }
        } else if (!destination) {
            nextInventory[targetIndex] = entry
            nextCraft[source.index] = null
        } else {
            nextInventory[targetIndex] = entry
            nextCraft[source.index] = { ...destination, quantity: 1 }
            if (destination.quantity > 1 && !returnToInventory(nextInventory, targetIndex, { ...destination, quantity: destination.quantity - 1 })) return
        }
        setGrid(nextInventory)
        setCraftGrid(nextCraft)
        saveLayout(nextInventory)
        dragSource.current = null
        setDraggedSlot(null)
        setDragOverSlot(null)
    }

    const recipeMatches = recipe => {
        const actual = craftGrid.map(entry => entry?.itemId?.slug || null)
        if (recipe.shapeless) {
            const groups = (recipe.ingredients || []).flatMap(ingredient =>
                Array.from({ length: ingredient.quantity || 1 }, () => (ingredient.itemIds || []).map(item => item.slug))
            )
            const match = (remainingGroups, remainingItems) => {
                if (!remainingGroups.length) return remainingItems.length === 0
                remainingGroups.sort((a, b) => a.length - b.length)
                const group = remainingGroups[0]
                for (let position = 0; position < remainingItems.length; position += 1) {
                    if (!group.includes(remainingItems[position])) continue
                    const next = [...remainingItems]
                    next.splice(position, 1)
                    if (match(remainingGroups.slice(1), next)) return true
                }
                return false
            }
            const actualItems = actual.filter(Boolean)
            return actualItems.length === groups.length && match(groups, actualItems)
        }
        const occupied = recipe.pattern.map((slot, index) => ({ slot, row: Math.floor(index / 3), column: index % 3 }))
            .filter(({ slot }) => slot?.itemId || slot?.itemIds?.length)
        if (!occupied.length) return false
        const minRow = Math.min(...occupied.map(value => value.row))
        const maxRow = Math.max(...occupied.map(value => value.row))
        const minColumn = Math.min(...occupied.map(value => value.column))
        const maxColumn = Math.max(...occupied.map(value => value.column))
        const width = maxColumn - minColumn + 1
        const height = maxRow - minRow + 1
        for (let mirror = 0; mirror < 2; mirror += 1) {
            for (let rowOffset = 0; rowOffset <= 3 - height; rowOffset += 1) {
                for (let columnOffset = 0; columnOffset <= 3 - width; columnOffset += 1) {
                    const acceptedBySlot = Array(9).fill(null)
                    for (const { slot, row, column } of occupied) {
                        const sourceColumn = column - minColumn
                        const targetColumn = mirror ? width - 1 - sourceColumn : sourceColumn
                        const targetRow = row - minRow
                        const accepted = slot.itemIds?.length ? slot.itemIds.map(item => item.slug) : [slot.itemId.slug]
                        acceptedBySlot[(rowOffset + targetRow) * 3 + columnOffset + targetColumn] = accepted
                    }
                    if (acceptedBySlot.every((accepted, index) => accepted ? accepted.includes(actual[index]) : !actual[index])) return true
                }
            }
        }
        return false
    }

    const activeRecipe = recipes.find(recipeMatches)
    const handleCraft = async () => {
        if (!activeRecipe || isCrafting) return
        setIsCrafting(true)
        setCraftMessage("")
        try {
            const result = await craftItems(activeRecipe._id, craftGrid.map(entry => entry?.itemId?.slug || null))
            if (result.success) setCraftGrid(EMPTY_CRAFT())
            else setCraftMessage(result.message || "Не вдалося створити предмет")
        } catch (error) {
            setCraftMessage(error?.message || "Не вдалося створити предмет")
        } finally {
            setIsCrafting(false)
        }
    }

    const finishTouchDrag = event => {
        const touch = event.changedTouches[0]
        if (!touch || !dragSource.current) return
        const target = document.elementFromPoint(touch.clientX, touch.clientY)
        const craftSlot = target?.closest("[data-craft-index]")
        const inventorySlot = target?.closest("[data-inventory-index]")
        if (craftSlot) moveToCraft(Number(craftSlot.dataset.craftIndex))
        else if (inventorySlot) moveToInventory(Number(inventorySlot.dataset.inventoryIndex))
        else setDraggedSlot(null)
        dragSource.current = null
        setDraggedSlot(null)
    }

    if (!inventory) return <h1>Інвентар порожній</h1>

    return <main id="Inventory" className="Inventory" onTouchEnd={finishTouchDrag}>
        <div className="Inventory__wrapper">
            <section className="Inventory__craft" aria-label="Поле крафту">
                <h2 className="Inventory__section-title">Крафт</h2>
                <div className="Inventory__craft-layout">
                    <div className="Inventory__craft-grid" aria-label="Сітка крафту 3 на 3">
                        {craftGrid.map((entry, index) => <div
                            className={`Inventory__craft-slot${dragOverSlot === `craft-${index}` ? " Inventory__craft-slot--target" : ""}`}
                            key={index}
                            data-craft-index={index}
                            onDragOver={event => { event.preventDefault(); setDragOverSlot(`craft-${index}`) }}
                            onDragLeave={() => setDragOverSlot(null)}
                            onDrop={event => { event.preventDefault(); moveToCraft(index) }}
                            onTouchStart={() => { if (craftGrid[index]) dragSource.current = { area: "craft", index } }}
                            aria-label={`Слот крафту ${index + 1}`}
                        >{entry && <div className="Inventory__craft-item" draggable onDragStart={event => {
                            dragSource.current = { area: "craft", index }
                            event.dataTransfer.effectAllowed = "move"
                        }} onDragEnd={() => { dragSource.current = null }}>
                            <ServerImage imgSrc={entry.itemId.icon} imgClass="Inventory__image" />
                            <span className="Inventory__count">{entry.quantity}</span>
                        </div>}</div>)}
                    </div>
                    <span className="Inventory__craft-arrow" aria-hidden="true">↓</span>
                    <button type="button" className={`Inventory__craft-result${activeRecipe ? " Inventory__craft-result--ready" : ""}`}
                        aria-label={activeRecipe ? `Створити ${activeRecipe.result.itemId.name}, кількість ${activeRecipe.result.quantity}` : "Результат крафту"}
                        disabled={!activeRecipe || isCrafting} onClick={handleCraft}>
                        {activeRecipe && <>
                            <ServerImage imgSrc={activeRecipe.result.itemId.icon} imgClass="Inventory__image" />
                            <span className="Inventory__craft-result-count">{activeRecipe.result.quantity}</span>
                        </>}
                    </button>
                </div>
                <p className="Inventory__craft-message" aria-live="polite">{isCrafting ? "Створення предмета..." : craftMessage}</p>
            </section>
            <section className="Inventory__items" aria-label="Інвентар">
                <h2 className="Inventory__section-title">Інвентар</h2>
                <div className="Inventory__grid" style={{ gridTemplateColumns: `repeat(${INVENTORY_CONF.columns}, minmax(0, 1fr))` }}>
                    {grid.map((entry, index) => {
                        const item = entry?.itemId
                        return <div className={`Inventory__slot${dragOverSlot === index ? " Inventory__slot--target" : ""}`}
                            key={index} data-inventory-index={index}
                            onDragOver={event => { event.preventDefault(); setDragOverSlot(index) }}
                            onDragLeave={() => setDragOverSlot(null)}
                            onDrop={event => { event.preventDefault(); moveToInventory(index) }}
                            aria-label={item ? `${item.name}, кількість ${entry.quantity}, слот ${index + 1}` : `Порожній слот ${index + 1}`}>
                            {item && <div className="Inventory__item" draggable
                                onDragStart={event => {
                                    setDraggedSlot(index)
                                    dragSource.current = { area: "inventory", index }
                                    event.dataTransfer.effectAllowed = "move"
                                    event.dataTransfer.setData("text/plain", String(index))
                                }}
                                onDragEnd={() => { dragSource.current = null; setDraggedSlot(null); setDragOverSlot(null) }}
                                onTouchStart={() => { setDraggedSlot(index); dragSource.current = { area: "inventory", index } }}>
                                <ServerImage imgSrc={item.icon} imgClass="Inventory__image" />
                                <span className="Inventory__count">{entry.quantity}</span>
                            </div>}
                        </div>
                    })}
                </div>
            </section>
        </div>
    </main>
}

export default Inventory
