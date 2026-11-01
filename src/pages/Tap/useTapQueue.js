import { useEffect, useLayoutEffect, useState } from "react"

const FLUSH_DELAY_MS = 1000
const MAX_FLUSH_INTERVAL_MS = 3000
const SETTLE_ATTEMPTS = 6
const SETTLE_RETRY_MS = 300

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

// Сервер ще може прийняти ці тапи пізніше: мережа, ліміт швидкості, збій
const isTemporaryFailure = result => !result.status || result.status === 429 || result.status >= 500

// Накопичує тапи окремо по блоках і надсилає їх пачками. Одночасно йде лише один запит,
// тому відповіді не перезаписують баланс у неправильному порядку.
function createTapQueue() {
    const pending = new Map()
    let handlers = null
    let inFlight = null
    let timer = null
    let lastFlush = 0

    const pendingTotal = () => [...pending.values()].reduce((sum, count) => sum + count, 0)

    const schedule = () => {
        clearTimeout(timer)
        const sinceFlush = Date.now() - lastFlush
        timer = setTimeout(flush, sinceFlush >= MAX_FLUSH_INTERVAL_MS ? 0 : FLUSH_DELAY_MS)
    }

    const sendBatch = async (slug, count) => {
        const result = await handlers.send(slug, count)
        inFlight = null

        if (result.success) {
            handlers.onSuccess(result, pendingTotal())
        } else if (isTemporaryFailure(result)) {
            pending.set(slug, (pending.get(slug) ?? 0) + count)
        } else {
            handlers.onRejected(result)
        }

        if (pending.size) schedule()
        return result.success
    }

    function flush() {
        clearTimeout(timer)
        if (inFlight) return inFlight

        const next = pending.entries().next().value
        if (!next) return Promise.resolve(true)

        const [slug, count] = next
        pending.delete(slug)
        lastFlush = Date.now()
        inFlight = sendBatch(slug, count)
        return inFlight
    }

    return {
        setHandlers(value) {
            handlers = value
        },
        add(slug) {
            pending.set(slug, (pending.get(slug) ?? 0) + 1)
            schedule()
        },
        flush,
        // Чекає, доки всі зроблені тапи дійдуть до сервера. Потрібно перед діями, які змінюють баланс
        async settle() {
            for (let attempt = 0; attempt < SETTLE_ATTEMPTS; attempt += 1) {
                if (inFlight) await inFlight
                if (!pending.size) return true
                const delivered = await flush()
                if (!delivered) await delay(SETTLE_RETRY_MS)
            }
            return !pending.size && !inFlight
        },
    }
}

function useTapQueue(handlers) {
    const [queue] = useState(createTapQueue)

    useLayoutEffect(() => {
        queue.setHandlers(handlers)
    })

    useEffect(() => {
        const flushWhenHidden = () => {
            if (document.visibilityState === "hidden") queue.flush()
        }
        document.addEventListener("visibilitychange", flushWhenHidden)
        window.addEventListener("pagehide", queue.flush)
        return () => {
            document.removeEventListener("visibilitychange", flushWhenHidden)
            window.removeEventListener("pagehide", queue.flush)
            queue.flush()
        }
    }, [queue])

    return queue
}

export default useTapQueue
