import { useState } from "react"
import BottomSheet from "../../components/BottomSheet/BottomSheet"
import ServerImage from "../../components/ServerImage/ServerImage"
import { useUserContext } from "../../context/UserContext"

function StationsSheet({ open, onClose }) {
    const { user, stations, activateStation, buyStation } = useUserContext()
    const [message, setMessage] = useState("")

    const handleBuy = async (event, station) => {
        event.stopPropagation()
        const result = await buyStation(station.slug)
        setMessage(result.success ? "" : result.message)
    }

    const handleActivate = async station => {
        if (!station.owned) return
        const result = await activateStation(station.slug)
        setMessage(result.success ? "" : result.message)
        if (result.success) onClose()
    }

    return (
        <BottomSheet open={open} onClose={onClose} label="Вибір верстака">
            <h2 className="BottomSheet__title">Верстаки</h2>
            {message && <p className="BottomSheet__message">{message}</p>}
            <div className="BottomSheet__list">
                {stations.map(station => (
                    <div
                        key={station.slug}
                        className={`BottomSheet__item${station.active ? " BottomSheet__item--active" : ""}`}
                        aria-current={station.active ? "true" : undefined}
                        onClick={() => handleActivate(station)}
                    >
                        <ServerImage imgSrc={station.icon} />
                        <h3>{station.name}</h3>
                        {station.owned
                            ? <span className="BottomSheet__owned">{station.active ? "Активний" : "Доступний"}</span>
                            : <>
                                <p><strong>{station.price}</strong></p>
                                <button
                                    className="BottomSheet__buy"
                                    disabled={user.balance < station.price}
                                    onClick={event => handleBuy(event, station)}
                                >
                                    {user.balance < station.price ? "Бракує монет" : "Купити"}
                                </button>
                            </>}
                    </div>
                ))}
            </div>
        </BottomSheet>
    )
}

export default StationsSheet
