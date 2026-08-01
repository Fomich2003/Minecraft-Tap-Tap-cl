import "./Tap.scss"
import { DefaultBlockIcon } from "../../utils/icons"
import { useUserContext } from "../../context/UserContext"
import { useState, useEffect } from "react"

function Tap() {
    const { user, userBlocks, sendTapsBlock } = useUserContext()
    const [count, setCount] = useState(0)

    const incrementCount = (num) => {
        setCount((prev) => prev + num)
    }

useEffect(() => {
const timer = setTimeout(() => {
    sendTapsBlock(userBlocks[0].slug, count)
}, 1000)
return () => clearTimeout(timer)
}, [count])

    // onClick={() => sendTapsBlock(userBlocks[0].slug)}>
    return (
        <main id="Tap">
            <div className="Tap__wrapper">
                <div className="Tap__block">
                    <button className="Tap__block-btn" onClick={() => incrementCount(1)}>
                        <DefaultBlockIcon />
                        {userBlocks[0].slug}
                    </button>

                </div>
                <div className="Tap__nav">
                    <button className="Tap__nav-changebtn">

                    </button>
                    <button className="Tap__nav-upgradebtn">

                    </button>
                    <button className="Tap__nav-furnacebtn">

                    </button>

                </div>
            </div>
        </main>

    )
}

export default Tap