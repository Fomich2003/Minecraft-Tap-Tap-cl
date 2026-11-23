const mode = import.meta.env.MODE;

// VITE_API_URL у .env.local змінює адресу сервера без правки коду (наприклад, тестовий сервер на іншому порту).
// Адреса вшивається під час збирання, тому для продакшну її задає Dockerfile (build arg)
const DEFAULT_SERVER = mode === "production" ? "https://api-tap-tap.fomka.online" : "http://localhost:6788"

const CLIENT_CONF = {
    mode,
    serverUrl: import.meta.env.VITE_API_URL || DEFAULT_SERVER
}

const API_CONF = {
    baseUrl: `${CLIENT_CONF.serverUrl}/api`,
    // Іконки лежать у public/items і віддаються разом із фронтом, а не з API
    baseFileUrl: ""
}

export { API_CONF, CLIENT_CONF }