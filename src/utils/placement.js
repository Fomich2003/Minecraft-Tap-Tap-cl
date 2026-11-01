// Вміст слотів верстака. Сервер списує предмети за типом і властивостями, а не за конкретним стаком,
// тому слот зберігає тип предмета: 64 + 10 дощок у двох стаках для нього один запас.

const identityOf = entry => `${entry.itemId?._id}|${entry.stackKey ?? ""}`

const maxStackOf = entry => (entry.itemId?.stackable === false ? 1 : Math.max(1, entry.itemId?.maxStack ?? 64))

const countInSlots = (slots, id, exceptKey) => Object.entries(slots)
    .filter(([key, value]) => key !== exceptKey && identityOf(value.entry) === id)
    .reduce((sum, [, value]) => sum + value.count, 0)

// Узгоджує слоти з інвентарем після будь-якої його зміни: продаж, крафт, об'єднання стаків
function reconcilePlacement(slots, stacks) {
    const pools = new Map()
    for (const stack of stacks) {
        const id = identityOf(stack)
        const pool = pools.get(id)
        if (pool) pool.free += stack.quantity
        else pools.set(id, { entry: stack, free: stack.quantity })
    }

    const next = {}
    for (const [key, value] of Object.entries(slots)) {
        const pool = pools.get(identityOf(value.entry))
        if (!pool || pool.free < 1) continue
        const count = Math.min(value.count, pool.free, maxStackOf(pool.entry))
        next[key] = { entry: pool.entry, count }
        pool.free -= count
    }
    return next
}

// amount: число або "all". Той самий предмет докладається, інший замінює вміст слота
function addToSlot(slots, stacks, stack, slotKey, amount) {
    const id = identityOf(stack)
    const current = slots[slotKey]
    const inSlot = current && identityOf(current.entry) === id ? current.count : 0
    const owned = stacks.filter(entry => identityOf(entry) === id).reduce((sum, entry) => sum + entry.quantity, 0)
    const room = Math.min(owned - countInSlots(slots, id, slotKey), maxStackOf(stack)) - inSlot
    const added = amount === "all" ? room : Math.min(amount, room)
    if (added < 1) return slots
    return { ...slots, [slotKey]: { entry: stack, count: inSlot + added } }
}

function moveBetweenSlots(slots, fromKey, toKey) {
    const moved = slots[fromKey]
    if (!moved || fromKey === toKey) return slots
    const target = slots[toKey]
    const next = { ...slots }

    if (target && identityOf(target.entry) === identityOf(moved.entry)) {
        const shifted = Math.min(maxStackOf(moved.entry) - target.count, moved.count)
        next[toKey] = { ...target, count: target.count + shifted }
        if (moved.count > shifted) next[fromKey] = { ...moved, count: moved.count - shifted }
        else delete next[fromKey]
        return next
    }

    next[toKey] = moved
    if (target) next[fromKey] = target
    else delete next[fromKey]
    return next
}

function clearSlot(slots, slotKey) {
    const next = { ...slots }
    delete next[slotKey]
    return next
}

// used: скільки предметів сервер реально забрав зі слота. Решта залишається для наступного крафту
function spendFromSlots(slots, used) {
    const next = {}
    for (const [key, value] of Object.entries(slots)) {
        const count = value.count - (used[key] ?? 0)
        if (count > 0) next[key] = { ...value, count }
    }
    return next
}

// Скільки кожного стака лишається в інвентарі. Спершу зменшуються останні стаки, щоб повні не "моргали"
function remainingByStack(stacks, slots) {
    const reserved = new Map()
    for (const { entry, count } of Object.values(slots)) {
        const id = identityOf(entry)
        reserved.set(id, (reserved.get(id) ?? 0) + count)
    }

    const remaining = new Map()
    for (let index = stacks.length - 1; index >= 0; index -= 1) {
        const stack = stacks[index]
        const id = identityOf(stack)
        const taken = Math.min(stack.quantity, reserved.get(id) ?? 0)
        reserved.set(id, (reserved.get(id) ?? 0) - taken)
        remaining.set(String(stack._id), stack.quantity - taken)
    }
    return remaining
}

// Скільки разів поспіль можна виконати крафт із поточним вмістом слотів
function maxCraftTimes(slots, uses) {
    const entries = Object.entries(uses ?? {}).filter(([, quantity]) => quantity > 0)
    if (!entries.length) return 1
    return Math.max(1, Math.min(...entries.map(([key, quantity]) => Math.floor((slots[key]?.count ?? 0) / quantity))))
}

export {
    identityOf, reconcilePlacement, addToSlot, moveBetweenSlots, clearSlot, spendFromSlots, remainingByStack, maxCraftTimes,
}
