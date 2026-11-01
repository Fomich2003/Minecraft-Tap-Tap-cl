import smartFetch from "../utils/smartFetch"

const post = (path, body, extra) => smartFetch(path, {
    body: JSON.stringify(body),
    method: "POST",
    headers: { "Content-Type": "application/json" },
    ...extra,
})

class MobService {
    list(telegramData) {
        return post("/mob/list", { telegramData })
    }

    buy(telegramData, slug) {
        return post("/mob/buy", { telegramData, slug })
    }

    summon(telegramData, slug) {
        return post("/mob/summon", { telegramData, slug })
    }

    // Удари, як і тапи, мають дійти навіть після згортання застосунку
    hit(telegramData, slug, count) {
        return post("/mob/hit", { telegramData, slug, count }, { keepalive: true })
    }
}

const mobService = new MobService()

export default mobService
