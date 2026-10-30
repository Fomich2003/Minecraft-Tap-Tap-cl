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

    async buy(telegramData, slug, quantity) {
        return await smartFetch("/inventory/buy", {
            body: JSON.stringify({ telegramData, slug, quantity }),
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
