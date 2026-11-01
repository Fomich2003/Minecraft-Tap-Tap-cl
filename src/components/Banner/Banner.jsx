import "./Banner.scss"
import { useEffect, useRef } from "react"

const WIDTH = 20
const HEIGHT = 40

// Кольори фарб з оригіналу. Банер малюється шарами, тому це єдине місце, що знає їхні значення
const DYE_COLORS = {
    white: "#f9fffe", orange: "#f9801d", magenta: "#c74ebd", light_blue: "#3ab3da", yellow: "#fed83d", lime: "#80c71f",
    pink: "#f38baa", gray: "#474f52", light_gray: "#9d9d97", cyan: "#169c9c", purple: "#8932b8", blue: "#3c44aa",
    brown: "#835432", green: "#5e7c16", red: "#b02e26", black: "#1d1d21",
}

const masks = new Map()

function loadMask(id) {
    if (!masks.has(id)) {
        const image = new Image()
        image.src = `/assets/banners/${id}.png`
        masks.set(id, image.decode().then(() => image))
    }
    return masks.get(id)
}

// Кожен візерунок це маска: колір фарби проступає лише крізь її непрозорі пікселі
async function paint(canvas, base, layers) {
    const loaded = await Promise.all(layers.map(layer => loadMask(layer.pattern).catch(() => null)))
    const context = canvas.getContext("2d")
    context.fillStyle = DYE_COLORS[base] ?? DYE_COLORS.white
    context.fillRect(0, 0, WIDTH, HEIGHT)

    const buffer = document.createElement("canvas")
    buffer.width = WIDTH
    buffer.height = HEIGHT
    const layerContext = buffer.getContext("2d")
    layers.forEach((layer, index) => {
        if (!loaded[index]) return
        layerContext.globalCompositeOperation = "source-over"
        layerContext.clearRect(0, 0, WIDTH, HEIGHT)
        layerContext.fillStyle = DYE_COLORS[layer.color] ?? DYE_COLORS.white
        layerContext.fillRect(0, 0, WIDTH, HEIGHT)
        layerContext.globalCompositeOperation = "destination-in"
        layerContext.drawImage(loaded[index], 0, 0)
        context.drawImage(buffer, 0, 0)
    })
}

function Banner({ base, layers = [], className = "" }) {
    const canvas = useRef(null)
    const signature = JSON.stringify([base, layers])

    useEffect(() => {
        if (canvas.current) paint(canvas.current, base, layers)
        // eslint-disable-next-line react-hooks/exhaustive-deps -- масив шарів новий на кожен рендер, порівнюється його вміст
    }, [signature])

    return <canvas className={`Banner ${className}`} ref={canvas} width={WIDTH} height={HEIGHT} aria-hidden="true" />
}

export default Banner
