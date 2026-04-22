import "./NavBar.scss"
import { HomeIcon, ProfileIcon, GameIcon, InventoryIcon } from "../../utils/icons.jsx"
import { NavLink } from "react-router-dom"



function NavBar() {



    return (<nav className="NavBar">
        <div className="NavBar__wrapper">
            <NavLink to={"/"} className={({ isActive }) => isActive ? "NavBar__link NavBar__link-active" : "NavBar__link"}>
                <HomeIcon />
            </NavLink>
            <NavLink to={"/game"} className={({ isActive }) => isActive ? "NavBar__link NavBar__link-active" : "NavBar__link"}>
                <GameIcon />
            </NavLink>
            <NavLink to={"/inventory"} className={({ isActive }) => isActive ? "NavBar__link NavBar__link-active" : "NavBar__link"}>
                <InventoryIcon />
            </NavLink>
            <NavLink to={"/profile"} className={({ isActive }) => isActive ? "NavBar__link NavBar__link-active" : "NavBar__link"}>
                <ProfileIcon />
            </NavLink>
        </div>
    </nav>)
}

export default NavBar