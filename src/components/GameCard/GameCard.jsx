import "./GameCard.scss"
import ServerImage from "../ServerImage/ServerImage"
import { MAX_CARD_LEVEL, RARITIES, SUITS } from "../../config/cards.config"
import { cardName } from "./cardName"
import { t } from "../../i18n"

// Карта як предмет гри: тло локації, рамка рідкісності, масть у куті й рівень унизу.
// Невідкрита карта показує лише силует, щоб колекцію хотілося дозбирати
function GameCard({ card, size = "medium", known = card.copies > 0, selected = false, onClick, label }) {
    const name = cardName(card)
    const className = [
        "GameCard", `GameCard--${size}`, `GameCard--${card.rarity}`, `GameCard--${card.location}`,
        known ? "" : "GameCard--unknown", selected ? "GameCard--selected" : "",
    ].filter(Boolean).join(" ")

    const face = (
        <>
            <span className="GameCard__art">
                <ServerImage imgSrc={card.icon} alt="" />
                {known && <span className="GameCard__suit" title={t(SUITS[card.suit].name)}><ServerImage imgSrc={SUITS[card.suit].icon} alt="" /></span>}
                {known && (card.rarity === "epic" || card.rarity === "legendary") && <span className="GameCard__glint" />}
                {!known && <span className="GameCard__unknown">?</span>}
            </span>
            <span className="GameCard__name">{known ? name : "???"}</span>
            {known && size !== "tiny" && <span className="GameCard__pips" aria-hidden="true">
                {Array.from({ length: MAX_CARD_LEVEL }, (_, index) => <i key={index} className={index < card.level ? "GameCard__pip--on" : ""} />)}
            </span>}
        </>
    )

    const description = label ?? (known ? `${name}, ${t(RARITIES[card.rarity])}, ${t("Рівень {level}", { level: card.level })}` : t("Невідома карта"))
    return onClick
        ? <button type="button" className={className} onClick={onClick} aria-label={description} aria-pressed={selected || undefined}>{face}</button>
        : <span className={className} role="img" aria-label={description}>{face}</span>
}

export default GameCard
