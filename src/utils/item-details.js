import { gameName, itemName, t } from "../i18n"

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"]

const romanLevel = level => ROMAN[level] ?? level

// Подовжені й посилені зілля мають назву базового
function potionName(potion, catalog) {
    const base = potion.replace(/^(long|strong)_/, "")
    return gameName("potions", base, catalog?.potionNames?.[base] ?? potion)
}

// Позначка на іконці: посилене й подовжене зілля мають той самий колір, що й звичайне
function potionMark(potion) {
    if (potion?.startsWith("strong_")) return "II"
    return potion?.startsWith("long_") ? "+" : ""
}

const potionLabel = (potion, catalog) => [potionName(potion, catalog), potionMark(potion)].filter(Boolean).join(" ")

// Назва конкретного стака: усі зілля в каталозі це один предмет, а різняться вони властивостями
function stackLabel({ itemId: item, components }, catalog) {
    if (!components?.potion) return itemName(item)
    const label = potionLabel(components.potion, catalog)
    return item.slug === "potion" ? label : `${itemName(item)}: ${label}`
}

const enchantmentName = (id, catalog) => gameName("enchantments", id, catalog?.enchantmentNames?.[id] ?? id)

// Опис властивостей конкретного стака для панелі під інвентарем
function describeComponents(entry, catalog) {
    const item = entry?.itemId
    const components = entry?.components
    if (!item) return []
    const lines = []

    if (item.maxDurability) {
        lines.push(t("Міцність: {current} / {max}", { current: item.maxDurability - (components?.damage ?? 0), max: item.maxDurability }))
    }
    if (!components) return lines

    if (components.potion) lines.push(potionLabel(components.potion, catalog))
    for (const list of [components.enchantments, components.stored_enchantments]) {
        for (const [id, level] of Object.entries(list ?? {})) {
            lines.push(`${enchantmentName(id, catalog)} ${romanLevel(level)}`)
        }
    }
    if (components.trim) {
        lines.push(t("Оздоблення: {pattern}, {material}", {
            pattern: gameName("trimPatterns", components.trim.pattern, catalog?.trimPatterns?.[components.trim.pattern]),
            material: gameName("trimMaterials", components.trim.material, catalog?.trimMaterials?.[components.trim.material]),
        }))
    }
    if (components.dyed_color !== undefined) lines.push(t("Колір: {color}", { color: `#${components.dyed_color.toString(16).padStart(6, "0")}` }))
    if (components.banner_patterns?.length) lines.push(t("Візерунків: {count}", { count: components.banner_patterns.length }))
    if (components.fireworks) lines.push(t("Тривалість польоту: {count}", { count: components.fireworks.flight_duration }))
    if (components.map_scale !== undefined) lines.push(t("Масштаб мапи: {count}", { count: components.map_scale }))
    return lines
}

export { describeComponents, potionLabel, potionMark, stackLabel, enchantmentName, romanLevel }
