import "./TelegramAlert.scss"
import { Logo } from "../../utils/icons"
import { t } from "../../i18n"

const ACCESS_DENIED = "Minecraft Tap-Tap працює всередині Telegram. Відкрий бота, щоб почати гру."

function TelegramAlert({ title = "Minecraft Tap-Tap", message = title === "Minecraft Tap-Tap" ? t(ACCESS_DENIED) : "", onRetry, loading = false }) {
    return (
        <div className="telegramAlert">
            <section className="telegramAlert__content">
                <Logo size={220} />
                <h1>{title}</h1>
                {message && <p>{message}</p>}
                {loading && <div className="telegramAlert__bar" role="progressbar" aria-label={title}><i /></div>}
                {onRetry && <button type="button" className="mc-btn mc-btn--green" onClick={onRetry}>{t("Спробувати ще раз")}</button>}
                {!onRetry && !loading && <a className="mc-btn mc-btn--green" href="https://t.me/minecraft_taptap_bot">{t("Відкрити бота")}</a>}
            </section>
        </div>
    )
}

export default TelegramAlert
