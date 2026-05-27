// перевіряє чи пройшло 24 години після отримання бонусу
function has24HoursPassed(dateString) {

    // переводимо дату в milliseconds
    const pastTime = new Date(dateString).getTime()

    // поточний час
    const now = Date.now()

    // різниця між теперішнім часом і минулим у годинах
    const diffHours = (now - pastTime) / (1000 * 60 * 60)

    // повертає true якщо пройшло 24 години або більше
    return diffHours >= 24
}


// функція для отримання залишку часу до нового бонусу
function getRemainingTime(dateString) {

    // час останнього бонусу в milliseconds
    const pastTime = new Date(dateString).getTime()

    // додаємо 24 години до часу останнього бонусу
    const endTime = pastTime + 24 * 60 * 60 * 1000

    // поточний час
    const now = Date.now()

    // різниця між кінцевим часом і теперішнім
    const diff = endTime - now

    // якщо час завершився
    if (diff <= 0) {
        return "00:00:00"
    }

    // отримуємо години
    const hours = Math.floor(diff / (1000 * 60 * 60))

    // отримуємо хвилини
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    // отримуємо секунди
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    // повертаємо формат 00:00:00
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

export { has24HoursPassed, getRemainingTime }