import { useMemo, useState } from "react"
import BottomSheet from "../../components/BottomSheet/BottomSheet"
import ServerImage from "../../components/ServerImage/ServerImage"
import { useUserContext } from "../../context/UserContext"

const PAGE_SIZE = 45
const QUANTITIES = [1, 8, 64]

function ShopSheet({ open, onClose }) {
    const { user, catalog, inventory, buyItem, sellStack } = useUserContext()
    const [tab, setTab] = useState("buy")
    const [query, setQuery] = useState("")
    const [limit, setLimit] = useState(PAGE_SIZE)
    const [quantity, setQuantity] = useState(1)
    const [message, setMessage] = useState("")

    const matches = useMemo(() => {
        const text = query.trim().toLowerCase()
        return (catalog?.items ?? [])
            .filter(item => item.buyable && (!text || item.name.toLowerCase().includes(text) || item.slug.includes(text)))
            .sort((a, b) => a.marketPrice - b.marketPrice)
    }, [catalog, query])

    const report = result => setMessage(result.success ? "" : result.message)

    return (
        <BottomSheet open={open} onClose={onClose} label="Магазин предметів">
            <div className="BottomSheet__tabs">
                <button className={`BottomSheet__tab${tab === "buy" ? " BottomSheet__tab--active" : ""}`} onClick={() => setTab("buy")}>Купити</button>
                <button className={`BottomSheet__tab${tab === "sell" ? " BottomSheet__tab--active" : ""}`} onClick={() => setTab("sell")}>Продати</button>
            </div>
            {message && <p className="BottomSheet__message">{message}</p>}

            {tab === "buy" ? <>
                <input
                    className="BottomSheet__search"
                    value={query}
                    onChange={event => { setQuery(event.target.value); setLimit(PAGE_SIZE) }}
                    placeholder="Пошук предмета"
                    aria-label="Пошук предмета"
                />
                <div className="BottomSheet__tabs">
                    {QUANTITIES.map(value => (
                        <button key={value} className={`BottomSheet__tab${quantity === value ? " BottomSheet__tab--active" : ""}`} onClick={() => setQuantity(value)}>×{value}</button>
                    ))}
                </div>
                <div className="BottomSheet__list">
                    {matches.slice(0, limit).map(item => {
                        const amount = Math.min(quantity, item.maxStack)
                        const cost = item.marketPrice * amount
                        return (
                            <div key={item.slug} className="BottomSheet__item">
                                <ServerImage imgSrc={item.icon} alt={item.name} />
                                <h3>{item.name}</h3>
                                <p><strong>{cost}</strong></p>
                                <button className="BottomSheet__buy" disabled={user.balance < cost} onClick={async () => report(await buyItem(item.slug, amount))}>
                                    {amount > 1 ? `Купити ${amount}` : "Купити"}
                                </button>
                            </div>
                        )
                    })}
                    {matches.length > limit && <button className="BottomSheet__more" onClick={() => setLimit(limit + PAGE_SIZE)}>Показати ще</button>}
                </div>
            </> : (
                <div className="BottomSheet__list">
                    {(inventory?.items ?? []).map(stack => {
                        const item = stack.itemId
                        return (
                            <div key={stack._id} className="BottomSheet__item">
                                <ServerImage imgSrc={item.icon} alt={item.name} />
                                <h3>{item.name}</h3>
                                <p><strong>{item.sellPrice * stack.quantity}</strong></p>
                                <button className="BottomSheet__buy" onClick={async () => report(await sellStack(stack._id, stack.quantity))}>
                                    Продати {stack.quantity}
                                </button>
                            </div>
                        )
                    })}
                </div>
            )}
        </BottomSheet>
    )
}

export default ShopSheet
