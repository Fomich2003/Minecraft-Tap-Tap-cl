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

    async getWorkbenchRecipes(telegramData) {
        return await smartFetch("/inventory/workbench", {
            body: JSON.stringify({ telegramData }),
            method: "POST",
            headers: { "Content-Type": "application/json" }
        })
    }

    async craft(telegramData, recipeId, items) {
        return await smartFetch("/inventory/craft", {
            body: JSON.stringify({ telegramData, recipeId, items }),
            method: "POST",
            headers: { "Content-Type": "application/json" }
        })
    }
}

const inventoryService = new InventoryService

export default inventoryService
