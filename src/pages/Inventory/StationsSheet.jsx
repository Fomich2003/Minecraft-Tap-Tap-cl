import { useState } from "react"
import BottomSheet from "../../components/BottomSheet/BottomSheet"
import ServerImage from "../../components/ServerImage/ServerImage"
import { useUserContext } from "../../context/UserContext"
import { STATION_INFO, stationFace } from "../../config/stations.config"
import { CoinIcon } from "../../utils/icons"
import { formatCompact, formatNumber } from "../../utils/format"
import { itemName, t } from "../../i18n"
import { haptic } from "../../utils/telegram"

// Кожен верстак це картка з текстурою свого блока: куплені обираються дотиком, решта показує, скільки до покупки
function StationsSheet({ open, onClose }) {
    const { user, stations, activateStation, buyStation } = useUserContext()
    const [message, setMessage] = useState("")
    const [busy, setBusy] = useState(null)

    const handleBuy = async (event, station) => {
        event.stopPropagation()
        setBusy(station.slug)
        const result = await buyStation(station.slug)
        setBusy(null)
        setMessage(result.success ? "" : result.message)
        haptic(result.success ? "success" : "error")
    }

    const handleActivate = async station => {
        if (!station.owned || station.active) return
        const result = await activateStation(station.slug)
        setMessage(result.success ? "" : result.message)
        haptic(result.success ? "success" : "error")
        if (result.success) onClose()
    }

    const owned = stations.filter(station => station.owned).length

    return (
        <BottomSheet open={open} onClose={onClose} label={t("Вибір верстака")} title={t("Верстаки")}>
            <p className="Stations__count">{t("Відкрито: {count} з {total}", { count: owned, total: stations.length })}</p>
            {message && <p className="BottomSheet__message">{message}</p>}
            <div className="Stations">
                {stations.map((station, index) => {
                    const short = user.balance < station.price
                    return (
                        <div key={station.slug}
                            className={`Stations__card${station.active ? " Stations__card--active" : ""}${station.owned ? "" : " Stations__card--locked"}`}
                            style={{ "--face": `url(${stationFace(station.slug)})`, animationDelay: `${Math.min(index, 10) * 35}ms` }}
                            role={station.owned ? "button" : undefined}
                            tabIndex={station.owned && !station.active ? 0 : undefined}
                            aria-current={station.active ? "true" : undefined}
                            onKeyDown={event => (event.key === "Enter" || event.key === " ") && handleActivate(station)}
                            onClick={() => handleActivate(station)}>
                            <span className="Stations__block" aria-hidden="true">
                                <ServerImage imgSrc={station.icon} alt="" />
                            </span>
                            <strong className="Stations__name">{itemName(station)}</strong>
                            <span className="Stations__info">{t(STATION_INFO[station.slug] ?? "")}</span>
                            {station.owned
                                ? <span className="Stations__state">{t(station.active ? "Активний" : "Обрати")}</span>
                                : <>
                                    <span className="Stations__price"><CoinIcon /> {formatNumber(station.price)}</span>
                                    {short && <span className="Stations__progress" role="progressbar" aria-valuemin={0} aria-valuemax={station.price} aria-valuenow={user.balance}
                                        aria-label={`${formatCompact(user.balance)} / ${formatCompact(station.price)}`}>
                                        <i style={{ width: `${Math.min(100, user.balance / station.price * 100)}%` }} />
                                    </span>}
                                    <button className="mc-btn mc-btn--green mc-btn--small Stations__buy" disabled={short || busy === station.slug}
                                        onClick={event => handleBuy(event, station)}>
                                        {t(short ? "Бракує" : "Купити")}
                                    </button>
                                </>}
                        </div>
                    )
                })}
            </div>
        </BottomSheet>
    )
}

export default StationsSheet
