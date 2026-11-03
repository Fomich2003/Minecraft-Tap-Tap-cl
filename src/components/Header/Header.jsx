import "./Header.scss"
import { useRef } from "react"
import useRollingNumber from "./useRollingNumber"
import { Link } from "react-router-dom"
import { Logo, CoinIcon, GlobeIcon } from "../../utils/icons"
import { useUserContext } from "../../context/UserContext"
import { formatNumber } from "../../utils/format"
import { getLanguage, t } from "../../i18n"

const BALANCE_BUMP = [{ transform: "scale(1)" }, { transform: "scale(1.12)" }, { transform: "scale(1)" }]

function Header({ onOpenLanguages }) {
    const { user } = useUserContext()
    const balanceNode = useRef(null)
    const balance = user?.balance

    const bump = () => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
        balanceNode.current?.animate?.(BALANCE_BUMP, { duration: 140, easing: "steps(3)" })
    }
    const amountNode = useRollingNumber(balance, bump)

    return (
        <header className="Header">
            <div className="Header__wrapper">
                <Link to="/" className="Header__logo" aria-label={t("На головну")}>
                    <Logo size={44} />
                    <span className="Header__title">Tap-Tap</span>
                </Link>
                <div className="Header__side">
                    <button className="Header__language" onClick={onOpenLanguages} aria-label={t("Змінити мову")}>
                        <GlobeIcon />
                        <span>{getLanguage().split("-")[0].toUpperCase()}</span>
                    </button>
                    <div className="Header__balance" ref={balanceNode} aria-label={t("Баланс: {amount}", { amount: formatNumber(balance) })}>
                        <span ref={amountNode} />
                        <CoinIcon />
                    </div>
                </div>
            </div>
        </header>
    )
}

export default Header
