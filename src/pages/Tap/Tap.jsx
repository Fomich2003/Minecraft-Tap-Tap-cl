import "./Tap.scss"
import { useEffect, useMemo, useRef, useState } from "react"
import { useUserContext } from "../../context/UserContext"
import blockService from "../../services/block.service"
import ServerImage from "../../components/ServerImage/ServerImage"
import BottomSheet from "../../components/BottomSheet/BottomSheet"
import { CoinIcon } from "../../utils/icons"
import { API_CONF } from "../../config/api.config"
import { formatNumber } from "../../utils/format"
import { haptic } from "../../utils/telegram"
import { burstEffects, hurtMob, punchBlock, shatterBlock, showTapNumber, swingTool } from "./tapEffects"
import particles, { navTarget } from "../../utils/particles"
import { critPower, isCritical } from "../../utils/critical"
import { EFFECTS } from "../../config/effects.config"
import { LOCATION_NAMES } from "../../config/quests.config"
import { gameName, itemName, t } from "../../i18n"
import { BossAction, BossTimer } from "./BossParts"
import WorldScene from "./WorldScene"
import EffectBadges from "./EffectBadges"
import CardReveal from "../../components/CardReveal/CardReveal"
import EquipmentSheet from "./EquipmentSheet"
import UpgradeSheet from "./UpgradeSheet"
import useTapQueue from "./useTapQueue"

const ACTIVE_BLOCK_KEY = "activeBlockId"
const ACTIVE_MOB_KEY = "activeMobSlug"
const LOCATION_ORDER = Object.keys(LOCATION_NAMES)
const CRACK_STAGES = 8
const TAP_DEBRIS = 4
const BREAK_DEBRIS = 18
const MOB_DEBRIS = 2
// Предмети з однієї відповіді вилітають по черзі, але не більше кількох: решту видно в підказці
const FLYING_ITEMS = 4
const ITEM_STAGGER_S = 0.12
const DROP_VISIBLE_MS = 1800
// Покинутий блок загоюється: тріщини зникають по одній стадії
const CRACK_HOLD_MS = 1500
const CRACK_HEAL_MS = 250
const LEVEL_UP_VISIBLE_MS = 2200
const NO_CONNECTION = "Немає зв'язку з сервером, спробуй ще раз"
const DEFAULT_TOOL_ICON = "/items/iron_pickaxe.png"

function readSaved(key) {
    try {
        return localStorage.getItem(key)
    } catch {
        return null
    }
}

function saveChoice(key, value) {
    try {
        if (value) localStorage.setItem(key, value)
        else localStorage.removeItem(key)
    } catch {
        // Без збереження гра просто стартує з першого блока
    }
}

// Заголовок локації вставляється перед першою карткою кожної групи
function groupByLocation(entries, xpLevel, renderCard) {
    const shown = new Set()
    return entries.flatMap((entry, index) => {
        const { id, level } = entry.location
        const card = renderCard(entry, index)
        if (shown.has(id)) return [card]
        shown.add(id)
        return [
            <h3 className="BottomSheet__group" key={`location-${id}`}>
                {t(LOCATION_NAMES[id])}
                {xpLevel < level && <small>{t("Потрібен рівень досвіду {level}", { level })}</small>}
            </h3>,
            card,
        ]
    })
}

