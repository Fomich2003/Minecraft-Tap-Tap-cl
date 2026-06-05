import "./ServerImage.scss"
import { API_CONF } from "../../config/api.config"
import statickImage from '../../../public/assets/icons/public/assets/icons/image.png';


function ServerImage({ imgSrc, imgClass = "" }) {
    return (
        <>
            {/* <img className={`ServerImage ${imgClass}`} src={API_CONF.baseFileUrl + imgSrc} alt="photo" /> */}
            <img className={`ServerImage ${imgClass}`} src={statickImage} alt="photo" />

        </>


    )
}

export default ServerImage

