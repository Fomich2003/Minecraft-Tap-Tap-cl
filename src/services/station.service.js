import smartFetch from "../utils/smartFetch"

const post = (path, body) => smartFetch(path, {
    body: JSON.stringify(body),
    method: "POST",
    headers: { "Content-Type": "application/json" }
})

class StationService {
    list(telegramData) {
        return post("/station/list", { telegramData })
    }

    buy(telegramData, slug) {
        return post(`/station/${slug}/buy`, { telegramData })
    }

    activate(telegramData, slug) {
        return post(`/station/${slug}/activate`, { telegramData })
    }

    preview(telegramData, slug, slots, options) {
        return post(`/station/${slug}/preview`, { telegramData, slots, options })
    }

    apply(telegramData, slug, slots, options) {
        return post(`/station/${slug}/apply`, { telegramData, slots, options })
    }

    job(telegramData, slug) {
        return post(`/station/${slug}/job`, { telegramData })
    }

    cookPreview(telegramData, slug, slots) {
        return post(`/station/${slug}/cook-preview`, { telegramData, slots })
    }

    cook(telegramData, slug, slots, quantity) {
        return post(`/station/${slug}/cook`, { telegramData, slots, quantity })
    }

    brew(telegramData, slug, slots) {
        return post(`/station/${slug}/brew`, { telegramData, slots })
    }

    collect(telegramData, slug) {
        return post(`/station/${slug}/collect`, { telegramData })
    }

    cancel(telegramData, slug) {
        return post(`/station/${slug}/cancel`, { telegramData })
    }
}

const stationService = new StationService()

export default stationService
