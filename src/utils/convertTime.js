const DAY_MS = 24 * 60 * 60 * 1000

// перевіряє чи пройшло 24 години після отримання бонусу
function has24HoursPassed(dateString, now = Date.now()) {
    return now - new Date(dateString).getTime() >= DAY_MS
}

// залишок часу у форматі 00:00:00
function formatRemaining(diff) {
    if (diff <= 0) return "00:00:00"

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    return [hours, minutes, seconds].map(value => String(value).padStart(2, "0")).join(":")
}

// залишок часу до нового бонусу
const getRemainingTime = (dateString, now = Date.now()) => formatRemaining(new Date(dateString).getTime() + DAY_MS - now)

export { has24HoursPassed, getRemainingTime, formatRemaining }
