import "./Top.scss"
import { useEffect, useState } from "react"
import { useUserContext } from "../../context/UserContext"
import ServerImage from "../../components/ServerImage/ServerImage"
import { CoinIcon } from "../../utils/icons"
import { formatCompact, formatNumber } from "../../utils/format"
import { t } from "../../i18n"

// Ідентифікатори збігаються з полями гравця у відповіді сервера
const METRICS = [
    { id: "level", label: "Рівень", icon: <ServerImage imgSrc="/items/experience_bottle.png" alt="" />, describe: player => t("Рівень досвіду {level}", { level: player.level }) },
    { id: "coins", label: "Монети", icon: <CoinIcon />, describe: player => `${t("Монети")}: ${formatNumber(player.coins)}` },
    { id: "bosses", label: "Боси", icon: <ServerImage imgSrc="/items/nether_star.png" alt="" />, describe: player => t("Перемог над босами: {count}", { count: formatNumber(player.bosses) }) },
]

const PODIUM_SIZE = 3
const PODIUM_PLACES = [0, 1, 2]

const playerName = player => player.name || t("Гравець")

function Stat({ metric, player, active }) {
    const label = metric.describe(player)
    return (
        <span className={`Top__stat${active ? " Top__stat--active" : ""}`} title={label} aria-label={label}>
            {metric.icon}
            {formatCompact(player[metric.id])}
        </span>
    )
}

function PodiumPlace({ player, position, metric }) {
    const rank = player?.rank
    return (
        <div className={`Top__place Top__place--${position + 1}${rank ? ` Top__place--rank${Math.min(rank, PODIUM_SIZE)}` : ""}${player?.me ? " Top__place--me" : ""}`}>
            {player
                ? <>
                    {position === 0 && <span className="Top__crown"><ServerImage imgSrc="/items/golden_helmet.png" alt="" /></span>}
                    <span className="Top__avatar" aria-hidden="true">{Array.from(playerName(player))[0].toUpperCase()}</span>
                    <strong className="Top__name" dir="auto">{playerName(player)}</strong>
                    <Stat metric={metric} player={player} active />
                </>
                : <span className="Top__avatar Top__avatar--empty" aria-hidden="true">?</span>}
            <div className="Top__pedestal"><span className="Top__rank">{rank ?? "?"}</span></div>
        </div>
    )
}

function Podium({ players, metric }) {
    return (
        <section className={`Top__podium Top__podium--${metric.id}`} key={metric.id}>
            {PODIUM_PLACES.map(position => <PodiumPlace key={position} player={players[position]} position={position} metric={metric} />)}
        </section>
    )
}

function PlayerRow({ player, metric, index }) {
    return (
        <li className={`Top__row${player.me ? " Top__row--me" : ""}`} style={{ animationDelay: `${Math.min(index, 12) * 20}ms` }}>
            <span className="Top__rank">{player.rank}</span>
            <div className="Top__player">
                <strong className="Top__name" dir="auto">{playerName(player)}</strong>
                <div className="Top__stats">
                    {METRICS.filter(entry => entry !== metric).map(entry => <Stat key={entry.id} metric={entry} player={player} />)}
                </div>
            </div>
            <Stat metric={metric} player={player} active />
        </li>
    )
}

function Top() {
    const { loadLeaderboard } = useUserContext()
    const [metricId, setMetricId] = useState(METRICS[0].id)
    const [boards, setBoards] = useState({})
    const [failed, setFailed] = useState(false)
    const metric = METRICS.find(entry => entry.id === metricId)
    const board = boards[metricId]

    useEffect(() => {
        let cancelled = false
        loadLeaderboard(metricId).then(result => {
            if (cancelled) return
            if (result.success) setBoards(previous => ({ ...previous, [metricId]: result }))
            setFailed(!result.success)
        })
        return () => { cancelled = true }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- таблиця читається при відкритті вкладки
    }, [metricId])

    return (
        <main id="Top">
            <h1 className="visually-hidden">{t("Таблиця лідерів")}</h1>
            <div className="Top__tabs" role="tablist">
                {METRICS.map(entry => (
                    <button key={entry.id} role="tab" aria-selected={metricId === entry.id} className={`Top__tab${metricId === entry.id ? " Top__tab--active" : ""}`} onClick={() => setMetricId(entry.id)}>
                        {entry.icon}
                        <span>{t(entry.label)}</span>
                    </button>
                ))}
            </div>

            {failed && !board && <p className="Top__status" role="alert">{t("Не вдалося завантажити таблицю")}</p>}
            {!failed && !board && <p className="Top__status">{t("Завантаження...")}</p>}

            {board && <>
                <Podium players={board.players} metric={metric} />
                {board.players.length === 0 && <p className="Top__status">{t("Тут поки порожньо")}</p>}
                {board.players.length > PODIUM_SIZE && <ol className="Top__list" key={metricId}>
                    {board.players.slice(PODIUM_SIZE).map((player, index) => <PlayerRow key={index} player={player} metric={metric} index={index} />)}
                </ol>}
                <section className="Top__mine" aria-label={t("Твоє місце")}>
                    <span className="Top__mine-rank">{board.me.rank ?? "—"}</span>
                    <span className="Top__mine-label">{t("Твоє місце")}</span>
                    <Stat metric={metric} player={board.me} active />
                </section>
            </>}
        </main>
    )
}

export default Top
