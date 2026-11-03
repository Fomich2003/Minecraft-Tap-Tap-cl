import "./Top.scss"
import { useEffect, useState } from "react"
import { useUserContext } from "../../context/UserContext"
import ServerImage from "../../components/ServerImage/ServerImage"
import { CoinIcon } from "../../utils/icons"
import { formatCompact, formatNumber } from "../../utils/format"
import { faceOf } from "../../utils/skin"
import { useSky } from "../../utils/sky"
import { t } from "../../i18n"

// Ідентифікатори збігаються з полями гравця у відповіді сервера. score: число, за яким сервер упорядковує таблицю
const METRICS = [
    { id: "level", label: "Рівень", icon: <ServerImage imgSrc="/items/experience_bottle.png" alt="" />, describe: player => t("Рівень досвіду {level}", { level: player.level }) },
    { id: "coins", label: "Монети", icon: <CoinIcon />, describe: player => `${t("Монети")}: ${formatNumber(player.coins)}` },
    { id: "bosses", label: "Боси", icon: <ServerImage imgSrc="/items/nether_star.png" alt="" />, describe: player => t("Перемог над босами: {count}", { count: formatNumber(player.bosses) }) },
]

const PODIUM_SIZE = 3
const PODIUM_PLACES = [0, 1, 2]
const SPARKS = Array.from({ length: 8 }, (_, index) => ({ left: `${38 + (index * 23) % 26}%`, delay: `${-index * .45}s` }))
const TORCHES = ["8%", "92%"]

const playerName = player => player.name || t("Гравець")

function Face({ player, className = "" }) {
    return <img className={`Top__face ${className}`} src={faceOf(playerName(player))} alt="" draggable="false" />
}

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
        <div className={`Top__place Top__place--${position + 1}${rank ? ` Top__place--rank${Math.min(rank, PODIUM_SIZE)}` : " Top__place--empty"}${player?.me ? " Top__place--me" : ""}`}>
            {player
                ? <>
                    <strong className="Top__nametag" dir="auto">{playerName(player)}</strong>
                    <span className="Top__head">
                        {position === 0 && <ServerImage imgSrc="/items/golden_helmet.png" imgClass="Top__crown" alt="" />}
                        <Face player={player} />
                    </span>
                </>
                : <span className="Top__head Top__head--empty" aria-hidden="true" />}
            <div className="Top__pedestal">
                <span className="Top__rank">{rank ?? ""}</span>
                {player && <Stat metric={metric} player={player} active />}
            </div>
        </div>
    )
}

// Кожна таблиця стоїть у своєму світі: рівень під живим небом, монети в шахті, боси в Енді
function Podium({ players, metric, sky }) {
    const leader = players[0]
    return (
        <section className={`Top__podium Top__podium--${metric.id}`} key={metric.id}>
            {metric.id === "level" && <>
                <i className="Top__sky Top__sky--day" style={{ opacity: sky.daylight }} />
                <i className="Top__sky Top__sky--dusk" style={{ opacity: sky.dusk }} />
                <i className="Top__stars" style={{ opacity: sky.stars }} />
            </>}
            {metric.id === "coins" && TORCHES.map(left => <i key={left} className="Top__torch" style={{ left }} />)}
            {metric.id === "bosses" && <i className="Top__stars" />}
            {leader && <i className="Top__beam" aria-hidden="true" />}
            {leader && SPARKS.map(spark => <i key={spark.left} className="Top__spark" style={{ left: spark.left, animationDelay: spark.delay }} />)}
            <div className="Top__places">
                {PODIUM_PLACES.map(position => <PodiumPlace key={position} player={players[position]} position={position} metric={metric} />)}
            </div>
        </section>
    )
}

function PlayerRow({ player, metric, index }) {
    return (
        <li className={`Top__row${player.me ? " Top__row--me" : ""}`} style={{ animationDelay: `${Math.min(index, 12) * 24}ms` }}>
            <span className="Top__rank">{player.rank}</span>
            <Face player={player} />
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

// Скільки бракує до гравця вище. Рівень рахується досвідом, тому для нього різниця в рівнях
function gapToNext(board, metric) {
    const { me, players } = board
    if (!me.rank || me.rank === 1) return null
    const above = players.filter(player => player.rank < me.rank).at(-1)
    if (!above) return null
    const gap = above[metric.id] - me[metric.id]
    return gap > 0 ? { place: above.rank, gap } : null
}

function Top() {
    const { loadLeaderboard } = useUserContext()
    const sky = useSky()
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

    const next = board && gapToNext(board, metric)

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
            {!failed && !board && <div className="Top__podium Top__podium--loading" aria-hidden="true" />}
            {!failed && !board && <p className="Top__status">{t("Завантаження...")}</p>}

            {board && <>
                <Podium players={board.players} metric={metric} sky={sky} />
                {board.players.length === 0 && <p className="Top__status">{t("Тут поки порожньо")}</p>}
                {board.players.length > PODIUM_SIZE && <ol className="Top__list" key={metricId}>
                    {board.players.slice(PODIUM_SIZE).map((player, index) => <PlayerRow key={index} player={player} metric={metric} index={index} />)}
                </ol>}
                <section className="Top__mine" aria-label={t("Твоє місце")}>
                    <span className="Top__mine-rank">{board.me.rank ?? "—"}</span>
                    <Face player={board.me} />
                    <div className="Top__mine-text">
                        <strong>{t("Твоє місце")}</strong>
                        {board.me.rank === 1 && <span>{t("Ти на першому місці!")}</span>}
                        {next && <span>{t("Ще {amount} до {place} місця", { amount: formatCompact(next.gap), place: next.place })}</span>}
                        {!board.me.rank && <span>{t("Грай, щоб потрапити в таблицю")}</span>}
                    </div>
                    <Stat metric={metric} player={board.me} active />
                </section>
            </>}
        </main>
    )
}

export default Top
