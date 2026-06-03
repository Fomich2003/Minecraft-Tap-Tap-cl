import smartFetch from "../utils/smartFetch"

class BlockService {

    async getFirstBlock(telegramData) {
        return await smartFetch("/block/get-first", {
            body: JSON.stringify({ telegramData }),
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        })
    }



}

const blockService = new BlockService()

export default blockService