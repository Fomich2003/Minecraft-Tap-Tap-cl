import "./Header.scss"
import { Logo, CoinIcon } from "../../utils/icons"
import { Link } from "react-router-dom"
import { useUserContext } from "../../context/UserContext"
import { useEffect, useState } from "react"

function Header() {
    const [balance, setBalance] = useState(0)
    const { user, isLoadingUser } = useUserContext()
    useEffect(() => {
        if (!user) return 
        setBalance(user.balance) 
    }, [user])
    if (!user || isLoadingUser) return null
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