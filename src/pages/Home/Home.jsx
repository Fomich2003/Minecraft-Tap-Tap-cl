import { useUserContext } from "../../context/UserContext"
import "./home.scss"

function Home() {
    const { telegramData } = useUserContext()

    const img = telegramData?.user?.photo_url
    const username = telegramData?.user?.first_name || "Player"

    return (
        <main id="Home">
            <section className="hero">
                <div className="hero__top">
                    <div>
                        <span className="badge">Minecraft Mini App</span>

                        <h1>
                            Minecraft <span>Tap-Tap</span>
                        </h1>

                        <p>
                            Тапай по блоку. Покращуй його і отримуй ексклюзивний дроп, який ти можеш використатити в інвентарі
                        </p>
                    </div>

                </div>
            </section>

            <section className="cards">
                <div className="card">
                    <div className="icon">⚡</div>

                    <h3>Швидкий старт</h3>

                    <p>
                        Почни грати через Telegram за декілька секунд.
                    </p>
                </div>

                <div className="card">
                    <div className="icon">💎</div>

                    <h3>Нагороди</h3>

                    <p>
                        Заробляй монети та відкривай нові можливості.
                    </p>
                </div>

                <div className="card">
                    <div className="icon">🛡️</div>

                    <h3>Безпека</h3>

                    <p>
                        Авторизація через Telegram та захист акаунта.
                    </p>
                </div>
            </section>

            <section className="steps">
                <h2>Як почати?</h2>

                <div className="step">
                    <span>1</span>
                    <h4>Тапай по блоку</h4>
                </div>

                <div className="step">
                    <span>2</span>
                    <h4>Збирай випадені предмети</h4>
                </div>

                <div className="step">
                    <span>3</span>
                    <h4>Крафть щось на верстаку</h4>
                </div>

                <button className="play__btn">Почати гру!</button>
            </section>
        </main>
    )
}

export default Home