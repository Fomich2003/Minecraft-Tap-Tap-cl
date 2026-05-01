import "./Header.scss"
import { Logo, CoinIcon } from "../../utils/icons"
import { Link } from "react-router-dom"


function Header({ balance = 0 }) {
    return (
        <header className="Header">
            <div className="Header__wrapper">
                <Link to="/" className="Header__logo">
                    <Logo />
                </Link>
                <div className="Header__balance">
                    <span>{balance}</span>
                    <CoinIcon />
                </div>
            </div>
        </header>
    )
}


export default Header