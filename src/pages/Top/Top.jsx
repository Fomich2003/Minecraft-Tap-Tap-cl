import "./Top.scss"
import { useEffect, useState } from "react"
import { useUserContext } from "../../context/UserContext"
import ServerImage from "../../components/ServerImage/ServerImage"
import { CoinIcon } from "../../utils/icons"
import { formatNumber } from "../../utils/format"
import { t } from "../../i18n"

const TABS = [
    ["level", "Рівень"],
    ["coins", "Монети"],
    ["bosses", "Боси"],
]

const PODIUM_PLACES = 3

function PlayerStat({ active, icon, label, value }) {
    return (
        <span className={`Top__stat${active ? " Top__stat--active" : ""}`} title={label} aria-label={label}>
            {icon}
            {formatNumber(value)}
        </span>
    )
}

function PlayerRow({ player, metric, index = 0 }) {
    const podium = player.rank && player.rank <= PODIUM_PLACES ? ` Top__row--place${player.rank}` : ""
    return (
        <li className={`Top__row mc-panel${podium}${player.me ? " Top__row--me" : ""}`} style={{ animationDelay: `${Math.min(index, 12) * 25}ms` }}>
            <span className="Top__rank">{player.rank ?? "—"}</span>
            <div className="Top__player">
                <strong className="Top__name" dir="auto">{player.name || t("Гравець")}</strong>
                <div className="Top__stats">
                    <PlayerStat active={metric === "level"} icon={<ServerImage imgSrc="/items/experience_bottle.png" alt="" />} label={t("Рівень досвіду {level}", { level: player.level })} value={player.level} />
                    <PlayerStat active={metric === "coins"} icon={<CoinIcon />} label={t("Монети")} value={player.coins} />
                    <PlayerStat active={metric === "bosses"} icon={<ServerImage imgSrc="/items/nether_star.png" alt="" />} label={t("Перемог над босами: {count}", { count: formatNumber(player.bosses) })} value={player.bosses} />
                </div>
            </div>
        </li>
    )
}

function Top() {
    const { loadLeaderboard } = useUserContext()
    const [metric, setMetric] = useState(TABS[0][0])
    const [boards, setBoards] = useState({})
    const [failed, setFailed] = useState(false)
    const board = boards[metric]

    useEffect(() => {
        let cancelled = false
        loadLeaderboard(metric).then(result => {
            if (cancelled) return
            if (result.success) setBoards(previous => ({ ...previous, [metric]: result }))
            setFailed(!result.success)
        })
        return () => { cancelled = true }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- таблиця читається при відкритті вкладки
    }, [metric])

    return (
        <main id="Top">
            <h1 className="visually-hidden">{t("Таблиця лідерів")}</h1>
            <div className="Top__tabs" role="tablist">
                {TABS.map(([id, label]) => (
                    <button key={id} role="tab" aria-selected={metric === id} className={`Top__tab${metric === id ? " Top__tab--active" : ""}`} onClick={() => setMetric(id)}>{t(label)}</button>
                ))}
            </div>

            {failed && !board && <p className="Top__status" role="alert">{t("Не вдалося завантажити таблицю")}</p>}
            {!failed && !board && <p className="Top__status">{t("Завантаження...")}</p>}

            {board && <>
                <section className="Top__mine" aria-label={t("Твоє місце")}>
                    <h2>{t("Твоє місце")}</h2>
                    <ul><PlayerRow player={board.me} metric={metric} /></ul>
                </section>
                {board.players.length > 0
                    ? <ol className="Top__list" key={metric}>
                        {board.players.map((player, index) => <PlayerRow key={index} player={player} metric={metric} index={index} />)}
                    </ol>
                    : <p className="Top__status">{t("Тут поки порожньо")}</p>}
            </>}
        </main>
    )
}

export default Top
