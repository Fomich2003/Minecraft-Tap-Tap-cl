import { useEffect, useState } from "react"

const formatLeft = ms => {
    const seconds = Math.ceil(ms / 1000)
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
}

// Таймер живе в окремому компоненті, щоб щосекундне оновлення не перемальовувало всю сторінку тапу
function useCountdown(effects) {
    const [now, setNow] = useState(() => Date.now())
    const running = effects.length > 0

    useEffect(() => {
        if (!running) return
        const timer = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(timer)
    }, [running])

    return effects
        .map(effect => ({ ...effect, left: new Date(effect.expiresAt).getTime() - now }))
        .filter(effect => effect.left > 0)
}

export { useCountdown, formatLeft }
