import "./CardReveal.scss"
import GameCard from "../GameCard/GameCard"
import { cardName } from "../GameCard/cardName"
import { t } from "../../i18n"

function revealText(card) {
    if (card.xp > 0) return [t("Карта на максимумі"), t("+{xp} досвіду", { xp: card.xp })]
    if (card.isNew) return [t("Нова карта!"), cardName(card)]
    if (card.levelUp) return [t("Рівень {level}!", { level: card.level }), cardName(card)]
    return [t("Ще одна карта"), t("Копій: {current} / {needed}", { current: card.copies, needed: card.next })]
}

// Карта вилітає й перевертається поверх гри, не заважаючи тапати далі
function CardReveal({ card, onDone, side = false }) {
    const [title, subtitle] = revealText(card)
    const special = card.isNew || card.levelUp || card.rarity === "legendary"
    return (
        <div className={`CardReveal CardReveal--${card.rarity}${special ? " CardReveal--special" : ""}${side ? " CardReveal--side" : ""}`} role="status"
            onAnimationEnd={event => event.target === event.currentTarget && onDone()}>
            {special && <span className="CardReveal__rays" aria-hidden="true" />}
            <span className="CardReveal__card"><GameCard card={card} known /></span>
            <strong>{title}</strong>
            <span>{subtitle}</span>
        </div>
    )
}

export default CardReveal
