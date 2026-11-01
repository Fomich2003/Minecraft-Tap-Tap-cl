const mode = import.meta.env.MODE;

const CLIENT_CONF = {
    mode,
    serverUrl: mode === "production" ?
        `https://stump-facial-tannery.ngrok-free.dev` : "http://localhost:6788"
}

const API_CONF = {
    baseUrl: `${CLIENT_CONF.serverUrl}/api`,
    // Іконки лежать у public/items: безплатний ngrok не віддає браузеру картинки без заголовка, який тег img не надсилає
    baseFileUrl: ""
}

export { API_CONF, CLIENT_CONF }