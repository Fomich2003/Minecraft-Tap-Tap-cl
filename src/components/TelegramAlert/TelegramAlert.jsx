import "./TelegramAlert.scss"
import { Logo } from "../../utils/icons"



function TelegramAlert() {



    return (<div className="telegramAlert">
        <section className="home">
            <div className="container">
                <div className="home__wrapper">
                    <div className="home__content">
                        <Logo />
                        <h1>Minecraft Tap-Tap</h1>
                        <p>Доступ заборонено! Minecraft Tap-Tap - це телеграм додаток. Перейдіть в бота для відкриття додатку</p>
                        <a className="btn" href="https://t.me/minecraft_taptap_bot">Відкрити бота</a>
                    </div>
                </div>
            </div>
        </section>
    </div>)
}

export default TelegramAlert