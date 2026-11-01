import { API_CONF } from "../config/api.config"
import { t } from "../i18n"

const GENERIC_ERROR = "Ой! Щось пішло не так, спробуйте пізніше..."
const CYRILLIC = /[а-яіїєґ]/i

async function smartFetch(path, options = {}) {
    try {
        // Безплатний ngrok інакше віддає сторінку попередження замість відповіді сервера
        const response = await fetch(API_CONF.baseUrl + path, { ...options, headers: { ...options.headers, "ngrok-skip-browser-warning": "1" } })
        const data = await response.json()


        if (!response.ok) {
            if (!data.message) throw new Error("Негативна відповідь від сервера, і немає повідомлення про помилку")
            // Збій сервера приходить технічним текстом англійською: він не для гравця
            const readable = response.status < 500 || CYRILLIC.test(data.message)
            return {
                success: false,
                status: response.status,
                // Сервер надсилає український текст-ключ, а перекладає його клієнт
                message: readable ? t(data.message, data.params) : t(GENERIC_ERROR)
            }
        }
        return data
    } catch (error) {
        console.log(error.message)
        return {
            success: false,
            message: t(GENERIC_ERROR),
            error: error.message
        }
    }
}

export default smartFetch