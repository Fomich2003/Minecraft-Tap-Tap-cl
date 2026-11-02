import { gameName, itemName } from "../../i18n"

// Назви мобів і блоків лежать у різних групах перекладу
export const cardName = card => (card.kind === "mob" ? gameName("mobs", card.slug, card.name) : itemName(card))
