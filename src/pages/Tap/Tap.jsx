import "./Tap.scss"
import { DefaultBlockIcon } from "../../utils/icons"
import { useUserContext } from "../../context/UserContext"
import { useState, useEffect } from "react"
import blockService from "../../services/block.service"
import ServerImage from "../../components/ServerImage/ServerImage"
import { FurnaceIcon, ChangeIcon, UpgradeIcon } from "../../utils/icons"

function Tap() {
    const { user, setUser, userBlocks, sendTapsBlock } = useUserContext()
    const [count, setCount] = useState(0)
    const [blockBtn, setBlockBtn] = useState(false)

    const [blocksShopList, setBlocksShopList] = useState(null)
    const [blocksShopListLoading, setBlocksShopListLoading] = useState(true)
    const [blocksShopListOpen, setBlocksShopListOpen] = useState(false)

    const incrementCount = (num) => {
        setCount((prev) => prev + num)

        setUser(prev => ({
            ...prev,
            balance: prev.balance + num
        }))
    }

    const openBlocksList = async () => {
        const changedOpenStatus = blocksShopListOpen ? false : true
        setBlocksShopListOpen(changedOpenStatus)

        if (!changedOpenStatus) return

        const req = await blockService.getBlocksToTap()
        if (req.success) setBlocksShopList(req.blocks)
        setBlocksShopListLoading(false)
    }

    const renderblocksShopList = () => {
        const blocksToShow = blocksShopList.map(block => {
            const userHas = userBlocks.find(usb => usb._id === block._id)
            return { ...block, userHas: userHas ? true : false }
        })

        return blocksToShow.map(block => (
            <div key={block._id} className="Tap__change-item">
                <ServerImage imgSrc={block.icon} />
                <h3>{block.name}</h3>
                <p><strong>{block.price}</strong></p>
                {
                    !block.userHas ? <button>Купити</button> : null
                }
            </div>
        ))
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            setBlockBtn(true)
            sendTapsBlock(userBlocks[0].slug, count)
            setCount(0)
            setBlockBtn(false)
        }, 1000)
        return () => clearTimeout(timer)
    }, [count])


    // onClick={() => sendTapsBlock(userBlocks[0].slug)}>
    return (
        <main id="Tap" className="Tap">
            <div className="Tap__wrapper">
                <div className="Tap__block">
                    <button className="Tap__block-btn" onClick={() => incrementCount(1)} disabled={blockBtn}>
                        <DefaultBlockIcon />
                        {userBlocks[0].slug}
                    </button>

                </div>
                <div className="Tap__nav">
                    <button className="Tap__nav-changebtn" onClick={openBlocksList}>
                        <ChangeIcon />
                    </button>
                    <button className="Tap__nav-upgradebtn">
                        <UpgradeIcon />
                    </button>
                    <button className="Tap__nav-furnacebtn">
                        <FurnaceIcon />
                    </button>
                </div>
            </div>

            <div className="Tap__change">

                <div className={`Tap__change-wrapper ${blocksShopListOpen ? "Tap__change-wrapper--opened" : ""}`}>
                    {
                        blocksShopListLoading ?
                            "Loading..." :
                            blocksShopList ?
                                renderblocksShopList() :
                                "Some went error..."
                    }
                    <button onClick={() => setBlocksShopListOpen(false)} className="Tap__change-close">X</button>
                </div>

            </div>
        </main>

    )
}

export default Tap