import { useEffect, useState } from "react"
import BottomSheet from "../../components/BottomSheet/BottomSheet"
import ServerImage from "../../components/ServerImage/ServerImage"
import { EFFECTS, TOOL_SLOTS } from "../../config/effects.config"
import { useUserContext } from "../../context/UserContext"
import { itemName, t } from "../../i18n"
import { enchantmentName, potionLabel, romanLevel } from "../../utils/item-details"
import { itemIcon } from "../../utils/item-icon"
import { haptic } from "../../utils/telegram"
import { formatLeft, useCountdown } from "./useCountdown"

const effectLabel = ({ id, level }) => `${t(EFFECTS[id].name)} ${romanLevel(level)}`

function ActiveEffects({ effects }) {
    const active = useCountdown(effects)
    if (!active.length) return null
    return (
        <ul className="Equipment__active" aria-label={t("Активні ефекти")}>
            {active.map(effect => (
                <li key={effect.id} className="Equipment__effect">
                    <img src={`/assets/effects/${effect.id}.png`} alt="" />
                    <div>
                        <strong>{effectLabel(effect)}</strong>
                        <span>{t(EFFECTS[effect.id].hint)}</span>
                    </div>
                    <time>{formatLeft(effect.left)}</time>
                </li>
            ))}
        </ul>
    )
}

function ToolCard({ tool, catalog, equipped, busy, onEquip }) {
    const enchantments = Object.entries(tool.enchantments).map(([id, level]) => `${enchantmentName(id, catalog)} ${romanLevel(level)}`)
    const dropBonus = Math.round(tool.dropBonus * 100)
    return (
        <div className={`BottomSheet__item${equipped ? " BottomSheet__item--active" : ""}`}>
            <ServerImage imgSrc={tool.icon} alt="" />
            <h3>{itemName(tool)}</h3>
            <small className="Equipment__stats">
                {[t("Сила удару: {power}", { power: tool.power }), dropBonus > 0 && t("Бонус дропа: +{chance}%", { chance: dropBonus }), t("Міцність: {current} / {max}", { current: tool.durability, max: tool.maxDurability }), ...enchantments].filter(Boolean).join(" · ")}
            </small>
            <button className="mc-btn mc-btn--green mc-btn--small BottomSheet__buy" disabled={busy} onClick={() => onEquip(equipped ? null : tool.stackId, tool.kind)}>
                {t(equipped ? "Зняти" : "Вдягнути")}
            </button>
        </div>
    )
}

function ConsumableCard({ entry, catalog, busy, onConsume }) {
    return (
        <div className="BottomSheet__item">
            <ServerImage imgSrc={itemIcon(entry, { potion: entry.potion })} alt="" />
            <h3>{entry.potion ? potionLabel(entry.potion, catalog) : itemName(entry)}</h3>
            <small className="Equipment__stats">
                {entry.effects.map(effect => `${effectLabel(effect)} · ${formatLeft(effect.seconds * 1000)}`).join(", ")}
            </small>
            <button className="mc-btn mc-btn--green mc-btn--small BottomSheet__buy" disabled={busy} onClick={() => onConsume(entry.stackId)}>
                {t("Використати")}{entry.quantity > 1 ? ` (${entry.quantity})` : ""}
            </button>
        </div>
    )
}

function EquipmentSheet({ open, onClose }) {
    const { user, catalog, loadEquipment, equipTool, consumeItem } = useUserContext()
    const [tab, setTab] = useState("tools")
    const [options, setOptions] = useState(null)
    const [message, setMessage] = useState("")
    const [isBusy, setIsBusy] = useState(false)
    const { tools, effects } = user.loadout

    const adopt = result => {
        if (result.options) setOptions(result.options)
        setMessage(result.success ? "" : result.message)
    }

    useEffect(() => {
        if (!open) return
        let cancelled = false
        loadEquipment().then(result => {
            if (!cancelled) adopt(result)
        })
        return () => { cancelled = true }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- дані оновлюються лише при відкритті шторки
    }, [open])

    const run = async action => {
        if (isBusy) return
        setIsBusy(true)
        const result = await action()
        setIsBusy(false)
        adopt(result)
        haptic(result.success ? "success" : "error")
    }

    const handleEquip = (stackId, kind) => run(() => equipTool(stackId, kind))
    const handleConsume = stackId => run(() => consumeItem(stackId))

    return (
        <BottomSheet open={open} onClose={onClose} label={t("Спорядження")}>
            <div className="Equipment">
                <div className="BottomSheet__tabs">
                    <button className={`BottomSheet__tab${tab === "tools" ? " BottomSheet__tab--active" : ""}`} onClick={() => setTab("tools")}>{t("Інструменти")}</button>
                    <button className={`BottomSheet__tab${tab === "effects" ? " BottomSheet__tab--active" : ""}`} onClick={() => setTab("effects")}>{t("Ефекти")}</button>
                </div>
                {message && <p className="BottomSheet__message">{message}</p>}

                {tab === "tools" ? <>
                    <div className="Equipment__slots">
                        {TOOL_SLOTS.map(slot => {
                            const tool = tools[slot.kind]
                            return (
                                <div key={slot.kind} className={`Equipment__slot Equipment__slot--${tool ? "filled" : "empty"}`}>
                                    <ServerImage imgSrc={tool?.icon ?? slot.icon} alt="" />
                                    <strong>{t(slot.name)}</strong>
                                    <small>{tool ? t("Сила удару: {power}", { power: tool.power }) : t(slot.hint)}</small>
                                </div>
                            )
                        })}
                    </div>
                    <p className="Equipment__hint">{t("Інструмент зараховує кілька тапів за удар по своїх блоках, підвищує шанс дропа й зношується за кожен зламаний блок. Удача, шовковий дотик, ефективність і незламність теж працюють.")}</p>
                    <div className="BottomSheet__list">
                        {options?.tools.map(tool => (
                            <ToolCard key={tool.stackId} tool={tool} catalog={catalog} equipped={tools[tool.kind]?.stackId === tool.stackId} busy={isBusy} onEquip={handleEquip} />
                        ))}
                        {options?.tools.length === 0 && <p className="BottomSheet__status">{t("Створи або купи інструмент чи меч")}</p>}
                    </div>
                </> : <>
                    <ActiveEffects effects={effects} />
                    <div className="BottomSheet__list">
                        {options?.consumables.map(entry => (
                            <ConsumableCard key={entry.stackId} entry={entry} catalog={catalog} busy={isBusy} onConsume={handleConsume} />
                        ))}
                        {options?.consumables.length === 0 && <p className="BottomSheet__status">{t("Звари зілля або приготуй їжу")}</p>}
                    </div>
                </>}
            </div>
        </BottomSheet>
    )
}

export default EquipmentSheet
