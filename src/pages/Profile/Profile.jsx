import "./Profile.scss"
import { use, useState } from "react"
import { Logo, OpenChestIcon, CloseChestIcon } from "../../utils/icons"
import userService from "../../services/user.service"
import { useUserContext } from "../../context/UserContext"
import has24HoursPassed from "../../utils/convertTime"

function Profile() {
    const { user, handleClaimAward } = useUserContext()
    const [bonusStatus, setBonusStatus] = useState(user.lastAwardTime ? has24HoursPassed(user.lastAwardTime) : true)
    const renderBonusState = () => {
        return (
            <>
                <div className="Profile__gift-chest">
                    {
                        bonusStatus ? <button onClick={handleClaimAward}><OpenChestIcon /></button> : <CloseChestIcon />
                    }
                </div>
                <div className="Profile__gift-text">

                    <h2>Daily bonus</h2>
                    {
                        bonusStatus ? <p>Get your free award!</p> : <p>You already got award!</p>

                    }
                    {!bonusStatus && <span>25:00</span>}
                </div>
            </>
        )
    }
    return (
        <main id="Profile">
            <div className="Profile__wrapper">
                <div className="Profile__user">
                    <div className="Profile__photo">
                        <img src={user.photo} alt={user.username} />
                    </div>
                    <div className="Profile__info">
                        <h1>{user.username}</h1>
                        <p>ID: {user.telegramId}</p>
                        <div className="Profile__info-stats">
                            <div className="Profile__info-stat">
                                <Logo />
                                <span>
                                    {user.tapBlocks.length}
                                </span>
                            </div>
                            <div className="Profile__info-stat">
                                <Logo />
                                <span>
                                    {user.inventory.length}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="Profile__gift">
                    {
                        renderBonusState()
                    }
                </div>
                <div className="Profile__blocks">

                </div>
            </div>
        </main>

    )
}

export default Profile