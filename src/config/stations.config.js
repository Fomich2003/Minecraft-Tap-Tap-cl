// Слоти кожного типу верстака. amount: скільки предметів кладеться за раз, якщо гравець не обрав інше
const GRID_SLOTS = Array.from({ length: 9 }, (_, index) => ({ key: String(index), label: "" }))

const STATION_LAYOUTS = {
    grid: { slots: GRID_SLOTS, grid: true, amount: 1 },
    stonecutter: { slots: [{ key: "input", label: "Блок" }], choices: "recipes" },
    smithing: {
        slots: [
            { key: "template", label: "Шаблон" },
            { key: "base", label: "Предмет" },
            { key: "addition", label: "Матеріал" },
        ],
    },
    anvil: {
        slots: [
            { key: "left", label: "Предмет" },
            { key: "right", label: "Додаток" },
        ],
    },
    grindstone: {
        slots: [
            { key: "top", label: "Предмет" },
            { key: "bottom", label: "Другий" },
        ],
    },
    enchanting: {
        slots: [
            { key: "item", label: "Предмет" },
            { key: "lapis", label: "Лазурит" },
        ],
        choices: "offers",
    },
    loom: {
        slots: [
            { key: "banner", label: "Банер" },
            { key: "dye", label: "Барвник" },
            { key: "pattern", label: "Візерунок" },
        ],
        choices: "patterns",
    },
    cartography: {
        slots: [
            { key: "map", label: "Мапа" },
            { key: "addition", label: "Додаток" },
        ],
    },
    cooking: {
        slots: [
            { key: "input", label: "Сировина" },
            { key: "fuel", label: "Паливо" },
        ],
        timed: true,
    },
    brewing: {
        slots: [
            { key: "bottle", label: "Пляшечки" },
            { key: "reagent", label: "Інгредієнт" },
            { key: "fuel", label: "Порох" },
        ],
        timed: true,
    },
}

const slotsPayload = placed => Object.fromEntries(Object.entries(placed).map(([key, value]) => [key, value.entry._id]))

export { STATION_LAYOUTS, slotsPayload }
