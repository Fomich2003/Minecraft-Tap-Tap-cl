import "./ServerImage.scss"
import { API_CONF } from "../../config/api.config"

function ServerImage({ imgSrc, imgClass = "", alt = "" }) {
    return <img className={`ServerImage ${imgClass}`} src={API_CONF.baseFileUrl + imgSrc} alt={alt} loading="lazy" draggable={false} />
}

export default ServerImage
