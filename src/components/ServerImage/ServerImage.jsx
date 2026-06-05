import "./ServerImage.scss"
import { API_CONF } from "../../config/api.config"


function ServerImage({ imgSrc, imgClass = "" }) {
    return (
        <>
            <img className={`ServerImage ${imgClass}`} src={API_CONF.baseFileUrl + imgSrc} alt="photo" />
            <p>{API_CONF.baseFileUrl + imgSrc}</p>
        </>


    )
}

export default ServerImage

