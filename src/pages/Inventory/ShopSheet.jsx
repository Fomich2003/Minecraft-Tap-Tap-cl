import { useMemo, useState } from "react"
import BottomSheet from "../../components/BottomSheet/BottomSheet"
import ServerImage from "../../components/ServerImage/ServerImage"
import { useUserContext } from "../../context/UserContext"
import { CoinIcon } from "../../utils/icons"
import { formatNumber } from "../../utils/format"
import { getLanguage, itemName, t } from "../../i18n"
import { enchantmentName, potionLabel, romanLevel, stackLabel } from "../../utils/item-details"
import { itemIcon } from "../../utils/item-icon"
import { haptic } from "../../utils/telegram"

const PAGE_SIZE = 45
const MAX_PURCHASE = 64
const VARIANT_SLUGS = new Set(["enchanted_book", "potion", "splash_potion", "lingering_potion"])
const CATEGORIES = [["items", "Предмети"], ["books", "Книги"], ["potions", "Зілля"]]

// Спільна панель вибору кількості для покупки й продажу
function QuantityPanel({ icon, name, max, price, label, gold, busy, onConfirm, onClose }) {
    const [wanted, setWanted] = useState(1)
    const count = Math.max(1, Math.min(wanted, max))
    return (
        <div className="BottomSheet__sell">
            <div className="BottomSheet__sell-head">
                <ServerImage imgSrc={icon} alt="" />
                <strong>{name}</strong>
                <button className="BottomSheet__close" aria-label={t("Закрити")} onClick={onClose}>×</button>
            </div>
            <div className="BottomSheet__sell-row">
                <button className="mc-btn mc-btn--small" aria-label="-1" disabled={count <= 1} onClick={() => setWanted(count - 1)}>−</button>
                <input type="range" min={1} max={max} value={count} disabled={max <= 1} aria-label={t("Кількість")} onChange={event => setWanted(Number(event.target.value))} />
                <button className="mc-btn mc-btn--small" aria-label="+1" disabled={count >= max} onClick={() => setWanted(count + 1)}>+</button>
                <button className="mc-btn mc-btn--small" onClick={() => setWanted(max)}>{t("Усе")}</button>
            </div>
            <button className={`mc-btn ${gold ? "mc-btn--gold" : "mc-btn--green"} mc-btn--block`} disabled={busy} onClick={() => onConfirm(count)}>
                {t(label, { count })} · <CoinIcon /> {formatNumber(price * count)}
            </button>
        </div>
    )
}

