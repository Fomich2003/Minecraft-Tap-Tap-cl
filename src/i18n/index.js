import { useSyncExternalStore } from "react"

// Базова мова живе прямо в коді: рядок українською і є ключем перекладу, тому вона не потребує файлу
const DEFAULT_LANGUAGE = "uk"
const STORAGE_KEY = "language"
const FONT_LINK_ID = "language-font"

let language = DEFAULT_LANGUAGE
let locale = null
const listeners = new Set()

function readSavedLanguage() {
    try {
        return localStorage.getItem(STORAGE_KEY)
    } catch {
        return null
    }
}

function saveLanguage(code) {
    try {
        localStorage.setItem(STORAGE_KEY, code)
    } catch {
        // Без збереження мову просто доведеться обрати ще раз
    }
}

const fontUrl = font => `https://fonts.googleapis.com/css2?family=${font.family.replaceAll(" ", "+")}${font.axis ?? ""}&display=swap`

// Noto Sans покриває лише латиницю, кирилицю й грецьку. Шрифт іншої писемності вантажиться за потреби
function applyFont(font) {
    const root = document.documentElement
    document.getElementById(FONT_LINK_ID)?.remove()
    root.style.removeProperty("--font-script")
    if (!font) return

    const link = document.createElement("link")
    link.id = FONT_LINK_ID
    link.rel = "stylesheet"
    link.href = fontUrl(font)
    document.head.append(link)
    root.style.setProperty("--font-script", `"${font.family}"`)
}

function applyToDocument(code, meta) {
    document.documentElement.lang = code
    document.documentElement.dir = meta?.rtl ? "rtl" : "ltr"
    applyFont(meta?.font)
}

async function changeLanguage(code) {
    const loaded = code === DEFAULT_LANGUAGE ? null : await fetch(`/locales/${code}.json`).then(response => {
        if (!response.ok) throw new Error(`Locale ${code}: ${response.status}`)
        return response.json()
    })
    language = code
    locale = loaded
    applyToDocument(code, loaded?.meta)
    saveLanguage(code)
    listeners.forEach(listener => listener())
}

// Без збереженої мови гра стартує українською. Якщо файл не завантажився, теж
async function initLanguage() {
    const saved = readSavedLanguage()
    if (!saved || saved === DEFAULT_LANGUAGE) return
    await changeLanguage(saved).catch(error => console.warn(error.message))
}

const hasChosenLanguage = () => Boolean(readSavedLanguage())

const subscribe = listener => {
    listeners.add(listener)
    return () => listeners.delete(listener)
}

// Досить підписати корінь: зміна мови перемальовує все дерево під ним
const useLanguage = () => useSyncExternalStore(subscribe, () => language)

const getLanguage = () => language

function t(key, params) {
    const template = locale?.ui[key] ?? key
    return params ? template.replace(/\{(\w+)\}/g, (match, name) => params[name] ?? match) : template
}

const itemName = item => locale?.items[item.slug] ?? item.name

// group: enchantments, potions, trimMaterials, trimPatterns, banners
const gameName = (group, id, fallback) => locale?.[group]?.[id] ?? fallback ?? id

export { DEFAULT_LANGUAGE, changeLanguage, initLanguage, hasChosenLanguage, useLanguage, getLanguage, t, itemName, gameName, fontUrl }
