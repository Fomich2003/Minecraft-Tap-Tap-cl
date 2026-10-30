import "./Tap.scss"
import { useUserContext } from "../../context/UserContext"
import { useState, useEffect, useRef } from "react"
import blockService from "../../services/block.service"
import ServerImage from "../../components/ServerImage/ServerImage"
import { FurnaceIcon, ChangeIcon, UpgradeIcon } from "../../utils/icons"

function Tap() {
    const { buyBlock, setUser, userBlocks, sendTapsBlock } = useUserContext()
    const [count, setCount] = useState(0)
    const [blockBtn, setBlockBtn] = useState(false)
    const [activeBlock, setActiveBlock] = useState(null)
    const [tapEffects, setTapEffects] = useState([])
    const nextEffectId = useRef(0)
    const effectTimers = useRef(new Set())
    const pendingTaps = useRef(0)
    const flushTimer = useRef(null)
    const activeBlockRef = useRef(null)
    activeBlockRef.current = activeBlock

    const [blocksShopList, setBlocksShopList] = useState(null)
    const [blocksShopListLoading, setBlocksShopListLoading] = useState(false)
    const [blocksShopListOpen, setBlocksShopListOpen] = useState(false)

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
        setCount(pendingTaps.current)
        clearTimeout(flushTimer.current)
        flushTimer.current = setTimeout(flushTaps, 1000)

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
        } catch (error) {
            setBlocksShopList([])
        } finally {
            setBlocksShopListLoading(false)
        }
    }

    const handleActiveBlock = (e, block) => {
        if (!block.userHas || e.target.closest(".Tap__change-item__buy")) return
        setActiveBlock(block)
        setBlocksShopListOpen(false)
        localStorage.setItem("activeBlockId", block._id)
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
                    className={`Tap__change-item${isActive ? " Tap__change-item--active" : ""}`}
                    aria-current={isActive ? "true" : undefined}
                    onClick={(e) => handleActiveBlock(e, block)}
                >
                    <ServerImage imgSrc={block.icon} imgClass="Tap__change-image" />
                    <h3>{block.name}</h3>
                    <p><strong>{block.price}</strong></p>
                    {
                        !block.userHas ? <button onClick={(e) => { e.stopPropagation(); buyBlock(block.slug) }} className="Tap__change-item__buy">Купити</button> : <span className="Tap__change-owned">{isActive ? "Активний блок" : "Є у вас"}</span>
                    }
                </div>
            )
        })
    }

    async function flushTaps() {
        if (!pendingTaps.current || !activeBlockRef.current) return

        const tapsToSend = pendingTaps.current
        const blockSlug = activeBlockRef.current.slug
        pendingTaps.current = 0
        setCount(0)

        const result = await sendTapsBlock(blockSlug, tapsToSend)
        if (!result.success) {
            pendingTaps.current += tapsToSend
            setCount(pendingTaps.current)
        }
    }

    useEffect(() => () => {
        effectTimers.current.forEach(clearTimeout)
        clearTimeout(flushTimer.current)
        if (pendingTaps.current && activeBlockRef.current) {
            sendTapsBlock(activeBlockRef.current.slug, pendingTaps.current)
        }
    }, [])

    useEffect(() => {
        if (!userBlocks || userBlocks.length === 0) return

        const blockIdInLS = localStorage.getItem("activeBlockId")

        const foundedActiveUserBlock = userBlocks.find(b => b._id === blockIdInLS)

        setActiveBlock(foundedActiveUserBlock || userBlocks[0])
    }, [])

    // onClick={() => sendTapsBlock(userBlocks[0].slug)}>
    return (
        <main id="Tap" className="Tap">
            <div className="Tap__wrapper">
                <div className="Tap__block">
                    {activeBlock ? (
                        <button className="Tap__block-btn" onClick={(event) => incrementCount(1, event)} disabled={blockBtn}>
                            <span className="Tap__block-art" key={activeBlock._id || activeBlock.slug}>
                                <ServerImage imgSrc={activeBlock.icon} />
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

            <div className={`Tap__change ${blocksShopListOpen ? "Tap__change--opened" : ""}`}>
                <button className="Tap__change-backdrop" onClick={() => setBlocksShopListOpen(false)} aria-label="Закрити вибір блока" />
                <div className={`Tap__change-wrapper ${blocksShopListOpen ? "Tap__change-wrapper--opened" : ""}`}>
                    <button onClick={() => setBlocksShopListOpen(false)} className="Tap__change-close" aria-label="Закрити">×</button>
                    <div className="Tap__change-list">
                        {blocksShopListLoading ? "Завантаження…" : blocksShopList ? renderblocksShopList() : "Не вдалося завантажити блоки"}
                    </div>
                </div>
            </div>
        </main>

    )
}

export default Tap
