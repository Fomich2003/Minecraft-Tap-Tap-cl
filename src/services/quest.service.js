import smartFetch from "../utils/smartFetch"

const post = (path, body) => smartFetch(path, {
    body: JSON.stringify(body),
    method: "POST",
    headers: { "Content-Type": "application/json" }
})

class QuestService {
    list(telegramData) {
        return post("/quest/list", { telegramData })
    }

    claim(telegramData, id) {
        return post("/quest/claim", { telegramData, id })
    }
}

const questService = new QuestService()

export default questService
