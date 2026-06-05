import "./Profile.scss"
import { use, useState, useEffect } from "react"
import { Logo, OpenChestIcon, CloseChestIcon } from "../../utils/icons"
import userService from "../../services/user.service"
import { useUserContext } from "../../context/UserContext"
import { has24HoursPassed, getRemainingTime } from "../../utils/convertTime"

function Profile() {

    // отримуємо user та функцію отримання бонусу з context
    const { user, handleClaimAward, userBlocks, getFirstBlock } = useUserContext()

    // state для countdown таймера
    const [timer, setTimer] = useState("")

    // запускається коли змінюється lastAwardTime
    useEffect(() => {

        // якщо користувач ще не отримував бонус
        if (!user.lastAwardTime) return

        // функція оновлення таймера
        const updateTimer = () => {

            // записуємо новий час у state
            setTimer(getRemainingTime(user.lastAwardTime))
        }

        // одразу запускаємо таймер
        updateTimer()

        // оновлюємо таймер кожну секунду
        const interval = setInterval(updateTimer, 1000)

        // очищаємо interval при розмонтуванні компонента
        return () => clearInterval(interval)

    }, [user.lastAwardTime])

    // перевіряємо чи доступний бонус
    const bonusStatus = user.lastAwardTime
        ? has24HoursPassed(user.lastAwardTime)
        : true

    // функція рендера блоку бонусу
    const renderBonusState = () => {

        return (
            <>
                <div className="Profile__gift-chest">

                    {
                        // якщо бонус доступний показуємо кнопку
                        bonusStatus
                            ? (
                                <button onClick={handleClaimAward}>
                                    <OpenChestIcon />
                                </button>
                            )
                            : <CloseChestIcon />
                    }

                </div>

                <div className="Profile__gift-text">

                    <h2>Daily bonus</h2>

                    {
                        // текст залежно від статусу бонусу
                        bonusStatus
                            ? <p>Get your free award!</p>
                            : <p>You already got award!</p>
                    }

                    {
                        // якщо бонус недоступний показуємо countdown
                        !bonusStatus && <span>{timer}</span>
                    }

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
                    <h2>My blocks:</h2>
                    {
                        Array.isArray(userBlocks) && userBlocks.length > 0 ?
                            <div className="Profile__blocks-list Profile__blocks-wrapper">
                                {userBlocks.map((block) => (
                                    <div key={block._id} className="Profile__block-card">
                                        <img
                                            src={block.icon}
                                            alt={block.name}
                                            className="Profile__block-image"
                                        />

                                        <div className="Profile__block-info">
                                            <h3>{block.name}</h3>
                                            <p>Slug: {block.slug}</p>

                                            {block.canTap && (
                                                <span className="Profile__block-badge">
                                                    Tap available
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div> : <div className="Profile__blocks-get Profile__blocks-wrapper">
                                <button onClick={getFirstBlock} className="Profile__blocks-getBtn">Get first block</button>
                            </div>
                    }

                </div>
            </div>
        </main>

    )
}

export default Profile