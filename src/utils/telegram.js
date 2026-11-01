const BACKGROUND_COLOR = "#1e1f22"

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

export { setupTelegram, haptic }
