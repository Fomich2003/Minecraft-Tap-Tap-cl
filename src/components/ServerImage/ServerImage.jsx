import "./ServerImage.scss"
import { API_CONF } from "../../config/api.config"


function ServerImage({ imgSrc, imgClass = "" }) {
    return (
        <img className={`ServerImage ${imgClass}`} src={API_CONF.baseFileUrl + imgSrc} alt="photo" />
    )
}

export default ServerImage

