import "./Cards.scss"
import { useEffect, useMemo, useRef, useState } from "react"
import { useUserContext } from "../../context/UserContext"
import GameCard from "../../components/GameCard/GameCard"
import { cardName } from "../../components/GameCard/cardName"
import BottomSheet from "../../components/BottomSheet/BottomSheet"
import ServerImage from "../../components/ServerImage/ServerImage"
import { RARITIES, SUITS } from "../../config/cards.config"
import { LOCATION_NAMES } from "../../config/quests.config"
import { CoinIcon } from "../../utils/icons"
import { formatNumber } from "../../utils/format"
import { haptic } from "../../utils/telegram"
import { t } from "../../i18n"

const LOCATIONS = Object.keys(LOCATION_NAMES)
const LOCATION_ICONS = {
    surface: "/items/grass_block.png", caves: "/items/stone.png", depths: "/items/deepslate.png", nether: "/items/netherrack.png", end: "/items/end_stone.png",
}

// Усі комбо видно завжди: неактивні підказують, яку колоду зібрати
const COMBOS = [
    { id: "pack", icon: "/items/wolf_spawn_egg.png", title: "Зграя", text: "3 карти однієї масті: її бонус ×1,5" },
    { id: "horde", icon: "/items/zombie_head.png", title: "Орда", text: "5 карт однієї масті: її бонус ×2" },
    { id: "elements", icon: "/items/beacon.png", title: "Чотири стихії", text: "Усі чотири масті в колоді: +10% монет" },
    { id: "biome", icon: "/items/filled_map.png", title: "Біом", text: "3 карти з однієї локації: +15% дропу в ній" },
]

const BONUS_ROWS = [
    { key: "coins", icon: null, text: "монет за тап" },
    { key: "blockDrop", icon: "/items/iron_pickaxe.png", text: "дропу з блоків" },
    { key: "mobDrop", icon: "/items/iron_sword.png", text: "луту з мобів" },
    { key: "xp", icon: "/items/experience_bottle.png", text: "досвіду" },
]

const formatPercent = value => `+${formatNumber(value)}%`

function comboDetail(combo) {
    if (combo.suit) return t(SUITS[combo.suit].name)
    if (combo.location) return t(LOCATION_NAMES[combo.location])
    return null
}

function DeckSlots({ deck, slots, slotLevels, cardsBySlug, onOpen, onEmpty }) {
    return (
        <div className="Cards__slots">
            {slotLevels.map((level, index) => {
                const card = cardsBySlug.get(deck[index])
                if (card) return <GameCard key={card.slug} card={card} size="small" onClick={() => onOpen(card)} />
                if (index < slots) return (
                    <button key={`empty-${index}`} type="button" className="Cards__slot" onClick={onEmpty} aria-label={t("Порожній слот")}>
                        <span>+</span>
                    </button>
                )
                return (
                    <span key={`locked-${index}`} className="Cards__slot Cards__slot--locked" role="img"
                        aria-label={t("Слот відкриється на рівні {level}", { level })}>
                        <ServerImage imgSrc="/items/iron_bars.png" alt="" />
                        <small>{level}</small>
                    </span>
                )
            })}
        </div>
    )
}

function CardDetails({ card, inDeck, deckFull, busy, onToggle }) {
    const known = card.copies > 0
    const target = card.kind === "mob" ? "На цьому мобі: {value} монет і луту" : "На цьому блоці: {value} монет і дропу"
    const suit = SUITS[card.suit]
    return (
        <div className="Cards__details">
            <div className="Cards__details-card" key={card.slug}>
                <GameCard card={card} size="large" />
            </div>
            <div className="Cards__details-tags">
                <span className={`Cards__rarity Cards__rarity--${card.rarity}`}>{t(RARITIES[card.rarity])}</span>
                <span className="Cards__tag"><ServerImage imgSrc={suit.icon} alt="" />{t(suit.name)}</span>
                <span className="Cards__tag"><ServerImage imgSrc={LOCATION_ICONS[card.location]} alt="" />{t(LOCATION_NAMES[card.location])}</span>
            </div>

            {known
                ? <div className="Cards__progress">
                    <span>{card.next ? t("Копій: {current} / {needed}", { current: card.copies, needed: card.next }) : t("Максимальний рівень")}</span>
                    <div className={`mc-xp${card.next ? "" : " mc-xp--full"}`} role="progressbar" aria-valuemin={0} aria-valuemax={card.next ?? card.max} aria-valuenow={card.copies}>
                        <i style={{ width: `${Math.min(100, card.copies / (card.next ?? card.max) * 100)}%` }} />
                    </div>
                </div>
                : <p className="Cards__hint">{t(card.kind === "mob" ? "Випадає під час ударів по цьому мобу" : "Випадає під час тапів по цьому блоку")}</p>}

            <ul className="Cards__effects">
                {!known && <li className="Cards__effects-head">{t("На першому рівні")}</li>}
                <li><ServerImage imgSrc={card.icon} alt="" />{t(target, { value: formatPercent(card.resonance) })}</li>
                <li><ServerImage imgSrc={suit.icon} alt="" />{t("Масть «{suit}»: {value} {effect}", { suit: t(suit.name), value: formatPercent(card.suitBonus), effect: t(suit.effect) })}</li>
            </ul>
            {!card.next && known && <p className="Cards__hint">{t("Нові копії цієї карти стають досвідом")}</p>}

            {known && <button className={`mc-btn mc-btn--block ${inDeck ? "" : "mc-btn--green"}`} disabled={busy || (!inDeck && deckFull)} onClick={onToggle}>
                {t(inDeck ? "Прибрати з колоди" : deckFull ? "Колода заповнена" : "Покласти в колоду")}
            </button>}
        </div>
    )
}

