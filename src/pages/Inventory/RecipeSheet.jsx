import { useEffect, useMemo, useState } from "react"
import BottomSheet from "../../components/BottomSheet/BottomSheet"
import ServerImage from "../../components/ServerImage/ServerImage"
import { useUserContext } from "../../context/UserContext"
import { getLanguage, t } from "../../i18n"
import { stackLabel } from "../../utils/item-details"
import { slugIcon } from "../../utils/item-icon"

const PAGE_SIZE = 45
const GRID_SIZE = 9
const PLACE_LABELS = { crafting_table: "Покласти на верстак", brewing_stand: "Покласти у варильну стійку" }

// Клітинка рецепта може приймати кілька предметів: показуємо той, що вже є в гравця
function cellIcon(options, owned) {
    return `/items/${options.find(slug => owned.has(slug)) ?? options[0]}.png`
}

function RecipeGrid({ recipe, owned }) {
    const rows = Math.ceil(recipe.cells.length / recipe.width)
    const cells = Array.from({ length: GRID_SIZE }, (_, index) => {
        const row = Math.floor(index / 3)
        const column = index % 3
        if (column >= recipe.width || row >= rows) return null
        return recipe.cells[row * recipe.width + column] ?? null
    })
    return (
        <div className="Recipe__grid" aria-hidden="true">
            {cells.map((options, index) => (
                <span key={index} className="Recipe__cell">{options && <ServerImage imgSrc={cellIcon(options, owned)} alt="" />}</span>
            ))}
        </div>
    )
}

// Рецепт зілля: пляшечка з певним вмістом та інгредієнт
function BrewingGrid({ brewing }) {
    return (
        <div className="Recipe__grid Recipe__grid--brewing" aria-hidden="true">
            <span className="Recipe__cell"><ServerImage imgSrc={slugIcon(brewing.bottle, { potion: brewing.potion })} alt="" /></span>
            <span className="Recipe__cell"><ServerImage imgSrc={slugIcon(brewing.reagent)} alt="" /></span>
        </div>
    )
}

function RecipeSheet({ open, onClose, placeStation, onPlace }) {
    const { user, catalog, inventory, loadRecipes } = useUserContext()
    const [recipes, setRecipes] = useState(null)
    const [query, setQuery] = useState("")
    const [limit, setLimit] = useState(PAGE_SIZE)
    const [chosen, setChosen] = useState(null)
    const [tab, setTab] = useState("crafts")
    const unlocked = Boolean(user.knowledge)

    useEffect(() => {
        if (!open || !unlocked || recipes) return
        let cancelled = false
        loadRecipes().then(result => {
            if (!cancelled && result.success) setRecipes(result.recipes)
        })
        return () => { cancelled = true }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- рецепти вантажаться один раз за сесію
    }, [open, unlocked, recipes])

    const names = useMemo(() => new Map((catalog?.items ?? []).map(item => [item.slug, item])), [catalog])
    const owned = useMemo(() => new Set((inventory?.items ?? []).map(stack => stack.itemId?.slug)), [inventory])
    const language = getLanguage()
    const nameOf = ({ slug, components }) => (names.get(slug) ? stackLabel({ itemId: names.get(slug), components }, catalog) : slug)
    const shown = useMemo(() => {
        const text = query.trim().toLowerCase()
        return (recipes ?? []).filter(recipe => {
            if (Boolean(recipe.brewing) !== (tab === "potions") || !names.has(recipe.result.slug)) return false
            return !text || nameOf(recipe.result).toLowerCase().includes(text) || recipe.result.slug.includes(text)
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps -- назви залежать від мови
    }, [recipes, names, query, tab, language])

    const switchTab = next => {
        setTab(next)
        setChosen(null)
        setLimit(PAGE_SIZE)
    }

    return (
        <BottomSheet open={open} onClose={onClose} label={t("Книга рецептів")}>
            {!unlocked && <div className="Recipe__locked">
                <ServerImage imgSrc="/items/knowledge_book.png" alt="" />
                <p>{t("Купи книгу знань у магазині, і відкриються всі рецепти та зілля.")}</p>
            </div>}

            {unlocked && <div className="BottomSheet__tabs">
                <button className={`BottomSheet__tab${tab === "crafts" ? " BottomSheet__tab--active" : ""}`} onClick={() => switchTab("crafts")}>{t("Крафти")}</button>
                <button className={`BottomSheet__tab${tab === "potions" ? " BottomSheet__tab--active" : ""}`} onClick={() => switchTab("potions")}>{t("Зілля")}</button>
            </div>}

            {unlocked && chosen && <div className="Recipe__detail">
                {chosen.brewing ? <BrewingGrid brewing={chosen.brewing} /> : <RecipeGrid recipe={chosen} owned={owned} />}
                <span className="Recipe__arrow" aria-hidden="true">▶</span>
                <span className="Recipe__result">
                    <ServerImage imgSrc={slugIcon(chosen.result.slug, chosen.result.components)} alt="" />
                    {(chosen.result.quantity ?? 1) > 1 && <small>{chosen.result.quantity}</small>}
                </span>
                <strong>{nameOf(chosen.result)}</strong>
                {placeStation === chosen.station && <button className="mc-btn mc-btn--green mc-btn--small" onClick={() => onPlace(chosen)}>{t(PLACE_LABELS[chosen.station])}</button>}
            </div>}

            {unlocked && <>
                <input
                    className="BottomSheet__search"
                    value={query}
                    onChange={event => { setQuery(event.target.value); setLimit(PAGE_SIZE) }}
                    placeholder={t("Пошук предмета")}
                    aria-label={t("Пошук предмета")}
                />
                <div className="BottomSheet__list Recipe__list">
                    {!recipes && <p className="BottomSheet__status">{t("Завантаження...")}</p>}
                    {shown.slice(0, limit).map(recipe => (
                        <button key={recipe.key} className={`Inventory__choice${chosen?.key === recipe.key ? " Inventory__choice--active" : ""}`} aria-label={nameOf(recipe.result)} onClick={() => setChosen(recipe)}>
                            <ServerImage imgSrc={slugIcon(recipe.result.slug, recipe.result.components)} alt="" />
                        </button>
                    ))}
                    {recipes && shown.length === 0 && <p className="BottomSheet__status">{t("Нічого не знайдено")}</p>}
                    {shown.length > limit && <button className="mc-btn mc-btn--small BottomSheet__more" onClick={() => setLimit(limit + PAGE_SIZE)}>{t("Показати ще")}</button>}
                </div>
            </>}
        </BottomSheet>
    )
}

export default RecipeSheet
