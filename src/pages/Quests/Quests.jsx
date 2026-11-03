import "./Quests.scss"
import { useEffect, useMemo, useState } from "react"
import { CoinIcon } from "../../utils/icons"
import { useUserContext } from "../../context/UserContext"
import ServerImage from "../../components/ServerImage/ServerImage"
import { QUEST_METRICS } from "../../config/quests.config"
import { formatRemaining } from "../../utils/convertTime"
import { formatNumber } from "../../utils/format"
import { haptic } from "../../utils/telegram"
import { itemName, t } from "../../i18n"
import { rewardBurst } from "../../utils/particles"

// З ланцюжка постійних квестів видно лише наступний крок, інакше список на пів сотні карток нічого не підказує
function currentSteps(quests) {
    const steps = new Map()
    for (const quest of quests) {
        const step = steps.get(quest.metric)
        if (!step || (step.claimed && !quest.claimed)) steps.set(quest.metric, quest)
    }
    return [...steps.values()]
}

const byUrgency = (left, right) => Number(right.ready) - Number(left.ready) || Number(left.claimed) - Number(right.claimed)
    || right.progress / right.target - left.progress / left.target

function QuestReward({ quest, catalog }) {
    return (
        <span className="Quests__reward">
            <span className="Quests__coins"><CoinIcon /> {formatNumber(quest.coins)}</span>
            {quest.xp > 0 && <span className="Quests__xp">{t("+{xp} досвіду", { xp: quest.xp })}</span>}
            {quest.items.map(({ slug, quantity }) => {
                const item = catalog?.items.find(entry => entry.slug === slug)
                return (
                    <span key={slug} className="Quests__prize" title={item ? itemName(item) : slug}>
                        <ServerImage imgSrc={`/items/${slug}.png`} alt={item ? itemName(item) : slug} />
                        {quantity > 1 && <small>×{quantity}</small>}
                    </span>
                )
            })}
        </span>
    )
}

function QuestCard({ quest, index, catalog, busy, onClaim }) {
    const { text, icon } = QUEST_METRICS[quest.metric]
    return (
        <article className={`Quests__card mc-panel${quest.ready ? " Quests__card--ready" : ""}${quest.claimed ? " Quests__card--claimed" : ""}`} style={{ animationDelay: `${Math.min(index, 12) * 35}ms` }}>
            <span className="Quests__icon"><ServerImage imgSrc={icon} alt="" /></span>
            <div className="Quests__body">
                <h2>{t(text, { count: formatNumber(quest.target) })}</h2>
                <div className={`mc-xp${quest.ready ? " mc-xp--full" : ""}`} role="progressbar" aria-valuemin={0} aria-valuemax={quest.target} aria-valuenow={quest.progress} aria-label={t(text, { count: formatNumber(quest.target) })}>
                    <i style={{ width: `${quest.progress / quest.target * 100}%` }} />
                </div>
                <div className="Quests__meta">
                    <span className="Quests__count">{formatNumber(quest.progress)} / {formatNumber(quest.target)}</span>
                    <QuestReward quest={quest} catalog={catalog} />
                </div>
            </div>
            {quest.ready && <button className="mc-btn mc-btn--gold mc-btn--small Quests__claim" disabled={busy} onClick={event => onClaim(quest, event.currentTarget)}>{t("Забрати")}</button>}
            {quest.claimed && <span className="Quests__done">{t("Отримано")}</span>}
        </article>
    )
}

function Quests() {
    const { catalog, loadQuests, claimQuest } = useUserContext()
    const [quests, setQuests] = useState(null)
    const [failed, setFailed] = useState(false)
    const [tab, setTab] = useState("daily")
    const [message, setMessage] = useState("")
    const [busy, setBusy] = useState(false)
    const [gained, setGained] = useState(null)
    const [now, setNow] = useState(() => Date.now())

    const resetsAt = quests ? new Date(quests.resetsAt).getTime() : null

    useEffect(() => {
        let cancelled = false
        loadQuests().then(result => {
            if (cancelled) return
            if (result.success) setQuests(result)
            setFailed(!result.success)
        })
        return () => { cancelled = true }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- нова доба перезавантажує набір через resetsAt
    }, [resetsAt !== null && now >= resetsAt])

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(timer)
    }, [])

    const shown = useMemo(() => {
        if (!quests) return []
        const list = tab === "permanent" ? currentSteps(quests.permanent) : quests[tab] ?? []
        return [...list].sort(byUrgency)
    }, [quests, tab])

    const claim = async (quest, button) => {
        // Кнопка зникне разом зі старою карткою, тому звідки летіти нагороді, запам'ятовується наперед
        const origin = button?.getBoundingClientRect()
        setBusy(true)
        setMessage("")
        const result = await claimQuest(quest.id)
        setBusy(false)
        if (result.success) {
            setQuests(result)
            setGained(quest)
            if (origin) rewardBurst(origin.left + origin.width / 2, origin.top + origin.height / 2, { coins: result.reward?.coins, xp: result.reward?.xp })
            haptic("success")
        } else {
            setMessage(result.message)
            haptic("error")
        }
    }

    if (failed) return <main id="Quests"><p className="Quests__status">{t("Не вдалося завантажити квести")}</p></main>
    if (!quests) return <main id="Quests"><p className="Quests__status">{t("Завантаження...")}</p></main>

    const dailyReady = quests.daily.filter(quest => quest.ready).length
    const weeklyReady = (quests.weekly ?? []).filter(quest => quest.ready).length
    // Тиждень завжди закінчується опівночі понеділка, тому новий набір приходить разом із щоденним
    const weeklyResetsAt = quests.weeklyResetsAt ? new Date(quests.weeklyResetsAt).getTime() : resetsAt
    const permanentReady = quests.permanent.filter(quest => quest.ready).length
    const permanentDone = quests.permanent.filter(quest => quest.claimed).length

    return (
        <main id="Quests">
            <h1 className="visually-hidden">{t("Квести")}</h1>
            <div className="Quests__tabs" role="tablist">
                {[["daily", t("Щоденні"), dailyReady], ["weekly", t("Тижневі"), weeklyReady], ["permanent", t("Постійні"), permanentReady]].map(([id, label, ready]) => (
                    <button key={id} role="tab" aria-selected={tab === id} className={`Quests__tab${tab === id ? " Quests__tab--active" : ""}`} onClick={() => setTab(id)}>
                        {label}{ready > 0 && <span className="Quests__badge">{ready}</span>}
                    </button>
                ))}
            </div>

            <p className="Quests__summary">
                {tab !== "permanent"
                    ? <><span>{t("Нові квести через")}</span> <time>{formatRemaining((tab === "weekly" ? weeklyResetsAt : resetsAt) - now)}</time></>
                    : <span>{t("Виконано {done} з {total}", { done: permanentDone, total: quests.permanent.length })}</span>}
            </p>

            {message && <p className="Quests__message" role="alert">{message}</p>}

            {/* Картка постійного квесту після нагороди змінюється наступним кроком, тому нагорода показується окремо */}
            {gained && <div className="Quests__gain mc-panel" key={gained.id} role="status" onAnimationEnd={() => setGained(null)}>
                <strong>{t("Отримано")}</strong>
                <QuestReward quest={gained} catalog={catalog} />
            </div>}

            <section className="Quests__list" key={tab}>
                {shown.map((quest, index) => <QuestCard key={quest.id} quest={quest} index={index} catalog={catalog} busy={busy} onClaim={claim} />)}
            </section>
        </main>
    )
}

export default Quests
