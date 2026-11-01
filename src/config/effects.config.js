// Назви й пояснення ефектів. Числа збігаються із server/src/data/effects.js
const EFFECTS = {
    strength: { name: "Сила", hint: "+30% монет за кожен рівень", color: "#ffc700" },
    speed: { name: "Швидкість", hint: "+1 до сили удару за кожен рівень", color: "#33ebff" },
    luck: { name: "Везіння", hint: "+20% до шансу дропа за кожен рівень", color: "#59c106" },
    regeneration: { name: "Регенерація", hint: "Кожен зламаний блок лагодить інструмент на 1 за кожен рівень", color: "#cd5cab" },
    night_vision: { name: "Нічне бачення", hint: "+1 до сили удару по рудах", color: "#c2ff66" },
    fire_resistance: { name: "Вогнестійкість", hint: "+1 до сили удару по блоках Незеру", color: "#ff9900" },
    saturation: { name: "Насиченість", hint: "+15% монет", color: "#f82423" },
}

const TOOL_SLOTS = [
    { kind: "pickaxe", name: "Кайло", hint: "Камінь, руди, Незер", icon: "/items/iron_pickaxe.png" },
    { kind: "axe", name: "Сокира", hint: "Дерево", icon: "/items/iron_axe.png" },
    { kind: "shovel", name: "Лопата", hint: "Земля, пісок, гравій", icon: "/items/iron_shovel.png" },
    { kind: "sword", name: "Меч", hint: "Бій із мобами", icon: "/items/iron_sword.png" },
]

export { EFFECTS, TOOL_SLOTS }
