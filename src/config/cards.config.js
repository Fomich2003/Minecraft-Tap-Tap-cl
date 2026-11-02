// Масті, рідкісність і тло карт. Цифри бонусів надсилає сервер, клієнт лише підписує їх
const SUITS = {
    mine: { name: "Копальня", icon: "/items/iron_pickaxe.png", effect: "дропу з блоків" },
    nature: { name: "Природа", icon: "/items/oak_sapling.png", effect: "монет за тап" },
    monsters: { name: "Монстри", icon: "/items/iron_sword.png", effect: "луту з мобів" },
    magic: { name: "Магія", icon: "/items/ender_eye.png", effect: "досвіду" },
}

const RARITIES = {
    common: "Звичайна",
    rare: "Рідкісна",
    epic: "Епічна",
    legendary: "Легендарна",
}

const MAX_CARD_LEVEL = 5

export { SUITS, RARITIES, MAX_CARD_LEVEL }
