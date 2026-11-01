import ServerImage from "../../components/ServerImage/ServerImage"
import Banner from "../../components/Banner/Banner"
import { itemName, t } from "../../i18n"
import { itemIcon } from "../../utils/item-icon"

function StationSlot({ slot, placed, dragOver, handlers }) {
    const value = placed[slot.key]
    const name = slot.label ? t(slot.label) : t("Слот {number}", { number: Number(slot.key) + 1 })
    return (
        <button
            type="button"
            className={`Inventory__craft-slot${dragOver === `craft-${slot.key}` ? " Inventory__craft-slot--target" : ""}`}
            data-craft-index={slot.key}
            aria-label={value ? t("{slot}: {item}, кількість {count}", { slot: name, item: itemName(value.entry.itemId), count: value.count }) : name}
            onClick={() => handlers.clickSlot(slot.key)}
        >
            {value
                ? <span className="Inventory__craft-item" key={value.entry.itemId._id} onPointerDown={event => handlers.dragFromSlot(event, slot.key, value)} onContextMenu={event => event.preventDefault()}>
                    {value.entry.components?.banner_patterns?.length
                        ? <Banner base={value.entry.itemId.slug.replace(/_banner$/, "")} layers={value.entry.components.banner_patterns} className="Inventory__banner" />
                        : <ServerImage imgSrc={itemIcon(value.entry.itemId, value.entry.components)} imgClass="Inventory__image" alt="" />}
                    {value.count > 1 && <span className="Inventory__count">{value.count}</span>}
                </span>
                : slot.label && <span className="Inventory__slot-label">{t(slot.label)}</span>}
        </button>
    )
}

function ResultButton({ result, catalog, disabled, onClick, xpCost }) {
    const item = result && catalog?.items.find(entry => entry.slug === result.slug)
    return (
        <button
            type="button"
            className={`Inventory__craft-result${result ? " Inventory__craft-result--ready" : ""}`}
            aria-label={item ? t("Створити: {item}, кількість {count}", { item: itemName(item), count: result.quantity ?? 1 }) : t("Результат")}
            disabled={!result || disabled}
            onClick={onClick}
        >
            {item && <span className="Inventory__result-art" key={item.slug}>
                {result.components?.banner_patterns
                    ? <Banner base={item.slug.replace(/_banner$/, "")} layers={result.components.banner_patterns} className="Inventory__banner" />
                    : <ServerImage imgSrc={itemIcon(item, result.components)} imgClass="Inventory__image" alt="" />}
                <span className="Inventory__count">{result.quantity ?? 1}</span>
                {xpCost > 0 && <span className="Inventory__craft-cost">{xpCost} XP</span>}
            </span>}
        </button>
    )
}

export { StationSlot, ResultButton }
