import "./Tap.scss"
import { DefaultBlockIcon } from "../../utils/icons"
import { useUserContext } from "../../context/UserContext"

function Tap() {
    const { user, userBlocks, tapBlock } = useUserContext()

    return (
        <main id="Tap">
            <div className="Tap__wrapper">
                <div className="Tap__block">
                    <button className="Tap__block-btn" onClick={() => tapBlock(userBlocks[0].slug)}>
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