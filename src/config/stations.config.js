// Слоти кожного типу верстака. amount: скільки предметів кладеться за раз, якщо гравець не обрав інше.
// arrange: як слоти стоять на панелі, щоб вона нагадувала інтерфейс цього верстака в грі
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
        arrange: "plus",
    },
    grindstone: {
        slots: [
            { key: "top", label: "Предмет" },
            { key: "bottom", label: "Другий" },
        ],
        arrange: "column",
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
        choices: "locations",
        arrange: "column",
    },
    cooking: {
        slots: [
            { key: "input", label: "Сировина" },
            { key: "fuel", label: "Паливо" },
        ],
        timed: true,
        arrange: "furnace",
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

// Підпис верстака у списку: що на ньому робиться
const STATION_INFO = {
    crafting_table: "Створення предметів 3×3",
    campfire: "Смажить їжу без палива",
    furnace: "Плавить руду й готує їжу",
    stonecutter: "Ріже камінь на блоки",
    smoker: "Удвічі швидше готує їжу",
    loom: "Візерунки на банерах",
    cartography_table: "Мапи й експедиції за здобиччю",
    grindstone: "Знімає чари й лагодить",
    blast_furnace: "Удвічі швидше плавить руду",
    smithing_table: "Незерит і оздоблення броні",
    anvil: "Поєднує чари й лагодить за досвід",
    brewing_stand: "Варить зілля",
    enchanting_table: "Зачаровує за досвід і лазурит",
}

// Текстура блока верстака з гри для шапки панелі
const stationFace = slug => `/assets/stations/${slug}.png`

const slotsPayload = placed => Object.fromEntries(Object.entries(placed).map(([key, value]) => [key, value.entry._id]))

export { STATION_INFO, STATION_LAYOUTS, slotsPayload, stationFace }
