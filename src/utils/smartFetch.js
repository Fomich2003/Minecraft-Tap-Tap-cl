import { API_CONF } from "../config/api.config"

async function smartFetch(path, options = {}) {
    const debug = {}
    try {
        const response = await fetch(API_CONF.baseUrl + path, options)
        const data = await response.json()

        debug.data = data

        if (!response.ok) {
            if (!data.message) throw new Error("Негативна відповідь від сервера, і немає повідомлення про помилку")
            return {
                success: false,
                message: data.message
            }
        }
        return data
    } catch (error) {
        console.log(error.message)
        return {
            success: false,
            message: "Ой! Щось пішло не так, спробуйте пізніше...",
            error: error.message,
            debug
        }
    }
}

export default smartFetch