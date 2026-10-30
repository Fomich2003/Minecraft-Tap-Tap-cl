import { useEffect, useRef, useState } from "react"
import ServerImage from "../../components/ServerImage/ServerImage"
import { StationSlot, ResultButton } from "./StationSlots"
import stationService from "../../services/station.service"
import { useUserContext } from "../../context/UserContext"
import { STATION_LAYOUTS, slotsPayload } from "../../config/stations.config"

const PREVIEW_DELAY_MS = 120

function StationPanel({ station, placed, dragOver, handlers, onApplied }) {
    const { telegramData, catalog, applyResult } = useUserContext()
    const layout = STATION_LAYOUTS[station.uiType]
    const [preview, setPreview] = useState(null)
    const [options, setOptions] = useState({})
    const [message, setMessage] = useState("")
    const [isBusy, setIsBusy] = useState(false)
    const requestId = useRef(0)

    useEffect(() => {
        const current = ++requestId.current
        const timer = setTimeout(async () => {
            if (!Object.keys(placed).length) {
                if (current === requestId.current) setPreview(null)
                return
            }
            const response = await stationService.preview(telegramData, station.slug, slotsPayload(placed), options)
            if (current === requestId.current) setPreview(response.success ? response.preview : null)
        }, PREVIEW_DELAY_MS)
        return () => clearTimeout(timer)
    }, [placed, options, station.slug, telegramData])

    const apply = async () => {
        setIsBusy(true)
        setMessage("")
        const response = applyResult(await stationService.apply(telegramData, station.slug, slotsPayload(placed), options))
        setIsBusy(false)
        if (response.success) {
            setOptions({})
            onApplied()
        } else {
            setMessage(response.message || "Не вдалося створити предмет")
        }
    }

    const choices = preview?.choices ?? []

    return <>
        <div className={`Inventory__craft-layout${layout.grid ? "" : " Inventory__craft-layout--slots"}`}>
            <div className={layout.grid ? "Inventory__craft-grid" : "Inventory__station-slots"}>
                {layout.slots.map(slot => <StationSlot key={slot.key} slot={slot} placed={placed} dragOver={dragOver} handlers={handlers} />)}
            </div>
            <span className="Inventory__craft-arrow" aria-hidden="true">→</span>
            <ResultButton result={preview?.result} catalog={catalog} disabled={isBusy} coinCost={preview?.coinCost} onClick={apply} />
        </div>

        {layout.choices === "recipes" && choices.length > 0 && <div className="Inventory__choices">
            {choices.map(choice => {
                const item = catalog?.items.find(entry => entry.slug === choice.result.slug)
                return <button key={choice.recipeKey} aria-label={item?.name}
                    className={`Inventory__choice${options.recipeKey === choice.recipeKey ? " Inventory__choice--active" : ""}`}
                    onClick={() => setOptions({ recipeKey: choice.recipeKey })}>
                    {item && <ServerImage imgSrc={item.icon} alt={item.name} />}
                    <span>{choice.result.quantity}</span>
                </button>
            })}
        </div>}

        {layout.choices === "offers" && choices.length > 0 && <div className="Inventory__choices Inventory__choices--text">
            {choices.map(choice => <button key={choice.index}
                className={`Inventory__choice${options.offer === choice.index ? " Inventory__choice--active" : ""}`}
                onClick={() => setOptions({ offer: choice.index })}>
                {choice.name}… · рівень {choice.level} · лазурит {choice.lapis} · {choice.coinCost} монет
            </button>)}
        </div>}

        {layout.choices === "patterns" && choices.length > 0 && <div className="Inventory__choices Inventory__choices--text">
            {choices.map(choice => <button key={choice.id}
                className={`Inventory__choice${options.pattern === choice.id ? " Inventory__choice--active" : ""}`}
                onClick={() => setOptions({ pattern: choice.id })}>{choice.name}</button>)}
        </div>}

        {(message || preview?.message) && <p className="Inventory__message">{message || preview.message}</p>}
    </>
}

export default StationPanel
