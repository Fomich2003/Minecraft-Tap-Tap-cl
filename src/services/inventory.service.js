import smartFetch from "../utils/smartFetch";

class InventoryService {
    async getUserInventory(telegramData) {
        return await smartFetch("/inventory/full", {
            body: JSON.stringify({ telegramData }),
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        })
    }

    async getCatalog() {
        return await smartFetch("/inventory/catalog")
    }

    async buy(telegramData, slug, quantity, variant) {
        return await smartFetch("/inventory/buy", {
            body: JSON.stringify({ telegramData, slug, quantity, variant }),
            method: "POST",
            headers: { "Content-Type": "application/json" }
        })
    }

    async recycle(telegramData, stackId, quantity) {
        return await smartFetch("/inventory/recycle", {
            body: JSON.stringify({ telegramData, stackId, quantity }),
            method: "POST",
            headers: { "Content-Type": "application/json" }
        })
    }

    async merge(telegramData, fromId, toId) {
        return await smartFetch("/inventory/merge", {
            body: JSON.stringify({ telegramData, fromId, toId }),
            method: "POST",
            headers: { "Content-Type": "application/json" }
        })
    }

    async compact(telegramData) {
        return await smartFetch("/inventory/compact", {
            body: JSON.stringify({ telegramData }),
            method: "POST",
            headers: { "Content-Type": "application/json" }
        })
    }

    async sell(telegramData, stackId, quantity) {
        return await smartFetch("/inventory/sell", {
            body: JSON.stringify({ telegramData, stackId, quantity }),
            method: "POST",
            headers: { "Content-Type": "application/json" }
        })
    }
}

const inventoryService = new InventoryService

export default inventoryService
