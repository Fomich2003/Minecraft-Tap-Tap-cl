import "./NavBar.scss"
import { NavLink } from "react-router-dom"
import ServerImage from "../ServerImage/ServerImage"
import { useUserContext } from "../../context/UserContext"
import { t } from "../../i18n"

const LINKS = [
    { to: "/", label: "Головна", icon: "/items/grass_block.png" },
    { to: "/game", label: "Гра", icon: "/items/diamond_pickaxe.png" },
    { to: "/inventory", label: "Інвентар", icon: "/items/crafting_table.png" },
    { to: "/quests", label: "Квести", icon: "/items/writable_book.png" },
    { to: "/cards", label: "Карти", icon: "/items/item_frame.png" },
    { to: "/top", label: "Топ", icon: "/items/golden_helmet.png" },
    { to: "/profile", label: "Профіль", icon: "/items/player_head.png" },
]

function NavBar() {
    const { user } = useUserContext()
    const questsReady = user?.questsReady ?? 0

    return (
        <nav className="NavBar" aria-label={t("Головне меню")}>
            <div className="NavBar__wrapper">
                {LINKS.map(link => (
                    <NavLink key={link.to} to={link.to} end className={({ isActive }) => `NavBar__link${isActive ? " NavBar__link--active" : ""}`}>
                        <span className="NavBar__slot">
                            <ServerImage imgSrc={link.icon} />
                            {link.to === "/quests" && questsReady > 0 && <span className="NavBar__badge" key={questsReady}>{questsReady}</span>}
                        </span>
                        <span className="NavBar__label">{t(link.label)}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    )
}

export default NavBar