function ShopSheet({ open, onClose }) {
    const { user, catalog, inventory, buyItem, sellStack } = useUserContext()
    const [tab, setTab] = useState("buy")
    const [category, setCategory] = useState("items")
    const [query, setQuery] = useState("")
    const [limit, setLimit] = useState(PAGE_SIZE)
    const [buying, setBuying] = useState(null)
    const [message, setMessage] = useState("")
    const [isBusy, setIsBusy] = useState(false)
    const [sellingId, setSellingId] = useState(null)

    const language = getLanguage()
    const matches = useMemo(() => {
        const text = query.trim().toLowerCase()
        return (catalog?.items ?? [])
            .filter(item => item.buyable && !VARIANT_SLUGS.has(item.slug) && (!text || itemName(item).toLowerCase().includes(text) || item.slug.includes(text)))
            .sort((a, b) => a.marketPrice - b.marketPrice)
        // eslint-disable-next-line react-hooks/exhaustive-deps -- назви предметів залежать від мови
    }, [catalog, query, language])

    // Книги й зілля відрізняються властивостями, тому в магазині це окремі позиції одного предмета
    const variants = useMemo(() => {
        if (category === "items") return []
        const text = query.trim().toLowerCase()
        const label = entry => (category === "books" ? `${enchantmentName(entry.enchantment, catalog)} ${romanLevel(entry.level)}` : potionLabel(entry.potion, catalog))
        const slugOf = entry => entry.form ?? "enchanted_book"
        return (catalog?.[category] ?? [])
            .map(entry => {
                const item = catalog.items.find(candidate => candidate.slug === slugOf(entry))
                return { ...entry, slug: slugOf(entry), icon: itemIcon(item, entry.potion ? { potion: entry.potion } : undefined), formName: entry.form && item ? itemName(item) : null, label: label(entry) }
            })
            .filter(entry => !text || entry.label.toLowerCase().includes(text))
            .sort((left, right) => left.label.localeCompare(right.label))
        // eslint-disable-next-line react-hooks/exhaustive-deps -- назви залежать від мови
    }, [catalog, category, query, language])
    const shown = category === "items" ? matches : variants

    const stacks = (inventory?.items ?? []).filter(stack => stack.itemId)
    // Ціну продажу рахує каталог сервера: у стаках лежить збережене значення
    const sellPrices = useMemo(() => new Map((catalog?.items ?? []).map(item => [item.slug, item.sellPrice])), [catalog])
    const sellPriceOf = item => sellPrices.get(item.slug) ?? item.sellPrice
    const selling = stacks.find(stack => String(stack._id) === sellingId) ?? null

    const run = async action => {
        if (isBusy) return
        setIsBusy(true)
        const result = await action()
        setIsBusy(false)
        setMessage(result.success ? "" : result.message)
        haptic(result.success ? "success" : "error")
        return result
    }

    const switchTab = value => {
        setTab(value)
        setMessage("")
        setSellingId(null)
        setBuying(null)
    }

    const sell = async count => {
        const result = await run(() => sellStack(selling._id, count))
        if (result.success) setSellingId(null)
    }

    const buy = async count => {
        const result = await run(() => buyItem(buying.slug, count, buying.variant))
        if (result.success) setBuying(null)
    }

    const startBuying = (entry, name, price, maxPerPurchase = MAX_PURCHASE) => setBuying({
        id: entry.id ?? entry.slug, slug: entry.slug, variant: entry.id, icon: entry.icon, name, price, maxPerPurchase,
    })

    return (
        <BottomSheet open={open} onClose={onClose} label={t("Магазин предметів")} title={t("Магазин")}>
            <div className="BottomSheet__tabs">
                <button className={`BottomSheet__tab${tab === "buy" ? " BottomSheet__tab--active" : ""}`} onClick={() => switchTab("buy")}>{t("Купити")}</button>
                <button className={`BottomSheet__tab${tab === "sell" ? " BottomSheet__tab--active" : ""}`} onClick={() => switchTab("sell")}>{t("Продати")}</button>
            </div>
            {message && <p className="BottomSheet__message">{message}</p>}

            {tab === "buy" ? <>
                <input
                    className="BottomSheet__search"
                    value={query}
                    onChange={event => { setQuery(event.target.value); setLimit(PAGE_SIZE) }}
                    placeholder={t("Пошук предмета")}
                    aria-label={t("Пошук предмета")}
                />
                <div className="BottomSheet__tabs">
                    {CATEGORIES.map(([id, label]) => (
                        <button key={id} className={`BottomSheet__tab${category === id ? " BottomSheet__tab--active" : ""}`} onClick={() => { setCategory(id); setLimit(PAGE_SIZE) }}>{t(label)}</button>
                    ))}
                </div>
                {buying && <QuantityPanel key={buying.id} icon={buying.icon} name={buying.name} price={buying.price} label="Купити {count}" busy={isBusy}
                    max={Math.max(1, Math.min(buying.maxPerPurchase, Math.floor(user.balance / buying.price)))} onConfirm={buy} onClose={() => setBuying(null)} />}
                <div className="BottomSheet__list">
                    {category !== "items" && variants.map(entry => (
                        <div key={entry.id} className="BottomSheet__item">
                            <ServerImage imgSrc={entry.icon} alt="" />
                            <h3>{entry.label}</h3>
                            {entry.formName && <small className="BottomSheet__chance">{entry.formName}</small>}
                            <p><CoinIcon /> {formatNumber(entry.price)}</p>
                            <button className="mc-btn mc-btn--green mc-btn--small BottomSheet__buy" disabled={user.balance < entry.price || isBusy} onClick={() => startBuying(entry, entry.label, entry.price)}>
                                {t("Купити")}
                            </button>
                        </div>
                    ))}
                    {category === "items" && matches.slice(0, limit).map(item => {
                        return (
                            <div key={item.slug} className="BottomSheet__item">
                                <ServerImage imgSrc={item.icon} alt="" />
                                <h3>{itemName(item)}</h3>
                                <p><CoinIcon /> {formatNumber(item.marketPrice)}</p>
                                <button className="mc-btn mc-btn--green mc-btn--small BottomSheet__buy" disabled={user.balance < item.marketPrice || isBusy} onClick={() => startBuying(item, itemName(item), item.marketPrice, item.slug === "knowledge_book" ? 1 : MAX_PURCHASE)}>
                                    {t("Купити")}
                                </button>
                            </div>
                        )
                    })}
                    {shown.length === 0 && <p className="BottomSheet__status">{t("Нічого не знайдено")}</p>}
                    {category === "items" && shown.length > limit && <button className="mc-btn mc-btn--small BottomSheet__more" onClick={() => setLimit(limit + PAGE_SIZE)}>{t("Показати ще")}</button>}
                </div>
            </> : <>
                {selling && <QuantityPanel key={selling._id} icon={itemIcon(selling.itemId, selling.components)} name={stackLabel(selling, catalog)} price={sellPriceOf(selling.itemId)} label="Продати {count}" gold busy={isBusy}
                    max={selling.quantity} onConfirm={sell} onClose={() => setSellingId(null)} />}
                <div className="BottomSheet__list">
                    {stacks.map(stack => {
                        const item = stack.itemId
                        return (
                            <div key={stack._id} className="BottomSheet__item">
                                <ServerImage imgSrc={itemIcon(item, stack.components)} alt="" />
                                <h3>{stackLabel(stack, catalog)}</h3>
                                <p><CoinIcon /> {formatNumber(sellPriceOf(item))} · ×{stack.quantity}</p>
                                <button className="mc-btn mc-btn--small BottomSheet__buy" disabled={!sellPriceOf(item) || isBusy} onClick={() => setSellingId(String(stack._id))}>
                                    {sellPriceOf(item) ? t("Продати") : t("Не продається")}
                                </button>
                            </div>
                        )
                    })}
                    {stacks.length === 0 && <p className="BottomSheet__status">{t("Інвентар порожній")}</p>}
                </div>
            </>}
        </BottomSheet>
    )
}

export default ShopSheet
