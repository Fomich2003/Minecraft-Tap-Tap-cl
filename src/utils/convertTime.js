function has24HoursPassed(dateString) {
    const pastTime = new Date(dateString).getTime()
    const now = Date.now()

    const diffHours = (now - pastTime) / (1000 * 60 * 60)

    return diffHours >= 24
}


function getRemainingTime(dateString) {
    const pastTime = new Date(dateString).getTime()

    const endTime = pastTime + 24 * 60 * 60 * 1000

    const now = Date.now()

    const diff = endTime - now

    if (diff <= 0) {
        return "00:00:00"
    }

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

export { has24HoursPassed, getRemainingTime } 