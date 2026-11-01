import { getLanguage } from "../i18n"

const formats = new Map()

// Цифри завжди латинські: піксельний шрифт монет не містить інших
function numberFormat(language) {
    if (!formats.has(language)) {
        let format
        try {
            format = new Intl.NumberFormat(language === "uk" ? "uk-UA" : `${language}-u-nu-latn`)
        } catch {
            format = new Intl.NumberFormat("uk-UA")
        }
        formats.set(language, format)
    }
    return formats.get(language)
}

const formatNumber = value => numberFormat(getLanguage()).format(value ?? 0)

export { formatNumber }
