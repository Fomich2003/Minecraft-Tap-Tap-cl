import "./TelegramAlert.scss"
import { useEffect } from "react"
import { Logo } from "../../utils/icons"
import { GAME_LINK, reopenInTelegram } from "../../utils/telegram"
import { t } from "../../i18n"

const ACCESS_DENIED = "Minecraft Tap-Tap працює всередині Telegram. Відкрий бота, щоб почати гру."

function TelegramAlert({ title = "Minecraft Tap-Tap", message = title === "Minecraft Tap-Tap" ? t(ACCESS_DENIED) : "", onRetry, loading = false }) {
    const isBlocked = !onRetry && !loading

    useEffect(() => {
        if (isBlocked) reopenInTelegram()
    }, [isBlocked])

    return (
        <div className="telegramAlert">
            <section className="telegramAlert__content">
                <Logo size={220} />
                <h1>{title}</h1>
                {message && <p>{message}</p>}
                {loading && <div className="telegramAlert__bar" role="progressbar" aria-label={title}><i /></div>}
                {onRetry && <button type="button" className="mc-btn mc-btn--green" onClick={onRetry}>{t("Спробувати ще раз")}</button>}
                {isBlocked && <a className="mc-btn mc-btn--green" href={GAME_LINK}>{t("Відкрити бота")}</a>}
            </section>
        </div>
    )
}

export default TelegramAlert
