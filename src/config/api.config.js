const mode = import.meta.env.MODE;

// VITE_API_URL у .env.local змінює адресу сервера без правки коду (наприклад, тестовий сервер на іншому порту)
const DEFAULT_SERVER = mode === "production" ? "https://stump-facial-tannery.ngrok-free.dev" : "http://localhost:6788"

const CLIENT_CONF = {
    mode,
    serverUrl: import.meta.env.VITE_API_URL || DEFAULT_SERVER
}

const API_CONF = {
    baseUrl: `${CLIENT_CONF.serverUrl}/api`,
    // Іконки лежать у public/items: безплатний ngrok не віддає браузеру картинки без заголовка, який тег img не надсилає
    baseFileUrl: ""
}

export { API_CONF, CLIENT_CONF }