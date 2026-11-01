import "./Home.scss"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import ServerImage from "../../components/ServerImage/ServerImage"
import { Logo } from "../../utils/icons"
import { t } from "../../i18n"

const SPLASHES = [
    "Тап-тап-тап!",
    "Копай глибше!",
    "Без лагів!",
    "Усіма мовами!",
    "Ще один блок!",
    "Алмази чекають!",
    "Прямо в Telegram!",
    "Крафти стаками!",
]

const FEATURES = [
    { icon: "/items/diamond_pickaxe.png", title: "Швидкий старт", text: "Гра відкривається прямо в Telegram, нічого встановлювати не треба." },
    { icon: "/items/emerald.png", title: "Нагороди", text: "Заробляй монети, відкривай нові блоки й верстаки, покращуй силу тапа." },
    { icon: "/items/shield.png", title: "Безпека", text: "Вхід через Telegram: прогрес прив'язаний до твого акаунта." },
]

const STEPS = [
    { icon: "/items/oak_log.png", text: "Тапай по блоках" },
    { icon: "/items/raw_iron.png", text: "Збирай ресурси, що випадають" },
    { icon: "/items/crafting_table.png", text: "Створюй предмети на верстаках" },
]

const pickSplash = () => SPLASHES[Math.floor(Math.random() * SPLASHES.length)]

function Home() {
    const navigate = useNavigate()
    const [splash] = useState(pickSplash)

    return (
        <main id="Home">
            <section className="Home__hero mc-panel">
                <div className="Home__sky">
                    <span className="Home__cloud Home__cloud--one" aria-hidden="true" />
                    <span className="Home__cloud Home__cloud--two" aria-hidden="true" />
                    <div className="Home__logo">
                        <Logo size={320} />
                        <span className="Home__splash" aria-hidden="true">{t(splash)}</span>
                    </div>
                </div>
                <div className="Home__intro">
                    <h1 className="visually-hidden">Minecraft Tap-Tap</h1>
                    <p>{t("Тапай по блоках, збирай ресурси й створюй предмети на верстаках. Усе в одному застосунку.")}</p>
                    <button className="mc-btn mc-btn--green mc-btn--block Home__play" onClick={() => navigate("/game")}>{t("Грати")}</button>
                </div>
            </section>

            <section className="Home__features" aria-label={t("Можливості")}>
                {FEATURES.map((feature, index) => (
                    <article key={feature.title} className="Home__feature mc-panel" style={{ animationDelay: `${120 + index * 70}ms` }}>
                        <span className="Home__feature-icon"><ServerImage imgSrc={feature.icon} /></span>
                        <div>
                            <h2>{t(feature.title)}</h2>
                            <p>{t(feature.text)}</p>
                        </div>
                    </article>
                ))}
            </section>

            <section className="Home__steps mc-panel" style={{ animationDelay: "340ms" }}>
                <h2>{t("Як почати?")}</h2>
                <ol>
                    {STEPS.map(step => (
                        <li key={step.text}>
                            <span className="Home__step-icon"><ServerImage imgSrc={step.icon} /></span>
                            <span>{t(step.text)}</span>
                        </li>
                    ))}
                </ol>
            </section>
        </main>
    )
}

export default Home
