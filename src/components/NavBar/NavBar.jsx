import "./NavBar.scss"
import { HomeIcon, ProfileIcon, GameIcon, InventoryIcon } from "../../utils/icons.jsx"
import { NavLink } from "react-router-dom"



function NavBar() {



    return (<nav className="NavBar">
        <div className="NavBar__wrapper">
            <NavLink to={"/"}>
                <HomeIcon />
            </NavLink>
            <NavLink to={"/game"}>
                <GameIcon />
            </NavLink>
            <NavLink to={"/inventory"}>
                <InventoryIcon />
            </NavLink>
            <NavLink to={"/profile"}>
                <ProfileIcon />
            </NavLink>
        </div>
    </nav>)
}

export default NavBar