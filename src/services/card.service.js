import smartFetch from "../utils/smartFetch"

const post = (path, body) => smartFetch(path, {
    body: JSON.stringify(body),
    method: "POST",
    headers: { "Content-Type": "application/json" }
})

class CardService {
    list(telegramData) {
        return post("/card/list", { telegramData })
    }

    setDeck(telegramData, deck) {
        return post("/card/deck", { telegramData, deck })
    }
}

const cardService = new CardService()

export default cardService
