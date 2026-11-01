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
    async getUserBlocks(telegramData) {
        return await smartFetch("/block/get-userblocks", {
            body: JSON.stringify({ telegramData }),
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        })
    }

    async getBlocksToTap() {
        return await smartFetch("/block/all-taps", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        })
    }

    async sendTapsBlock(telegramData, slug, count) {
        return await smartFetch("/block/tap", {
            body: JSON.stringify({ telegramData, slug, count }),
            method: "POST",
            // Запит має дійти, навіть якщо гравець щойно згорнув застосунок
            keepalive: true,
            headers: {
                "Content-Type": "application/json"
            }
        })
    }

    async buyBlock(telegramData, slug) {
        return await smartFetch("/block/buy", {
            body: JSON.stringify({ telegramData, slug }),
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        })
    }
}

const blockService = new BlockService()

export default blockService