function Cards() {
    const { loadCards, saveDeck } = useUserContext()
    const [data, setData] = useState(null)
    const [failed, setFailed] = useState(false)
    const [location, setLocation] = useState("surface")
    const [openSlug, setOpenSlug] = useState(null)
    const [busy, setBusy] = useState(false)
    const [message, setMessage] = useState("")
    const album = useRef(null)

    useEffect(() => {
        let cancelled = false
        loadCards().then(result => {
            if (cancelled) return
            if (result.success) setData(result)
            setFailed(!result.success)
        })
        return () => { cancelled = true }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- колода читається при відкритті сторінки
    }, [])

    const cardsBySlug = useMemo(() => new Map((data?.cards ?? []).map(card => [card.slug, card])), [data])
    const shown = useMemo(() => (data?.cards ?? []).filter(card => card.location === location), [data, location])

    if (failed) return <main id="Cards"><p className="Cards__status">{t("Не вдалося завантажити карти")}</p></main>
    if (!data) return <main id="Cards"><p className="Cards__status">{t("Завантаження...")}</p></main>

    const openCard = cardsBySlug.get(openSlug)
    const inDeck = openCard ? data.deck.includes(openCard.slug) : false
    const deckFull = data.deck.length >= data.slots

    const toggleCard = async () => {
        if (busy || !openCard) return
        setBusy(true)
        setMessage("")
        const deck = inDeck ? data.deck.filter(slug => slug !== openCard.slug) : [...data.deck, openCard.slug]
        const result = await saveDeck(deck)
        setBusy(false)
        if (result.success) {
            setData(result)
            setOpenSlug(null)
            haptic("success")
        } else {
            setMessage(result.message)
            haptic("error")
        }
    }

    const scrollToAlbum = () => album.current?.scrollIntoView({ behavior: "smooth", block: "start" })

    return (
        <main id="Cards">
            <h1 className="visually-hidden">{t("Карти")}</h1>

            <section className="Cards__deck mc-panel">
                <div className="Cards__head">
                    <h2>{t("Колода")}</h2>
                    <span className="Cards__count">{data.deck.length} / {data.slots}</span>
                </div>
                <DeckSlots {...data} cardsBySlug={cardsBySlug} onOpen={card => setOpenSlug(card.slug)} onEmpty={scrollToAlbum} />

                <ul className="Cards__bonus">
                    {BONUS_ROWS.map(row => (
                        <li key={row.key} className={data.bonus[row.key] > 0 ? "Cards__bonus--on" : ""}>
                            {row.icon ? <ServerImage imgSrc={row.icon} alt="" /> : <CoinIcon />}
                            <span className="Cards__bonus-text">
                                <strong>{formatPercent(data.bonus[row.key])}</strong>
                                <span>{t(row.text)}</span>
                            </span>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="Cards__combos" aria-label={t("Комбо")}>
                {COMBOS.map(combo => {
                    const active = data.combos.filter(entry => entry.id === combo.id)
                    return (
                        <article key={combo.id} className={`Cards__combo mc-panel${active.length ? " Cards__combo--active" : ""}`}>
                            <span className="Cards__combo-icon"><ServerImage imgSrc={combo.icon} alt="" /></span>
                            <div>
                                <h3>{t(combo.title)}{active.length > 0 && <em>{active.map(comboDetail).filter(Boolean).join(", ") || t("Активне")}</em>}</h3>
                                <p>{t(combo.text)}</p>
                            </div>
                        </article>
                    )
                })}
            </section>

            <section className="Cards__album" ref={album}>
                <div className="Cards__head">
                    <h2>{t("Альбом")}</h2>
                    <span className="Cards__count">{data.collected} / {data.total}</span>
                </div>
                <p className="Cards__note">
                    {t("Карти випадають під час тапів. Кожна зібрана карта дає {value} монет за тап.", { value: formatPercent(0.25) })}
                    {data.bonus.collection > 0 && <strong> {t("Зараз: {value}", { value: formatPercent(data.bonus.collection) })}</strong>}
                </p>

                <div className="Cards__filters" role="tablist">
                    {LOCATIONS.map(id => {
                        const all = data.cards.filter(card => card.location === id)
                        const owned = all.filter(card => card.copies > 0).length
                        return (
                            <button key={id} role="tab" aria-selected={location === id} aria-label={t(LOCATION_NAMES[id])}
                                className={`Cards__filter${location === id ? " Cards__filter--active" : ""}`} onClick={() => setLocation(id)}>
                                <ServerImage imgSrc={LOCATION_ICONS[id]} alt="" />
                                <small>{owned}/{all.length}</small>
                            </button>
                        )
                    })}
                </div>
                <h3 className="Cards__location">{t(LOCATION_NAMES[location])}</h3>

                <div className="Cards__grid" key={location}>
                    {shown.map((card, index) => (
                        <div key={card.slug} className="Cards__cell" style={{ animationDelay: `${Math.min(index, 15) * 40}ms` }}>
                            <GameCard card={card} selected={data.deck.includes(card.slug)} onClick={() => { setMessage(""); setOpenSlug(card.slug) }} />
                        </div>
                    ))}
                </div>
            </section>

            <BottomSheet open={Boolean(openCard)} onClose={() => setOpenSlug(null)} label={openCard ? (openCard.copies > 0 ? cardName(openCard) : t("Невідома карта")) : t("Карти")}>
                {message && <p className="BottomSheet__message">{message}</p>}
                {openCard && <CardDetails card={openCard} inDeck={inDeck} deckFull={deckFull} busy={busy} onToggle={toggleCard} />}
            </BottomSheet>
        </main>
    )
}

export default Cards
