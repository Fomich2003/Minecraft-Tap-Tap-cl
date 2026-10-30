import { useEffect, useState } from "react"
import ServerImage from "../../components/ServerImage/ServerImage"
import stationService from "../../services/station.service"
import { useUserContext } from "../../context/UserContext"
import { STATION_LAYOUTS, slotsPayload } from "../../config/stations.config"
import { StationSlot, ResultButton } from "./StationSlots"

const CAMPFIRE_CAPACITY = 4
const FURNACE_CAPACITY = 64
const MAX_BOTTLES = 3

function JobPanel({ station, placed, dragOver, handlers, onApplied }) {
    const { telegramData, catalog, applyResult } = useUserContext()
    const layout = STATION_LAYOUTS[station.uiType]
    const isBrewing = station.uiType === "brewing"
    const slots = layout.slots.filter(slot => station.needsFuel || isBrewing || slot.key !== "fuel")

    const [job, setJob] = useState(null)
    const [cookPreview, setCookPreview] = useState(null)
    const [brewingFuel, setBrewingFuel] = useState(0)
    const [message, setMessage] = useState("")
    const [now, setNow] = useState(() => Date.now())

    const adoptJob = value => setJob(value ? { ...value, startedAtMs: Date.now() - value.elapsedMs } : null)

    useEffect(() => {
        let cancelled = false
        stationService.job(telegramData, station.slug).then(response => {
            if (cancelled || !response.success) return
            adoptJob(response.job)
            setBrewingFuel(response.brewingFuel ?? 0)
        })
        return () => { cancelled = true }
    }, [station.slug, telegramData])

    useEffect(() => {
        if (!job) return
        const timer = setInterval(() => setNow(Date.now()), 500)
        return () => clearInterval(timer)
    }, [job])

    useEffect(() => {
        if (isBrewing || !placed.input) {
            setCookPreview(null)
            return
        }
        let cancelled = false
        stationService.cookPreview(telegramData, station.slug, slotsPayload(placed)).then(response => {
            if (!cancelled) setCookPreview(response.success ? response.preview : null)
        })
        return () => { cancelled = true }
    }, [placed, isBrewing, station.slug, telegramData])

    const capacity = station.slug === "campfire" ? CAMPFIRE_CAPACITY : FURNACE_CAPACITY
    const inputCount = Math.min(placed.input?.count ?? 0, capacity)
    const fuelUnits = cookPreview?.burnTicks ? Math.ceil(cookPreview.cookTicks * inputCount / cookPreview.burnTicks) : 0
    const hasFuel = !station.needsFuel || (cookPreview?.burnTicks > 0 && fuelUnits <= (placed.fuel?.count ?? 0))
    const canCook = !isBrewing && cookPreview && inputCount > 0 && hasFuel
    const canBrew = isBrewing && placed.bottle && placed.reagent && (brewingFuel > 0 || placed.fuel)

    const finish = response => {
        applyResult(response)
        setMessage(response.success ? "" : response.message)
        if (response.success) {
            adoptJob(response.job ?? null)
            onApplied()
        }
    }

    const start = async () => {
        if (isBrewing) {
            const bottleCount = Math.min(MAX_BOTTLES, placed.bottle.count)
            finish(await stationService.brew(telegramData, station.slug, { ...slotsPayload(placed), bottleCount }))
            const status = await stationService.job(telegramData, station.slug)
            if (status.success) setBrewingFuel(status.brewingFuel ?? 0)
        } else {
            finish(await stationService.cook(telegramData, station.slug, slotsPayload(placed), inputCount))
        }
    }

    const collect = async () => finish(await stationService.collect(telegramData, station.slug))
    const cancel = async () => finish(await stationService.cancel(telegramData, station.slug))

    if (job) {
        const elapsed = Math.max(0, now - job.startedAtMs)
        const finished = Math.min(job.units, Math.floor(elapsed / job.unitMs))
        const ready = finished - job.collected
        const percent = Math.min(100, elapsed / (job.units * job.unitMs) * 100)
        const output = catalog?.items.find(entry => entry.slug === job.output.slug)
        return <>
            <div className="Inventory__job">
                {output && <ServerImage imgSrc={output.icon} imgClass="Inventory__job-image" alt={output.name} />}
                <div className="Inventory__job-info">
                    <strong>{output?.name}</strong>
                    <span>Готово {finished} з {job.units}</span>
                    <div className="Inventory__job-bar"><i style={{ width: `${percent}%` }} /></div>
                </div>
            </div>
            <div className="Inventory__job-actions">
                <button className="Inventory__button" disabled={ready < 1} onClick={collect}>Забрати{ready > 0 ? ` ${ready * job.output.quantity}` : ""}</button>
                <button className="Inventory__button Inventory__button--ghost" onClick={cancel}>Скасувати</button>
            </div>
            {message && <p className="Inventory__message">{message}</p>}
        </>
    }

    return <>
        <div className="Inventory__craft-layout Inventory__craft-layout--slots">
            <div className="Inventory__station-slots">
                {slots.map(slot => <StationSlot key={slot.key} slot={slot} placed={placed} dragOver={dragOver} handlers={handlers} />)}
            </div>
            <span className="Inventory__craft-arrow" aria-hidden="true">→</span>
            <ResultButton result={cookPreview?.result} catalog={catalog} disabled />
        </div>
        <div className="Inventory__job-actions">
            <button className="Inventory__button" disabled={!canCook && !canBrew} onClick={start}>
                {isBrewing ? "Варити" : `Почати${inputCount ? ` (${inputCount})` : ""}`}
            </button>
        </div>
        {isBrewing && <p className="Inventory__hint">Запас палива: {brewingFuel}</p>}
        {!isBrewing && station.needsFuel && placed.input && !hasFuel && <p className="Inventory__message">Потрібно палива: {fuelUnits || "покладіть паливо"}</p>}
        {message && <p className="Inventory__message">{message}</p>}
    </>
}

export default JobPanel