function Tap() {
    const { user, setUser, userBlocks, buyBlock, sendTapsBlock, upgradeTap, syncProfile, catalog, loadMobs, buyMob, summonBoss } = useUserContext()

    const [selectedBlockId, setSelectedBlockId] = useState(() => readSaved(ACTIVE_BLOCK_KEY))
    const [selectedMob, setSelectedMob] = useState(() => readSaved(ACTIVE_MOB_KEY))
    const [mobs, setMobs] = useState(null)
    const [mobsFailed, setMobsFailed] = useState(false)
    const [bossWin, setBossWin] = useState(null)
    const [progress, setProgress] = useState(() => ({ ...user.tapProgress }))
    const [drops, setDrops] = useState([])
    const [sheet, setSheet] = useState(null)
    const [blocksList, setBlocksList] = useState(null)
    const [blocksLoading, setBlocksLoading] = useState(false)
    const [shopMessage, setShopMessage] = useState("")
    const [buyingSlug, setBuyingSlug] = useState(null)
    const [upgrading, setUpgrading] = useState(false)
    const [upgradeMessage, setUpgradeMessage] = useState("")
    const [levelUp, setLevelUp] = useState(null)
    const [revealed, setRevealed] = useState(null)

    const fxLayer = useRef(null)
    const lastHit = useRef(0)
    const blockArt = useRef(null)
    const nextDropId = useRef(0)
    const timers = useRef(new Set())
    const tapCoinsRef = useRef(0)
    // Пошук предмета дропа за slug серед ~1700 предметів каталогу на кожну відповідь сервера
    const itemBySlug = useMemo(() => new Map((catalog?.items ?? []).map(item => [item.slug, item])), [catalog])
    // Номер наступного тапу: за ним клієнт знає, який удар сервер порахує критичним
    const tapCountRef = useRef(user.tapCount ?? 0)

    const activeBlock = userBlocks.find(block => block._id === selectedBlockId) ?? userBlocks[0] ?? null
    const { level, cost } = user.upgrade
    const { effects, tools, blocks, damage, experience, coinsBySlug } = user.loadout
    const upgradeReady = user.balance >= cost
    const activeMob = selectedMob ? mobs?.find(mob => mob.slug === selectedMob && (mob.boss ? mob.boss.active : mob.owned)) ?? null : null
    const blockLoadout = !activeMob && activeBlock ? blocks[activeBlock.slug] : null
    const tool = activeMob ? tools.sword : blockLoadout ? tools[blockLoadout.kind] : null
    const power = activeMob ? Math.min(activeMob.hp, damage) : blockLoadout?.power ?? 1
    // Карта цілі в колоді робить тап по ній дорожчим
    const coinsPerTap = coinsBySlug?.[activeMob?.slug ?? activeBlock?.slug] ?? user.loadout.coinsPerTap

    useEffect(() => {
        tapCoinsRef.current = coinsPerTap
    }, [coinsPerTap])

    // Блок і моб для тапу однакові: ключ черги, іконка, назва й скільки ударів витримує
    const target = activeMob
        ? { key: `mob_${activeMob.slug}`, icon: activeMob.icon, name: gameName("mobs", activeMob.slug, activeMob.name), total: activeMob.hp }
        : activeBlock && { key: activeBlock.slug, icon: activeBlock.icon, name: itemName(activeBlock), total: activeBlock.tapsToBreak }

    useEffect(() => {
        let cancelled = false
        loadMobs().then(result => {
            if (cancelled) return
            if (result.success) setMobs(result.mobs)
            setMobsFailed(!result.success)
        })
        return () => { cancelled = true }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- список мобів потрібен один раз на сторінку
    }, [])

    const refreshMobs = () => loadMobs().then(result => {
        if (result.success) setMobs(result.mobs)
    })

    const later = (callback, ms) => {
        const timer = setTimeout(() => {
            timers.current.delete(timer)
            callback()
        }, ms)
        timers.current.add(timer)
    }

    useEffect(() => {
        const pendingTimers = timers.current
        return () => pendingTimers.forEach(clearTimeout)
    }, [])

    // Частинки малюються поверх усього вікна: зі сторінки гри вони не мають долітати на інші вкладки
    useEffect(() => () => particles.clear(), [])

    // Текстура для осколків готується заздалегідь, щоб перший удар уже мав частинки блока
    useEffect(() => {
        if (target?.icon) particles.preload(API_CONF.baseFileUrl + target.icon)
    }, [target?.icon])

    // Відкрита панель перекриває сцену: недограні частинки не мають висіти поверх неї
    useEffect(() => {
        if (sheet) particles.clear()
    }, [sheet])

    // Дроп вилітає з блока, гойдається і летить у кнопку інвентаря, як предмет, який підбирає гравець
    const flyDrops = entries => {
        const art = blockArt.current?.getBoundingClientRect()
        if (!art || document.visibilityState !== "visible") return
        const x = art.left + art.width / 2
        const y = art.top + art.height * 0.45
        const groundY = art.bottom - art.height * 0.08
        entries.slice(0, FLYING_ITEMS).forEach(({ slug }, index) => {
            const item = itemBySlug.get(slug)
            if (!item) return
            particles.item(x, y, API_CONF.baseFileUrl + item.icon, { groundY, delay: index * ITEM_STAGGER_S, ...navTarget("/inventory") })
        })
    }

    const addDropToasts = added => {
        setDrops(current => [...current, ...added].slice(-3))
        const ids = new Set(added.map(drop => drop.id))
        later(() => setDrops(current => current.filter(drop => !ids.has(drop.id))), DROP_VISIBLE_MS)
    }

    const showDrops = (entries, broken = false) => addDropToasts(entries.slice(0, 3)
        .map(({ slug, quantity }) => ({ id: nextDropId.current++, quantity, broken, item: itemBySlug.get(slug) }))
        .filter(drop => drop.item))

    const queue = useTapQueue({
        send: sendTapsBlock,
        // Сервер міг прийняти менше тапів: показуємо його баланс разом із ще не надісланими
        onSuccess: (result, pendingTaps) => {
            if (typeof result.user.tapCount === "number") tapCountRef.current = result.user.tapCount + pendingTaps
            setUser(prev => ({
                ...prev,
                balance: result.user.balance + pendingTaps * tapCoinsRef.current,
                tapProgress: result.user.tapProgress,
                tapCount: result.user.tapCount,
                loadout: result.loadout,
                questsReady: result.questsReady,
            }))
            // Коли черга порожня, тріщини мають збігатися із сервером: він міг прийняти не всі тапи
            if (!pendingTaps) setProgress(prev => ({ ...prev, ...result.user.tapProgress }))
            if (result.drops?.length) {
                showDrops(result.drops)
                flyDrops(result.drops)
            }
            else if (result.missed) addDropToasts([{ id: nextDropId.current++, missed: true }])
            if (result.card) {
                setRevealed({ ...result.card, id: nextDropId.current++ })
                haptic("success")
            }
            if (result.toolBroken) {
                showDrops([{ slug: result.toolBroken }], true)
                haptic("error")
            }
            if (result.bossDefeated) {
                setBossWin(result.bossDefeated)
                later(() => setBossWin(null), LEVEL_UP_VISIBLE_MS)
                refreshMobs()
                haptic("success")
            }
        },
        // Удар міг бути відхилений, бо бос уже втік: тоді список мобів теж застарів
        onRejected: () => {
            syncProfile()
            refreshMobs()
        },
    })

    const perBlock = Math.max(1, target?.total ?? 1)
    const blockProgress = target ? (progress[target.key] ?? 0) % perBlock : 0
    // Сцена це велика шахта: вибір цілі з іншої локації везе камеру вниз або вгору
    const depth = Math.max(0, LOCATION_ORDER.indexOf(activeMob?.location.id ?? blockLoadout?.location))
    // Збережений моб стає відомим лише після завантаження списку: це повернення на місце, а не політ
    const sceneReady = !selectedMob || mobs !== null || mobsFailed
    const crackStage = activeMob ? 0 : Math.ceil(blockProgress / perBlock * CRACK_STAGES)
    const healingKey = target && !activeMob?.boss ? target.key : null

    useEffect(() => {
        if (!healingKey) return
        const step = Math.max(1, Math.ceil(perBlock / CRACK_STAGES))
        const timer = setInterval(() => {
            if (Date.now() - lastHit.current < CRACK_HOLD_MS) return
            setProgress(prev => (prev[healingKey] > 0 ? { ...prev, [healingKey]: Math.max(0, prev[healingKey] - step) } : prev))
        }, CRACK_HEAL_MS)
        return () => clearInterval(timer)
    }, [healingKey, perBlock])

    const tapBlock = (clientX, clientY) => {
        if (!target || sheet) return

        queue.add(target.key)
        lastHit.current = Date.now()
        setUser(prev => ({ ...prev, balance: prev.balance + coinsPerTap }))

        // Крит рахує сервер тим самим хешем; тут лише передбачення, щоб удар одразу виглядав критичним
        const critical = isCritical(user._id, tapCountRef.current)
        tapCountRef.current += 1
        const hitPower = critical ? critPower(power, perBlock) : power
        const hit = blockProgress + hitPower
        const broke = hit >= perBlock
        setProgress(prev => ({ ...prev, [target.key]: hit % perBlock }))

        const bounds = fxLayer.current.getBoundingClientRect()
        const x = clientX - bounds.left
        const y = clientY - bounds.top
        const art = blockArt.current.getBoundingClientRect()
        const iconUrl = API_CONF.baseFileUrl + target.icon
        const debris = activeMob ? MOB_DEBRIS : broke ? BREAK_DEBRIS : TAP_DEBRIS
        showTapNumber(fxLayer.current, x, y, coinsPerTap, critical ? t("Крит!") : null)
        particles.debris(clientX, clientY, iconUrl, debris, { groundY: art.bottom - art.height * 0.06, power: broke ? 1.25 : 1 })
        if (critical) particles.crit(clientX, clientY, { magic: Boolean(tool && Object.keys(tool.enchantments).length) })
        burstEffects(fxLayer.current, x, y, effects.map(effect => EFFECTS[effect.id]?.color))
        if (tool) swingTool(fxLayer.current, x, y, API_CONF.baseFileUrl + tool.icon)
        punchBlock(blockArt.current, broke || critical)
        if (activeMob) hurtMob(blockArt.current)
        else if (broke) shatterBlock(blockArt.current)
        haptic(broke || critical ? "break" : "tap")
    }

    const handlePointerDown = event => {
        if (event.button === 0) tapBlock(event.clientX, event.clientY)
    }

    // Клавіатура не дає pointerdown: Enter і пробіл приходять як click без координат
    const handleKeyboardTap = event => {
        if (event.detail !== 0) return
        const bounds = event.currentTarget.getBoundingClientRect()
        tapBlock(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2)
    }

    const openBlocks = async () => {
        queue.flush()
        setShopMessage("")
        setSheet("blocks")
        if (blocksList?.length) return

        setBlocksLoading(true)
        const response = await blockService.getBlocksToTap()
        setBlocksList(response.success ? response.blocks : null)
        setBlocksLoading(false)
    }

    const openUpgrade = () => {
        queue.flush()
        setUpgradeMessage("")
        setSheet("upgrade")
    }

    const openEquipment = () => {
        queue.flush()
        setSheet("equipment")
    }

    const openMobs = () => {
        queue.flush()
        setShopMessage("")
        setSheet("mobs")
    }

    const closeSheet = () => setSheet(null)

    const selectMob = slug => {
        setSelectedMob(slug)
        saveChoice(ACTIVE_MOB_KEY, slug)
        setSheet(null)
    }

    const selectBlock = id => {
        setSelectedBlockId(id)
        saveChoice(ACTIVE_BLOCK_KEY, id)
        selectMob(null)
    }

    const handleBuy = async (event, block) => {
        event.stopPropagation()
        if (buyingSlug) return
        setBuyingSlug(block.slug)
        setShopMessage("")

        const settled = await queue.settle()
        const result = settled ? await buyBlock(block.slug) : { success: false, message: t(NO_CONNECTION) }
        setBuyingSlug(null)

        if (result.success) selectBlock(block._id)
        else setShopMessage(result.message)
    }

    const handleBuyMob = async (event, mob) => {
        event.stopPropagation()
        if (buyingSlug) return
        setBuyingSlug(mob.slug)
        setShopMessage("")

        const settled = await queue.settle()
        const result = settled ? await buyMob(mob.slug) : { success: false, message: t(NO_CONNECTION) }
        setBuyingSlug(null)

        if (result.success) {
            setMobs(result.mobs)
            selectMob(mob.slug)
        } else {
            setShopMessage(result.message)
        }
    }

    const handleSummon = async (event, mob) => {
        event.stopPropagation()
        if (buyingSlug) return
        setBuyingSlug(mob.slug)
        setShopMessage("")

        const settled = await queue.settle()
        const result = settled ? await summonBoss(mob.slug) : { success: false, message: t(NO_CONNECTION) }
        setBuyingSlug(null)

        if (result.success) {
            setMobs(result.mobs)
            setProgress(prev => ({ ...prev, [`mob_${mob.slug}`]: 0 }))
            selectMob(mob.slug)
            haptic("success")
        } else {
            setShopMessage(result.message)
            haptic("error")
        }
    }

    const confirmUpgrade = async () => {
        if (upgrading) return
        setUpgrading(true)
        setUpgradeMessage("")

        // Тапи, зроблені до скидання, мають зарахуватись за старим курсом і згоріти разом із балансом
        const settled = await queue.settle()
        const result = settled ? await upgradeTap() : { success: false, message: t(NO_CONNECTION) }
        setUpgrading(false)

        if (!result.success) {
            setUpgradeMessage(result.message)
            haptic("error")
            if (result.status) syncProfile()
            return
        }

        haptic("success")
        setSheet(null)
        setLevelUp(result.upgrade)
        later(() => setLevelUp(null), LEVEL_UP_VISIBLE_MS)
    }

    const renderBlocks = () => {
        if (blocksLoading) return <p className="BottomSheet__status">{t("Завантаження...")}</p>
        if (!blocksList) return <p className="BottomSheet__status">{t("Не вдалося завантажити блоки")}</p>

        return groupByLocation(blocksList, experience.level, (block, index) => {
            const owned = userBlocks.some(entry => entry._id === block._id)
            const isActive = activeBlock?._id === block._id
            return (
                <div
                    key={block._id}
                    className={`BottomSheet__item${isActive ? " BottomSheet__item--active" : ""}`}
                    style={{ animationDelay: `${Math.min(index, 12) * 18}ms` }}
                    aria-current={isActive ? "true" : undefined}
                    onClick={() => owned && selectBlock(block._id)}
                >
                    <ServerImage imgSrc={block.icon} alt={itemName(block)} />
                    <h3>{itemName(block)}</h3>
                    <small className="BottomSheet__chance">{t("Шанс дропа: {chance}%", { chance: blocks[block.slug]?.dropChance ?? block.dropChance })}</small>
                    {owned
                        ? <span className="BottomSheet__owned">{t(isActive ? "Активний" : "Обрати")}</span>
                        : experience.level < block.location.level
                            ? <span className="BottomSheet__owned">{t("Потрібен рівень досвіду {level}", { level: block.location.level })}</span>
                            : <>
                                <p><CoinIcon /> {formatNumber(block.price)}</p>
                                <button onClick={event => handleBuy(event, block)} disabled={user.balance < block.price || Boolean(buyingSlug)} className="mc-btn mc-btn--green mc-btn--small BottomSheet__buy">
                                    {t(user.balance < block.price ? "Бракує" : "Купити")}
                                </button>
                            </>}
                </div>
            )
        })
    }

    const renderMobs = () => {
        if (!mobs) return <p className="BottomSheet__status">{t(mobsFailed ? "Не вдалося завантажити мобів" : "Завантаження...")}</p>

        const byDepth = [...mobs].sort((left, right) => left.location.level - right.location.level)
        return groupByLocation(byDepth, experience.level, (mob, index) => {
            const name = gameName("mobs", mob.slug, mob.name)
            const isActive = activeMob?.slug === mob.slug
            return (
                <div
                    key={mob.slug}
                    className={`BottomSheet__item${isActive ? " BottomSheet__item--active" : ""}`}
                    style={{ animationDelay: `${Math.min(index, 12) * 18}ms` }}
                    aria-current={isActive ? "true" : undefined}
                    onClick={() => (mob.boss ? mob.boss.active : mob.owned) && selectMob(mob.slug)}
                >
                    <ServerImage imgSrc={mob.icon} alt={name} />
                    <h3>{name}</h3>
                    <small className="BottomSheet__chance">{t("Ударів: {count}", { count: Math.ceil(mob.hp / damage) })}</small>
                    <span className="BottomSheet__drops">
                        {mob.drops.map(drop => <ServerImage key={drop.slug} imgSrc={`/items/${drop.slug}.png`} alt="" />)}
                    </span>
                    {mob.boss && <BossAction mob={mob} level={experience.level} isActive={isActive} busy={Boolean(buyingSlug)} onSummon={event => handleSummon(event, mob)} />}
                    {!mob.boss && (mob.owned
                        ? <span className="BottomSheet__owned">{t(isActive ? "Активний" : "Обрати")}</span>
                        : experience.level < mob.location.level
                            ? <span className="BottomSheet__owned">{t("Потрібен рівень досвіду {level}", { level: mob.location.level })}</span>
                            : <>
                            <p><CoinIcon /> {formatNumber(mob.price)}</p>
                            <button onClick={event => handleBuyMob(event, mob)} disabled={user.balance < mob.price || Boolean(buyingSlug)} className="mc-btn mc-btn--green mc-btn--small BottomSheet__buy">
                                {t(user.balance < mob.price ? "Бракує" : "Купити")}
                            </button>
                        </>)}
                </div>
            )
        })
    }

    return (
        <main id="Tap" className="Tap">
            <div className="Tap__scene">
                <WorldScene depth={depth} ready={sceneReady} label={t(LOCATION_NAMES[LOCATION_ORDER[depth]])} />
            </div>

            <div className="Tap__hud mc-panel">
                <div className="Tap__hud-row">
                    <span className="Tap__level">{t("Рівень {level}", { level })}</span>
                    <span className="Tap__rate"><CoinIcon /><span>{t("+{amount} за тап", { amount: coinsPerTap })}</span></span>
                </div>
                <div className={`mc-xp${upgradeReady ? " mc-xp--full" : ""}`} role="progressbar" aria-label={t("Прогрес до покращення")} aria-valuemin={0} aria-valuemax={cost} aria-valuenow={Math.min(user.balance, cost)}>
                    <i style={{ width: `${Math.min(100, user.balance / cost * 100)}%` }} />
                </div>

                {/* Прив'язані до панелі: її висота залежить від шрифту мови */}
                <div className="Tap__drops" role="status">
                    {drops.map(drop => (
                        drop.missed
                            ? <span key={drop.id} className="Tap__drop Tap__drop--missed"><span>{t("Нічого не випало")}</span></span>
                            : <span key={drop.id} className={`Tap__drop${drop.broken ? " Tap__drop--broken" : ""}`}>
                                <ServerImage imgSrc={drop.item.icon} alt="" />
                                <span>{drop.broken ? t("Зламався інструмент: {name}", { name: itemName(drop.item) }) : `+${drop.quantity} ${itemName(drop.item)}`}</span>
                            </span>
                    ))}
                </div>

                <div className="Tap__status">
                    {tool && <span className={`Tap__tool${Object.keys(tool.enchantments).length ? " Tap__tool--enchanted" : ""}`} role="img"
                        aria-label={t("Міцність: {current} / {max}", { current: tool.durability, max: tool.maxDurability })}>
                        <ServerImage imgSrc={tool.icon} alt="" />
                        <i style={{ width: `${tool.durability / tool.maxDurability * 100}%` }} />
                    </span>}
                    {activeMob?.boss && <BossTimer expiresAt={activeMob.boss.expiresAt} onExpire={refreshMobs} />}
                    {activeMob && <span className="Tap__effect Tap__effect--chance" role="img" aria-label={t("Сила удару: {power}", { power: damage })}>
                        <ServerImage imgSrc="/items/iron_sword.png" alt="" />
                        {damage}
                    </span>}
                    {blockLoadout && <span className="Tap__effect Tap__effect--chance" role="img" aria-label={t("Шанс дропа: {chance}%", { chance: blockLoadout.dropChance })}>
                        <ServerImage imgSrc="/items/rabbit_foot.png" alt="" />
                        {blockLoadout.dropChance}%
                    </span>}
                    <EffectBadges effects={effects} />
                </div>
            </div>

            <div className="Tap__block">
                {target ? (
                    <button
                        className="Tap__block-btn"
                        aria-label={t("Тапнути: {name}", { name: target.name })}
                        onPointerDown={handlePointerDown}
                        onClick={handleKeyboardTap}
                        onContextMenu={event => event.preventDefault()}
                    >
                        <span className="Tap__block-float">
                            <span className={`Tap__block-art${activeMob ? " Tap__block-art--mob" : ""}`} ref={blockArt} key={target.key}>
                                <ServerImage imgSrc={target.icon} alt="" />
                                {activeMob && <span className="Tap__hp mc-xp" role="progressbar" aria-label={t("Здоров'я: {current} / {max}", { current: perBlock - blockProgress, max: perBlock })} aria-valuemin={0} aria-valuemax={perBlock} aria-valuenow={perBlock - blockProgress}>
                                    <i style={{ width: `${(perBlock - blockProgress) / perBlock * 100}%` }} />
                                </span>}
                                {crackStage > 0 && <span className="Tap__cracks" style={{ "--crack-y": `${(crackStage - 1) / (CRACK_STAGES - 1) * 100}%` }}><i /><i /><i /></span>}
                            </span>
                        </span>
                    </button>
                ) : (
                    <button className="mc-btn mc-btn--green" onClick={openBlocks}>{t("Обрати блок")}</button>
                )}
            </div>

            <div className="Tap__fx" ref={fxLayer} aria-hidden="true" />

            <div className="Tap__actions">
                <button className="mc-btn Tap__action" onClick={openBlocks} aria-expanded={sheet === "blocks"}>
                    {activeBlock && <ServerImage imgSrc={activeBlock.icon} alt="" />}
                    <span>{t("Блоки")}</span>
                </button>
                <button className="mc-btn Tap__action" onClick={openMobs} aria-expanded={sheet === "mobs"}>
                    <ServerImage imgSrc={activeMob?.icon ?? "/items/iron_sword.png"} alt="" />
                    <span>{t("Моби")}</span>
                </button>
                <button className="mc-btn Tap__action" onClick={openEquipment} aria-expanded={sheet === "equipment"}>
                    <ServerImage imgSrc={tool?.icon ?? DEFAULT_TOOL_ICON} alt="" />
                    <span>{t("Спорядження")}</span>
                </button>
                <button className={`mc-btn Tap__action ${upgradeReady ? "mc-btn--gold Tap__action--ready" : "mc-btn--green"}`} onClick={openUpgrade} aria-expanded={sheet === "upgrade"}>
                    <ServerImage imgSrc="/items/experience_bottle.png" alt="" />
                    <span>{t("Покращення")}</span>
                </button>
            </div>

            {levelUp && (
                <div className="Tap__levelup" role="status">
                    <strong>{t("Рівень {level}!", { level: levelUp.level })}</strong>
                    <span>{t("+{amount} за тап на всіх блоках", { amount: levelUp.coinsPerTap })}</span>
                </div>
            )}

            {revealed && <CardReveal key={revealed.id} card={revealed} side onDone={() => setRevealed(null)} />}

            {bossWin && (
                <div className="Tap__levelup" role="status">
                    <strong>{t("Перемога!")}</strong>
                    <span>{gameName("mobs", bossWin.slug, mobs?.find(mob => mob.slug === bossWin.slug)?.name)} · +{formatNumber(bossWin.coins)}</span>
                </div>
            )}

            <BottomSheet open={sheet === "blocks"} onClose={closeSheet} label={t("Вибір блока")}>
                {shopMessage && <p className="BottomSheet__message">{shopMessage}</p>}
                <div className="BottomSheet__list">{renderBlocks()}</div>
            </BottomSheet>

            <BottomSheet open={sheet === "mobs"} onClose={closeSheet} label={t("Вибір моба")}>
                <p className="BottomSheet__note">{t("Меч б'є сильніше, а чари на здобич дають більше дропа.")}</p>
                {shopMessage && <p className="BottomSheet__message">{shopMessage}</p>}
                <div className="BottomSheet__list">{renderMobs()}</div>
            </BottomSheet>

            <EquipmentSheet open={sheet === "equipment"} onClose={closeSheet} />

            <UpgradeSheet open={sheet === "upgrade"} onClose={closeSheet} onConfirm={confirmUpgrade} busy={upgrading} message={upgradeMessage} />
        </main>
    )
}

export default Tap
