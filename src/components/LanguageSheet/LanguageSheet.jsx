import "./LanguageSheet.scss"
import { useEffect, useMemo, useState } from "react"
import BottomSheet from "../BottomSheet/BottomSheet"
import { useUserContext } from "../../context/UserContext"
import { changeLanguage, DEFAULT_LANGUAGE, fontUrl, getLanguage, t } from "../../i18n"

const BASE_LANGUAGE = { code: DEFAULT_LANGUAGE, native: "Українська", name: "Ukrainian" }

// Шрифти потрібні, щоб назву кожної мови було видно її ж письмом навіть без системного шрифту.
// Браузер вантажить файл лише тоді, коли рядок дійде до екрана (content-visibility у стилях).
function loadListFonts(languages) {
    const fonts = new Map(languages.filter(language => language.font).map(language => [language.font.family, language.font]))
    for (const font of fonts.values()) {
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = fontUrl(font)
        document.head.append(link)
    }
}

// Спершу поточна мова й мова Telegram, щоб у довгому списку не довелось шукати свою
function languageRank(language, current) {
    if (language.code === current) return 0
    const telegram = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code?.toLowerCase()
    if (!telegram) return 2
    const code = language.code.toLowerCase()
    return code === telegram || code === telegram.split("-")[0] ? 1 : 2
}

function LanguageSheet({ open, onClose }) {
    const { saveLanguage } = useUserContext()
    const [languages, setLanguages] = useState(null)
    const [query, setQuery] = useState("")
    const [pending, setPending] = useState(null)
    const [failed, setFailed] = useState(false)

    // Список із майже трьох сотень мов потрібен рідко, тому не входить у стартовий бандл
    useEffect(() => {
        if (!open || languages) return
        fetch("/locales/languages.json")
            .then(response => response.json())
            .then(list => {
                loadListFonts(list)
                setLanguages([BASE_LANGUAGE, ...list])
            })
            .catch(() => setFailed(true))
    }, [open, languages])

    const current = getLanguage()

    const shown = useMemo(() => {
        const text = query.trim().toLowerCase()
        return (languages ?? [])
            .filter(language => !text
                || language.native.toLowerCase().includes(text)
                || language.name.toLowerCase().includes(text)
                || language.code.toLowerCase().startsWith(text))
            .sort((left, right) => languageRank(left, current) - languageRank(right, current))
    }, [languages, query, current])

    const choose = async code => {
        setPending(code)
        setFailed(false)
        try {
            await changeLanguage(code)
            saveLanguage(code)
            onClose()
        } catch (error) {
            console.warn(error.message)
            setFailed(true)
        }
        setPending(null)
    }

    return (
        <BottomSheet open={open} onClose={onClose} label={t("Мова")}>
            {failed && <p className="BottomSheet__message">{t("Ой! Щось пішло не так, спробуйте пізніше...")}</p>}
            <input
                className="BottomSheet__search"
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder={t("Пошук мови")}
                aria-label={t("Пошук мови")}
            />
            <div className="LanguageSheet__list">
                {!languages && !failed && <p className="BottomSheet__status">{t("Завантаження...")}</p>}
                {shown.map(language => (
                    <button
                        key={language.code}
                        lang={language.code}
                        dir="auto"
                        className={`LanguageSheet__item${language.code === current ? " LanguageSheet__item--active" : ""}`}
                        aria-current={language.code === current ? "true" : undefined}
                        disabled={Boolean(pending)}
                        onClick={() => choose(language.code)}
                    >
                        <strong style={language.font ? { fontFamily: `"Noto Sans", "${language.font.family}", sans-serif` } : undefined}>{language.native}</strong>
                        <small lang={current}>{language.name}{language.partial ? ` · ${t("Перекладено лише назви предметів")}` : ""}</small>
                    </button>
                ))}
                {languages && shown.length === 0 && <p className="BottomSheet__status">{t("Нічого не знайдено")}</p>}
            </div>
        </BottomSheet>
    )
}

export default LanguageSheet
