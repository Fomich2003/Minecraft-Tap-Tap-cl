const mode = import.meta.env.MODE;

const CLIENT_CONF = {
    mode,
    serverUrl: mode === "production" ?
        `https://stump-facial-tannery.ngrok-free.dev` : "http://localhost:6788"
}

const API_CONF = {
    baseUrl: `${CLIENT_CONF.serverUrl}/api`,
    baseFileUrl: CLIENT_CONF.serverUrl
}

export { API_CONF, CLIENT_CONF }