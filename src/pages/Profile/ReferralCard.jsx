import { useRef, useState } from "react"
import { useUserContext } from "../../context/UserContext"
import ServerImage from "../../components/ServerImage/ServerImage"
import { formatNumber } from "../../utils/format"
import { haptic, referralLink, shareLink } from "../../utils/telegram"
import { t } from "../../i18n"

const COPIED_MS = 1800

function ReferralCard() {
    const { user } = useUserContext()
    const [copied, setCopied] = useState(false)
    const field = useRef(null)
    const link = referralLink(user._id)

    // Vercel публікує клієнт незалежно від сервера на ПК: старий сервер ще не надсилає нагороду
    if (!user.referralReward) return null
    const { inviterCoins, friendCoins } = user.referralReward

    const invite = () => shareLink(link, t("Грай зі мною в Minecraft Tap-Tap і отримай бонус на старті!"))

    const copy = async () => {
        // Деякі вбудовані браузери не дають clipboard: тоді посилання виділяється в полі
        field.current.select()
        try {
            await navigator.clipboard.writeText(link)
        } catch {
            if (!document.execCommand("copy")) return
        }
        setCopied(true)
        haptic("success")
        setTimeout(() => setCopied(false), COPIED_MS)
    }

    return (
        <section className="Profile__referral mc-panel">
            <div className="Profile__referral-head">
                <span className="Profile__referral-icon"><ServerImage imgSrc="/items/emerald.png" alt="" /></span>
                <div>
                    <h2>{t("Запроси друга")}</h2>
                    <p>{t("Запрошено друзів: {count}", { count: formatNumber(user.referrals ?? 0) })}</p>
                </div>
            </div>
            <p className="Profile__referral-text">{t("Ти отримаєш {inviter} монет і скриню за кожного друга, а друг {friend} монет і скриню на старті.", { inviter: formatNumber(inviterCoins), friend: formatNumber(friendCoins) })}</p>
            <input ref={field} className="Profile__referral-link" readOnly value={link} aria-label={t("Реферальне посилання")} dir="ltr" />
            <div className="Profile__referral-actions">
                <button className="mc-btn mc-btn--green" onClick={invite}>{t("Запросити")}</button>
                <button className="mc-btn" onClick={copy}>{t(copied ? "Скопійовано" : "Копіювати")}</button>
            </div>
        </section>
    )
}

export default ReferralCard
