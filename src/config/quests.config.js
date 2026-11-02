// Текст і значок кожного лічильника квестів. Цілі й нагороди надсилає сервер
const QUEST_METRICS = {
    taps: { text: "Зробити тапів: {count}", icon: "/items/wooden_pickaxe.png" },
    broken: { text: "Зламати блоків: {count}", icon: "/items/stone.png" },
    kills: { text: "Вбити мобів: {count}", icon: "/items/iron_sword.png" },
    bosses: { text: "Перемогти босів: {count}", icon: "/items/nether_star.png" },
    drops: { text: "Зібрати дроп: {count}", icon: "/items/chest.png" },
    ores: { text: "Добути дроп із руд: {count}", icon: "/items/iron_ore.png" },
    coins: { text: "Заробити монет тапами: {count}", icon: "/items/gold_ingot.png" },
    crafts: { text: "Створити предметів: {count}", icon: "/items/crafting_table.png" },
    cooked: { text: "Приготувати чи виплавити: {count}", icon: "/items/furnace.png" },
    brewed: { text: "Зварити зілля: {count}", icon: "/items/brewing_stand.png" },
    sold: { text: "Продати предметів: {count}", icon: "/items/emerald.png" },
    bought: { text: "Купити предметів: {count}", icon: "/items/gold_nugget.png" },
    consumed: { text: "Використати зілля чи їжу: {count}", icon: "/items/golden_apple.png" },
    awards: { text: "Забрати щоденну нагороду: {count}", icon: "/items/ender_chest.png" },
    dailies: { text: "Виконати щоденних квестів: {count}", icon: "/items/clock.png" },
    level: { text: "Досягти рівня: {count}", icon: "/items/experience_bottle.png" },
    blocks: { text: "Мати блоків: {count}", icon: "/items/grass_block.png" },
    stations: { text: "Купити верстаків: {count}", icon: "/items/anvil.png" },
    cards: { text: "Зібрати різних карт: {count}", icon: "/items/item_frame.png" },
}

// Локації в порядку спуску: сервер надсилає лише їхні ідентифікатори
const LOCATION_NAMES = { surface: "Поверхня", caves: "Печери", depths: "Глибини", nether: "Незер", end: "Край" }

export { QUEST_METRICS, LOCATION_NAMES }
