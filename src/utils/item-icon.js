// Зілля й стріли забарвлені вмістом: іконки створює server/src/scripts/export-visual-assets.js
const TINTED_ITEMS = new Set(["potion", "splash_potion", "lingering_potion", "tipped_arrow"])

const POTION_BASES = new Set([
    "awkward", "fire_resistance", "harming", "healing", "infested", "invisibility", "leaping", "luck", "mundane", "night_vision", "oozing", "poison",
    "regeneration", "slow_falling", "slowness", "strength", "swiftness", "thick", "turtle_master", "water", "water_breathing", "weakness", "weaving", "wind_charged",
])

function itemIcon(item, components) {
    const base = components?.potion?.replace(/^(long|strong)_/, "")
    return TINTED_ITEMS.has(item?.slug) && POTION_BASES.has(base) ? `/items/potions/${item.slug}_${base}.png` : item?.icon
}

const slugIcon = (slug, components) => itemIcon({ slug, icon: `/items/${slug}.png` }, components)

export { itemIcon, slugIcon }
