import { Fragment, useEffect, useState } from "react"
import ServerImage from "../../components/ServerImage/ServerImage"
import stationService from "../../services/station.service"
import { useUserContext } from "../../context/UserContext"
import { STATION_LAYOUTS, slotsPayload } from "../../config/stations.config"
import { StationSlot, ResultButton } from "./StationSlots"
import { t } from "../../i18n"
import { identityOf } from "../../utils/placement"
import { itemIcon } from "../../utils/item-icon"
import { stackLabel } from "../../utils/item-details"

const CAMPFIRE_CAPACITY = 4
const FURNACE_CAPACITY = 64
const MAX_BOTTLES = 3
const EMPTY_BOTTLE = "glass_bottle"

function JobPanel({ station, placed, dragOver, handlers, onApplied }) {
    const { telegramData, catalog, inventory, applyResult } = useUserContext()
    const layout = STATION_LAYOUTS[station.uiType]
    const isBrewing = station.uiType === "brewing"
    const slots = layout.slots.filter(slot => station.needsFuel || isBrewing || slot.key !== "fuel")

    const [job, setJob] = useState(null)
    const [loadedPreview, setLoadedPreview] = useState(null)
    const [brewingFuel, setBrewingFuel] = useState(0)
    const [message, setMessage] = useState("")
    const [now, setNow] = useState(() => Date.now())
    const [isBusy, setIsBusy] = useState(false)

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

    const hasInput = !isBrewing && Boolean(placed.input)

    useEffect(() => {
        if (!hasInput) return
        let cancelled = false
        stationService.cookPreview(telegramData, station.slug, slotsPayload(placed)).then(response => {
            if (!cancelled) setLoadedPreview(response.success ? response.preview : null)
        })
        return () => { cancelled = true }
    }, [placed, hasInput, station.slug, telegramData])

    const cookPreview = hasInput ? loadedPreview : null
    const capacity = station.slug === "campfire" ? CAMPFIRE_CAPACITY : FURNACE_CAPACITY
    const inputCount = Math.min(placed.input?.count ?? 0, capacity)
    const fuelUnits = cookPreview?.burnTicks ? Math.ceil(cookPreview.cookTicks * inputCount / cookPreview.burnTicks) : 0
    const hasFuel = !station.needsFuel || (cookPreview?.burnTicks > 0 && fuelUnits <= (placed.fuel?.count ?? 0))
    const canCook = !isBrewing && cookPreview && inputCount > 0 && hasFuel
    const bottle = isBrewing ? placed.bottle : null
    const isEmptyBottle = bottle?.entry.itemId.slug === EMPTY_BOTTLE
    // Зілля не стакаються, тому в слоті лежить одне, а стійка бере однакові пляшечки з усього інвентаря
    const ownedBottles = bottle ? inventory.items.filter(stack => stack.itemId && identityOf(stack) === identityOf(bottle.entry)).reduce((sum, stack) => sum + stack.quantity, 0) : 0
    const bottleCount = Math.min(MAX_BOTTLES, isEmptyBottle ? bottle.count : ownedBottles)
    const shownSlots = bottle && !isEmptyBottle ? { ...placed, bottle: { ...bottle, count: bottleCount } } : placed
    const canBrew = bottle && !isEmptyBottle && placed.reagent && (brewingFuel > 0 || placed.fuel)

    const finish = response => {
        applyResult(response)
        setMessage(response.success ? "" : response.message)
        if (response.success) {
            adoptJob(response.job ?? null)
            onApplied()
        }
    }

    const run = async action => {
        if (isBusy) return
        setIsBusy(true)
        await action()
        setIsBusy(false)
    }

    const start = () => run(async () => {
        if (isBrewing) {
            finish(await stationService.brew(telegramData, station.slug, { ...slotsPayload(placed), bottleCount }))
            const status = await stationService.job(telegramData, station.slug)
            if (status.success) setBrewingFuel(status.brewingFuel ?? 0)
        } else {
            finish(await stationService.cook(telegramData, station.slug, slotsPayload(placed), inputCount))
        }
    })

    const fill = () => run(async () => {
        const response = applyResult(await stationService.fill(telegramData, station.slug, { bottle: bottle.entry._id }, bottleCount))
        setMessage(response.success ? "" : response.message)
        if (response.success) handlers.placeBottle(response.inventory)
    })

    const collect = () => run(async () => finish(await stationService.collect(telegramData, station.slug)))
    const cancel = () => run(async () => finish(await stationService.cancel(telegramData, station.slug)))

    if (job) {
        const elapsed = Math.max(0, now - job.startedAtMs)
        const finished = Math.min(job.units, Math.floor(elapsed / job.unitMs))
        const ready = finished - job.collected
        const percent = Math.min(100, elapsed / (job.units * job.unitMs) * 100)
        const output = catalog?.items.find(entry => entry.slug === job.output.slug)
        const outputName = output && stackLabel({ itemId: output, components: job.output.components }, catalog)
        return <>
            <div className="Inventory__job">
                {!isBrewing && <i className="Inventory__flame Inventory__flame--lit Inventory__flame--burning" aria-hidden="true" />}
                {output &&<ServerImage imgSrc={itemIcon(output, job.output.components)} imgClass="Inventory__job-image" alt={outputName} />}
                <div className="Inventory__job-info">
                    <strong>{outputName}</strong>
                    <span>{t("Готово {finished} з {total}", { finished, total: job.units })}</span>
                    <div className="mc-xp"><i style={{ width: `${percent}%` }} /></div>
                </div>
            </div>
            <div className="Inventory__job-actions">
                <button className="mc-btn mc-btn--small mc-btn--green" disabled={ready < 1 || isBusy} onClick={collect}>{t("Забрати")}{ready > 0 ? ` ${ready * job.output.quantity}` : ""}</button>
                <button className="mc-btn mc-btn--small" disabled={isBusy} onClick={cancel}>{t("Скасувати")}</button>
            </div>
            {message && <p className="Inventory__message">{message}</p>}
        </>
    }

    return <>
        <div className="Inventory__craft-layout Inventory__craft-layout--slots">
            <div className={`Inventory__station-slots${layout.arrange ? ` Inventory__station-slots--${layout.arrange}` : ""}`}>
                {slots.map((slot, index) => <Fragment key={slot.key}>
                    {/* Вогник печі між сировиною й паливом, як у грі: горить, коли все готово до старту */}
                    {layout.arrange === "furnace" && index === 1 && <i className={`Inventory__flame${canCook ? " Inventory__flame--lit" : ""}`} aria-hidden="true" />}
                    <StationSlot slot={slot} placed={shownSlots} dragOver={dragOver} handlers={handlers} />
                </Fragment>)}
            </div>
            <span className={`Inventory__craft-arrow${cookPreview?.result ? " Inventory__craft-arrow--ready" : ""}`} aria-hidden="true" />
            <div className="Inventory__result">
                <ResultButton result={cookPreview?.result} catalog={catalog} disabled />
            </div>
        </div>
        <div className="Inventory__job-actions">
            {isEmptyBottle
                ? <button className="mc-btn mc-btn--small mc-btn--green" disabled={isBusy} onClick={fill}>{t("Налити воду")} ({bottleCount})</button>
                : <button className="mc-btn mc-btn--small mc-btn--green" disabled={(!canCook && !canBrew) || isBusy} onClick={start}>
                    {isBrewing ? `${t("Варити")}${bottleCount ? ` (${bottleCount})` : ""}` : `${t("Почати")}${inputCount ? ` (${inputCount})` : ""}`}
                </button>}
        </div>
        {isBrewing && <p className="Inventory__hint">{t("Запас палива: {count}", { count: brewingFuel })}</p>}
        {!isBrewing && station.needsFuel && placed.input && !hasFuel && <p className="Inventory__message">{fuelUnits ? t("Потрібно палива: {count}", { count: fuelUnits }) : t("Поклади паливо")}</p>}
        {message && <p className="Inventory__message">{message}</p>}
    </>
}

export default JobPanel
