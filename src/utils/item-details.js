const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"]

// Опис властивостей конкретного стака для панелі під інвентарем
function describeComponents(entry, catalog) {
    const item = entry?.itemId
    const components = entry?.components
    if (!item) return []
    const lines = []

    if (item.maxDurability) {
        lines.push(`Міцність: ${item.maxDurability - (components?.damage ?? 0)} / ${item.maxDurability}`)
    }
    if (!components) return lines

    if (components.potion) lines.push(catalog?.potionNames?.[components.potion] ?? components.potion)
    for (const list of [components.enchantments, components.stored_enchantments]) {
        for (const [id, level] of Object.entries(list ?? {})) {
            lines.push(`${catalog?.enchantmentNames?.[id] ?? id} ${ROMAN[level] ?? level}`)
        }
    }
    if (components.trim) {
        lines.push(`Оздоблення: ${catalog?.trimPatterns?.[components.trim.pattern] ?? components.trim.pattern}, ${catalog?.trimMaterials?.[components.trim.material] ?? components.trim.material}`)
    }
    if (components.dyed_color !== undefined) lines.push(`Колір: #${components.dyed_color.toString(16).padStart(6, "0")}`)
    if (components.banner_patterns?.length) lines.push(`Візерунків: ${components.banner_patterns.length}`)
    if (components.fireworks) lines.push(`Тривалість польоту: ${components.fireworks.flight_duration}`)
    if (components.map_scale !== undefined) lines.push(`Масштаб мапи: ${components.map_scale}`)
    return lines
}

export { describeComponents }
