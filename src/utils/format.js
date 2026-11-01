import { getLanguage } from "../i18n"

const COMPACT = { notation: "compact", maximumFractionDigits: 1 }

const formats = new Map()

// Цифри завжди латинські: піксельний шрифт монет не містить інших
function numberFormat(language, options) {
    const key = `${language}:${options?.notation ?? "full"}`
    if (!formats.has(key)) {
        let format
        try {
            format = new Intl.NumberFormat(language === "uk" ? "uk-UA" : `${language}-u-nu-latn`, options)
        } catch {
            format = new Intl.NumberFormat("uk-UA", options)
        }
        formats.set(key, format)
    }
    return formats.get(key)
}

const formatNumber = value => numberFormat(getLanguage()).format(value ?? 0)

// Для вузьких місць: мільярд монет не влізе в колонку п'єдесталу
const formatCompact = value => numberFormat(getLanguage(), COMPACT).format(value ?? 0)

export { formatCompact, formatNumber }
