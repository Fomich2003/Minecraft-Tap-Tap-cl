import "./ServerImage.scss"
import { API_CONF } from "../../config/api.config"

function ServerImage({ imgSrc, imgClass = "" }) {
    return (
        <>
            {/* <img className={`ServerImage ${imgClass}`} src={API_CONF.baseFileUrl + imgSrc} alt="photo" /> */}
            <img className={`ServerImage ${imgClass}`} src="/assets/icons/public/assets/icons/image.png" alt="photo" />

        </>


    )
}

export default ServerImage

