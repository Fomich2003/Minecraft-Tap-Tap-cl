import "./TelegramAlert.scss"
import { Logo } from "../../utils/icons"

const ACCESS_DENIED = "Доступ заборонено! Minecraft Tap-Tap - це телеграм додаток. Перейдіть в бота для відкриття додатку"

function TelegramAlert({ title = "Minecraft Tap-Tap", message = title === "Minecraft Tap-Tap" ? ACCESS_DENIED : "", onRetry }) {

    return (<div className="telegramAlert">
        <section className="home">
            <div className="container">
                <div className="home__wrapper">
                    <div className="home__content">
                        <Logo />
                        <h1>{title}</h1>
                        {message && <p>{message}</p>}
                        {onRetry
                            ? <button type="button" className="btn" onClick={onRetry}>Спробувати ще раз</button>
                            : !title.endsWith("...") && <a className="btn" href="https://t.me/minecraft_taptap_bot">Відкрити бота</a>}
                    </div>
                </div>
            </div>
        </section>
    </div>)
}

export default TelegramAlert
