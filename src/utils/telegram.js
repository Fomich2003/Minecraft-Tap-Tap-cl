const BACKGROUND_COLOR = "#1e1f22"

const BOT_LINK = "https://t.me/minecraft_taptap_bot"

// Пряме посилання на застосунок бота: воно відкриває гру з підписом гравця
const GAME_LINK = `${BOT_LINK}?startapp`

const webApp = () => window.Telegram?.WebApp
const supports = version => Boolean(webApp()?.isVersionAtLeast?.(version))

function setupTelegram() {
    const app = webApp()
    if (!app?.initData) return
    app.ready()
    app.expand()
    if (supports("6.1")) {
        app.setHeaderColor(BACKGROUND_COLOR)
        app.setBackgroundColor(BACKGROUND_COLOR)
    }
    // Інакше свайп по інвентарю згортає застосунок
    if (supports("7.7")) app.disableVerticalSwipes()
}

const HAPTICS = {
    tap: feedback => feedback.impactOccurred("light"),
    break: feedback => feedback.impactOccurred("medium"),
    drag: feedback => feedback.selectionChanged(),
    success: feedback => feedback.notificationOccurred("success"),
    error: feedback => feedback.notificationOccurred("error"),
}

function haptic(kind) {
    if (supports("6.1")) HAPTICS[kind](webApp().HapticFeedback)
}

// Посилання з чату відкривається у вбудованому браузері Telegram, де підпису немає. Гравця веде назад у застосунок
function reopenInTelegram() {
    const insideTelegram = /Telegram/i.test(navigator.userAgent) || Boolean(window.TelegramWebview || window.TelegramWebviewProxy)
    if (insideTelegram && !webApp()?.initData) window.location.replace(GAME_LINK)
}

// Реферальне посилання веде в чат із ботом: /start спрацьовує навіть без налаштованого головного застосунку
const referralLink = userId => `${BOT_LINK}?start=ref_${userId}`

function shareLink(url, text) {
    const share = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
    if (supports("6.1")) webApp().openTelegramLink(share)
    else window.open(share, "_blank", "noopener")
}

export { GAME_LINK, setupTelegram, reopenInTelegram, haptic, referralLink, shareLink }
