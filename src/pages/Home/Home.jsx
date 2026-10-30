import "./Home.scss"
import { useNavigate } from "react-router-dom"

function Home() {
    const navigate = useNavigate()
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
                        Lets play через Telegram for a seconds.
                    </p>
                </div>

                <div className="card">
                    <div className="icon">💎</div>

                    <h3>Awards</h3>

                    <p>
                        Take coins and open new thing.
                    </p>
                </div>

                <div className="card">
                    <div className="icon">🛡️</div>

                    <h3>Security</h3>

                    <p>
                        Authorization через Telegram and securited account.
                    </p>
                </div>
            </section>

            <section className="steps">
                <h2>How to start?</h2>

                <div className="step">
                    <span>1</span>
                    <h4>Tap-tap blocks</h4>
                </div>

                <div className="step">
                    <span>2</span>
                    <h4>Collect doped items</h4>
                </div>

                <div className="step">
                    <span>3</span>
                    <h4>Craft somthing on craftingtable</h4>
                </div>


                <button className="play__btn" onClick={() => navigate("/game")}>
                    Start the game!
                </button>
            </section>
        </main>
    )
}

export default Home