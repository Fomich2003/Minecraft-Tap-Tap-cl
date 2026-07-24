import "./Tap.scss"
import { DefaultBlockIcon } from "../../utils/icons"


function Tap() {
    return (
        <main id="Tap">
            <div className="Tap__wrapper">
                <div className="Tap__block">
                    <button className="Tap__block-btn">
                        <DefaultBlockIcon />
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