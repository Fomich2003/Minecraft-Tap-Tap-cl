import { INVENTORY_CONF } from "../config/inventory.config";

function getInventorySize(itemsCount) {
    return Math.max(INVENTORY_CONF.minSlots, Math.ceil((itemsCount + INVENTORY_CONF.extraSlots) / INVENTORY_CONF.columns) * INVENTORY_CONF.columns)
}

export default getInventorySize