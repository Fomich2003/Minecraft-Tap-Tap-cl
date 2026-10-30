import "./Tap.scss"
import { useUserContext } from "../../context/UserContext"
import { useState, useEffect, useRef } from "react"
import blockService from "../../services/block.service"
import ServerImage from "../../components/ServerImage/ServerImage"
import BottomSheet from "../../components/BottomSheet/BottomSheet"
import { FurnaceIcon, ChangeIcon, UpgradeIcon } from "../../utils/icons"

const FLUSH_DELAY_MS = 1000
const MAX_FLUSH_INTERVAL_MS = 3000

function Tap() {
    const { user, buyBlock, setUser, userBlocks, sendTapsBlock, catalog } = useUserContext()
    const [activeBlock, setActiveBlock] = useState(null)
    const [tapEffects, setTapEffects] = useState([])
    const [dropEffects, setDropEffects] = useState([])
    const [shopMessage, setShopMessage] = useState("")
    const nextEffectId = useRef(0)
    const effectTimers = useRef(new Set())
    const pendingTaps = useRef(0)
    const flushTimer = useRef(null)
    const lastFlush = useRef(0)
    const isFlushing = useRef(false)
    const activeBlockRef = useRef(null)
    activeBlockRef.current = activeBlock

    const [blocksShopList, setBlocksShopList] = useState(null)
    const [blocksShopListLoading, setBlocksShopListLoading] = useState(false)
    const [blocksShopListOpen, setBlocksShopListOpen] = useState(false)

    const scheduleFlush = () => {
        clearTimeout(flushTimer.current)
        const sinceFlush = Date.now() - lastFlush.current
        flushTimer.current = setTimeout(flushTaps, sinceFlush >= MAX_FLUSH_INTERVAL_MS ? 0 : FLUSH_DELAY_MS)
    }

    const incrementCount = (num, event) => {
        const bounds = event.currentTarget.getBoundingClientRect()
        const effect = {
            id: nextEffectId.current++,
            x: event.clientX - bounds.left,
            y: event.clientY - bounds.top,
            value: num,
            drift: Math.round((Math.random() - 0.5) * 90),
        }

        setTapEffects((previous) => [...previous.slice(-7), effect])
        const effectTimer = setTimeout(() => {
            setTapEffects((previous) => previous.filter((item) => item.id !== effect.id))
            effectTimers.current.delete(effectTimer)
        }, 900)
        effectTimers.current.add(effectTimer)
        pendingTaps.current += num
        scheduleFlush()

        setUser(prev => ({
            ...prev,
            balance: prev.balance + num
        }))
    }

    const openBlocksList = async () => {
        if (blocksShopListOpen) {
            setBlocksShopListOpen(false)
            return
        }

        setBlocksShopListOpen(true)
        if (blocksShopList) return

        setBlocksShopListLoading(true)
        try {
            const req = await blockService.getBlocksToTap()
            if (req.success) setBlocksShopList(req.blocks)
        } catch {
            setBlocksShopList([])
        } finally {
            setBlocksShopListLoading(false)
        }
    }

    const handleActiveBlock = (e, block) => {
        if (!block.userHas || e.target.closest(".BottomSheet__buy")) return
        setActiveBlock(block)
        setBlocksShopListOpen(false)
        localStorage.setItem("activeBlockId", block._id)
    }

    const handleBuy = async (e, block) => {
        e.stopPropagation()
        const result = await buyBlock(block.slug)
        setShopMessage(result.success ? "" : result.message)
    }

    const renderblocksShopList = () => {
        const blocksToShow = blocksShopList.map(block => {
            const userHas = userBlocks.find(usb => usb._id === block._id)
            return { ...block, userHas: userHas ? true : false }
        })

        return blocksToShow.map(block => {
            const isActive = activeBlock?._id === block._id
            return (
                <div
                    key={block._id}
                    className={`BottomSheet__item${isActive ? " BottomSheet__item--active" : ""}`}
                    aria-current={isActive ? "true" : undefined}
                    onClick={(e) => handleActiveBlock(e, block)}
                >
                    <ServerImage imgSrc={block.icon} alt={block.name} />
                    <h3>{block.name}</h3>
                    <p><strong>{block.price}</strong></p>
                    {
                        !block.userHas
                            ? <button onClick={(e) => handleBuy(e, block)} disabled={user.balance < block.price} className="BottomSheet__buy">{user.balance < block.price ? "Бракує монет" : "Купити"}</button>
                            : <span className="BottomSheet__owned">{isActive ? "Активний блок" : "Є у вас"}</span>
                    }
                </div>
            )
        })
    }

    const showDrops = drops => {
        const effects = drops.slice(0, 5).map(slug => ({ id: nextEffectId.current++, item: catalog?.items.find(item => item.slug === slug) }))
        setDropEffects(previous => [...previous, ...effects].slice(-5))
        const ids = new Set(effects.map(effect => effect.id))
        const timer = setTimeout(() => {
            setDropEffects(previous => previous.filter(effect => !ids.has(effect.id)))
            effectTimers.current.delete(timer)
        }, 1400)
        effectTimers.current.add(timer)
    }

    async function flushTaps() {
        if (!pendingTaps.current || !activeBlockRef.current || isFlushing.current) return

        const tapsToSend = pendingTaps.current
        const blockSlug = activeBlockRef.current.slug
        pendingTaps.current = 0
        isFlushing.current = true
        lastFlush.current = Date.now()

        const result = await sendTapsBlock(blockSlug, tapsToSend)
        isFlushing.current = false

        if (!result.success) {
            pendingTaps.current += tapsToSend
            scheduleFlush()
            return
        }

        // Сервер міг прийняти менше тапів: показуємо його баланс разом із ще не надісланими
        setUser(prev => ({ ...prev, balance: result.user.balance + pendingTaps.current }))
        if (result.drops?.length) showDrops(result.drops)
        if (pendingTaps.current) scheduleFlush()
    }

    useEffect(() => {
        const timers = effectTimers.current
        return () => {
            timers.forEach(clearTimeout)
            clearTimeout(flushTimer.current)
            if (pendingTaps.current && activeBlockRef.current) {
                sendTapsBlock(activeBlockRef.current.slug, pendingTaps.current)
            }
        }
    }, [])

    useEffect(() => {
        if (!userBlocks || userBlocks.length === 0) return

        const blockIdInLS = localStorage.getItem("activeBlockId")

        const foundedActiveUserBlock = userBlocks.find(b => b._id === blockIdInLS)

        setActiveBlock(foundedActiveUserBlock || userBlocks[0])
    }, [])

    return (
        <main id="Tap" className="Tap">
            <div className="Tap__wrapper">
                <div className="Tap__block">
                    {activeBlock ? (
                        <button className="Tap__block-btn" onClick={(event) => incrementCount(1, event)}>
                            <span className="Tap__block-art" key={activeBlock._id || activeBlock.slug}>
                                <ServerImage imgSrc={activeBlock.icon} alt={activeBlock.name} />
                            </span>
                        </button>
                    ) : (
                        <button className="btn" onClick={openBlocksList}>Обрати блок</button>
                    )}
                </div>
                <div className="Tap__tap-effects" aria-hidden="true">
                    {tapEffects.map((effect) => (
                        <span
                            key={effect.id}
                            className="Tap__tap-number"
                            style={{ "--tap-x": `${effect.x}px`, "--tap-y": `${effect.y}px`, "--tap-drift": `${effect.drift}px` }}
                        >
                            +{effect.value}
                        </span>
                    ))}
                </div>
                <div className="Tap__drops" aria-live="polite">
                    {dropEffects.map(effect => effect.item && (
                        <span key={effect.id} className="Tap__drop">
                            <ServerImage imgSrc={effect.item.icon} alt={effect.item.name} />
                        </span>
                    ))}
                </div>
                <div className="Tap__nav">
                    <button className="Tap__nav-changebtn" onClick={openBlocksList} aria-label="Змінити блок" aria-expanded={blocksShopListOpen}>
                        <ChangeIcon />
                    </button>
                    <button className="Tap__nav-upgradebtn" aria-label="Покращення">
                        <UpgradeIcon />
                    </button>
                    <button className="Tap__nav-furnacebtn" aria-label="Піч">
                        <FurnaceIcon />
                    </button>
                </div>
            </div>

            <BottomSheet open={blocksShopListOpen} onClose={() => setBlocksShopListOpen(false)} label="Вибір блока">
                {shopMessage && <p className="BottomSheet__message">{shopMessage}</p>}
                <div className="BottomSheet__list">
                    {blocksShopListLoading ? "Завантаження…" : blocksShopList ? renderblocksShopList() : "Не вдалося завантажити блоки"}
                </div>
            </BottomSheet>
        </main>

    )
}

export default Tap
