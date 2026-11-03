import { useEffect, useState } from "react"
import ServerImage from "../../components/ServerImage/ServerImage"
import CardReveal from "../../components/CardReveal/CardReveal"
import stationService from "../../services/station.service"
import { useUserContext } from "../../context/UserContext"
import { LOCATION_NAMES } from "../../config/quests.config"
import { haptic } from "../../utils/telegram"
import { itemName, t } from "../../i18n"
import StationPanel from "./StationPanel"
import ExpeditionMap from "./ExpeditionMap"

const TICK_MS = 1000

// Тривалість походу годинами: розвідник може йти до десяти годин
function formatDuration(ms) {
    const total = Math.max(0, Math.ceil(ms / 1000))
    const hours = Math.floor(total / 3600)
    const minutes = Math.floor(total % 3600 / 60)
    const seconds = total % 60
    const pad = value => String(value).padStart(2, "0")
    return hours ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`
}

const locationName = id => t(LOCATION_NAMES[id] ?? id)

function Loot({ loot, catalog, onClose }) {
    const iconOf = slug => catalog?.items.find(entry => entry.slug === slug)
    return (
        <div className="Expedition__loot" role="status">
            <strong>{t("Знахідки")} · {locationName(loot.location)}</strong>
            <div className="Expedition__finds">
                {loot.items.map(({ slug, quantity }, index) => {
                    const item = iconOf(slug)
                    const treasure = loot.treasure?.slug === slug
                    return <span key={slug} className={`Expedition__find${treasure ? " Expedition__find--treasure" : ""}`} style={{ animationDelay: `${index * 70}ms` }}
                        title={item ? itemName(item) : slug} aria-label={`${item ? itemName(item) : slug} ×${quantity}`}>
                        {item && <ServerImage imgSrc={item.icon} alt="" />}
                        <b>{quantity}</b>
                    </span>
                })}
                {loot.items.length === 0 && <span className="Expedition__empty">{t("Нічого не знайдено")}</span>}
            </div>
            <span className="Expedition__line">
                {loot.treasure && <em>{t("Скарб!")}</em>}
                <span>+{loot.xp} XP</span>
                {loot.mapReturned && <span>{t("Мапа повернулась")}</span>}
            </span>
            <button className="mc-btn mc-btn--small mc-btn--green" onClick={onClose}>{t("Добре")}</button>
        </div>
    )
}

// Стіл картографа: креслить мапи локацій і відправляє з ними розвідника в похід за справжнім часом
function CartographyPanel({ station, placed, dragOver, handlers, onApplied }) {
    const { telegramData, catalog, applyResult, syncProfile } = useUserContext()
    const [expedition, setExpedition] = useState(null)
    const [loadedPlan, setLoadedPlan] = useState(null)
    const [loot, setLoot] = useState(null)
    const [card, setCard] = useState(null)
    const [message, setMessage] = useState("")
    const [confirmRecall, setConfirmRecall] = useState(false)
    const [isBusy, setIsBusy] = useState(false)
    const [now, setNow] = useState(() => Date.now())

    const adopt = value => setExpedition(value ? { ...value, startedAtMs: Date.now() - value.elapsedMs } : null)

    useEffect(() => {
        let cancelled = false
        stationService.expedition(telegramData, station.slug).then(response => {
            if (!cancelled && response.success) adopt(response.expedition)
        })
        return () => { cancelled = true }
    }, [station.slug, telegramData])

    useEffect(() => {
        if (!expedition) return
        const timer = setInterval(() => setNow(Date.now()), TICK_MS)
        return () => clearInterval(timer)
    }, [expedition])

    const map = placed.map?.entry
    const mapId = map && !placed.addition && map.itemId.slug === "filled_map" && map.components?.map_location ? map._id : null

    useEffect(() => {
        if (!mapId) return
        let cancelled = false
        stationService.expeditionPreview(telegramData, station.slug, mapId).then(response => {
            if (!cancelled) setLoadedPlan({ mapId, plan: response.success ? response.plan : null })
        })
        return () => { cancelled = true }
    }, [mapId, station.slug, telegramData])

    const plan = mapId && loadedPlan?.mapId === mapId ? loadedPlan.plan : null

    const run = async action => {
        if (isBusy) return
        setIsBusy(true)
        setMessage("")
        const response = applyResult(await action())
        setIsBusy(false)
        haptic(response.success ? "success" : "error")
        if (!response.success) setMessage(response.message)
        return response
    }

    const start = () => run(async () => {
        const response = await stationService.startExpedition(telegramData, station.slug, mapId)
        if (response.success) {
            adopt(response.expedition)
            onApplied()
        }
        return response
    })

    const collect = () => run(async () => {
        const response = await stationService.collectExpedition(telegramData, station.slug)
        if (response.success) {
            adopt(null)
            setLoot(response.loot)
            if (response.card) setCard({ ...response.card, id: Date.now() })
            syncProfile()
        }
        return response
    })

    const recall = () => {
        if (!confirmRecall) {
            setConfirmRecall(true)
            return
        }
        setConfirmRecall(false)
        run(async () => {
            const response = await stationService.recallExpedition(telegramData, station.slug)
            if (response.success) adopt(null)
            return response
        })
    }

    const reveal = card && <CardReveal key={card.id} card={card} side onDone={() => setCard(null)} />

    if (expedition) {
        const elapsed = Math.max(0, now - expedition.startedAtMs)
        const progress = Math.min(1, elapsed / expedition.durationMs)
        const ready = progress >= 1
        return <>
            <div className={`Expedition${ready ? " Expedition--ready" : ""}`}>
                <ExpeditionMap location={expedition.location} seed={expedition.mapId} scale={expedition.scale} progress={progress} />
                <div className="Expedition__info">
                    <strong>{t("Похід: {location}", { location: locationName(expedition.location) })}</strong>
                    <span>{ready ? t("Розвідник повернувся!") : t("Повернеться через {time}", { time: formatDuration(expedition.durationMs - elapsed) })}</span>
                    <div className="mc-xp"><i style={{ width: `${progress * 100}%` }} /></div>
                    <div className="Expedition__actions">
                        <button className="mc-btn mc-btn--small mc-btn--green" disabled={!ready || isBusy} onClick={collect}>{t("Забрати знахідки")}</button>
                        {!ready && <button className="mc-btn mc-btn--small" disabled={isBusy} onClick={recall}>{t(confirmRecall ? "Точно відкликати?" : "Відкликати")}</button>}
                    </div>
                </div>
            </div>
            {message && <p className="Inventory__message">{message}</p>}
            {reveal}
        </>
    }

    return <>
        {loot
            ? <Loot loot={loot} catalog={catalog} onClose={() => setLoot(null)} />
            : <StationPanel station={station} placed={placed} dragOver={dragOver} handlers={handlers} onApplied={onApplied} />}
        {!loot && plan && <div className="Expedition__plan">
            <ServerImage imgSrc="/items/filled_map.png" alt="" />
            <div>
                <strong>{t("Похід: {location}", { location: locationName(plan.location) })}</strong>
                <span>{t("{time} · знахідок: {count}", { time: formatDuration(plan.ms), count: plan.finds })}</span>
                <span>{t("Скарб: {chance}% · карта: {card}%", { chance: Math.round(plan.treasureChance * 100), card: Math.round(plan.cardChance * 100) })}</span>
            </div>
            <button className="mc-btn mc-btn--small mc-btn--green" disabled={!plan.open || isBusy} onClick={start}>
                {plan.open ? t("Вирушити в похід") : t("Потрібен рівень досвіду {level}", { level: plan.level })}
            </button>
        </div>}
        {!loot && !plan && !map && <p className="Inventory__hint">{t("Поклади мапу: порожню, щоб накреслити локацію, або заповнену, щоб вирушити в похід")}</p>}
        {message && <p className="Inventory__message">{message}</p>}
        {reveal}
    </>
}

export default CartographyPanel
