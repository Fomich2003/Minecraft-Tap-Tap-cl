import { useEffect, useLayoutEffect, useRef } from "react"
import { formatNumber } from "../../utils/format"

const ROLL_MS = 450

// Баланс «докручується» до нового значення, як лічильник досвіду в оригіналі.
// Число пишеться прямо в DOM: 60 кадрів за секунду не мають перемальовувати React.
function useRollingNumber(value, onRise) {
    const node = useRef(null)
    const shown = useRef(value)
    const frame = useRef(0)

    // Текст належить лише цьому хуку: якби його малював і React, заміна textContent зламала б його вузол
    useLayoutEffect(() => {
        if (node.current) node.current.textContent = formatNumber(shown.current)
    }, [])

    useEffect(() => {
        const from = shown.current
        if (typeof value !== "number" || from === value) return
        if (value > from) onRise?.()
        cancelAnimationFrame(frame.current)

        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        if (reduced || typeof from !== "number") {
            shown.current = value
            if (node.current) node.current.textContent = formatNumber(value)
            return
        }

        const start = performance.now()
        const roll = now => {
            const progress = Math.min(1, (now - start) / ROLL_MS)
            const eased = 1 - (1 - progress) ** 3
            shown.current = Math.round(from + (value - from) * eased)
            if (node.current) node.current.textContent = formatNumber(shown.current)
            if (progress < 1) frame.current = requestAnimationFrame(roll)
        }
        frame.current = requestAnimationFrame(roll)
        return () => cancelAnimationFrame(frame.current)
        // eslint-disable-next-line react-hooks/exhaustive-deps -- onRise лише реакція на зміну, а не причина її
    }, [value])

    return node
}

export default useRollingNumber
