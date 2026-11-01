import { useState } from "react"
import BottomSheet from "../../components/BottomSheet/BottomSheet"
import ServerImage from "../../components/ServerImage/ServerImage"
import { useUserContext } from "../../context/UserContext"
import { CoinIcon } from "../../utils/icons"
import { formatNumber } from "../../utils/format"
import { itemName, t } from "../../i18n"
import { haptic } from "../../utils/telegram"

function StationsSheet({ open, onClose }) {
    const { user, stations, activateStation, buyStation } = useUserContext()
    const [message, setMessage] = useState("")

    const handleBuy = async (event, station) => {
        event.stopPropagation()
        const result = await buyStation(station.slug)
        setMessage(result.success ? "" : result.message)
        haptic(result.success ? "success" : "error")
    }

    const handleActivate = async station => {
        if (!station.owned) return
        const result = await activateStation(station.slug)
        setMessage(result.success ? "" : result.message)
        if (result.success) onClose()
    }

    return (
        <BottomSheet open={open} onClose={onClose} label={t("Вибір верстака")} title={t("Верстаки")}>
            {message && <p className="BottomSheet__message">{message}</p>}
            <div className="BottomSheet__list">
                {stations.map(station => (
                    <div
                        key={station.slug}
                        className={`BottomSheet__item${station.active ? " BottomSheet__item--active" : ""}`}
                        aria-current={station.active ? "true" : undefined}
                        onClick={() => handleActivate(station)}
                    >
                        <ServerImage imgSrc={station.icon} alt="" />
                        <h3>{itemName(station)}</h3>
                        {station.owned
                            ? <span className="BottomSheet__owned">{t(station.active ? "Активний" : "Обрати")}</span>
                            : <>
                                <p><CoinIcon /> {formatNumber(station.price)}</p>
                                <button
                                    className="mc-btn mc-btn--green mc-btn--small BottomSheet__buy"
                                    disabled={user.balance < station.price}
                                    onClick={event => handleBuy(event, station)}
                                >
                                    {t(user.balance < station.price ? "Бракує" : "Купити")}
                                </button>
                            </>}
                    </div>
                ))}
            </div>
        </BottomSheet>
    )
}

export default StationsSheet
