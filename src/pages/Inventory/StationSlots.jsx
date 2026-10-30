import ServerImage from "../../components/ServerImage/ServerImage"

function StationSlot({ slot, placed, dragOver, handlers }) {
    const value = placed[slot.key]
    return (
        <div
            className={`Inventory__craft-slot${dragOver === `craft-${slot.key}` ? " Inventory__craft-slot--target" : ""}`}
            data-craft-index={slot.key}
            aria-label={slot.label || `Слот ${Number(slot.key) + 1}`}
            onDragOver={event => { event.preventDefault(); handlers.setDragOver(`craft-${slot.key}`) }}
            onDragLeave={() => handlers.setDragOver(null)}
            onDrop={event => { event.preventDefault(); handlers.dropOnSlot(slot.key) }}
            onClick={() => handlers.clickSlot(slot.key)}
        >
            {value
                ? <div className="Inventory__craft-item" draggable onDragStart={() => handlers.dragFromSlot(slot.key)} onTouchStart={() => handlers.dragFromSlot(slot.key)}>
                    <ServerImage imgSrc={value.entry.itemId.icon} imgClass="Inventory__image" alt={value.entry.itemId.name} />
                    {value.count > 1 && <span className="Inventory__count">{value.count}</span>}
                </div>
                : slot.label && <span className="Inventory__slot-label">{slot.label}</span>}
        </div>
    )
}

function ResultButton({ result, catalog, disabled, onClick, coinCost }) {
    const item = result && catalog?.items.find(entry => entry.slug === result.slug)
    return (
        <button
            type="button"
            className={`Inventory__craft-result${result ? " Inventory__craft-result--ready" : ""}`}
            aria-label={item ? `Створити ${item.name}, кількість ${result.quantity ?? 1}` : "Результат"}
            disabled={!result || disabled}
            onClick={onClick}
        >
            {item && <>
                <ServerImage imgSrc={item.icon} imgClass="Inventory__image" alt={item.name} />
                <span className="Inventory__craft-result-count">{result.quantity ?? 1}</span>
                {coinCost > 0 && <span className="Inventory__craft-cost">{coinCost}</span>}
            </>}
        </button>
    )
}

export { StationSlot, ResultButton }
