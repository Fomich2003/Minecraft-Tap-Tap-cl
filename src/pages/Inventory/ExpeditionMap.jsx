import { useEffect, useMemo, useRef } from "react"

// Мапа походу в стилі мап гри: пергамент, рельєф кольорами мап Minecraft із трьома відтінками схилу,
// пунктир маршруту, маркер розвідника й червоний хрестик скарбу. Масштаб показує більшу ділянку світу
const SIZE = 128
const INNER = { from: 10, to: 118 }

// Кольори мап гри для кожної локації: [поріг висоти, колір]
const PALETTES = {
    surface: [[.3, [64, 64, 255]], [.36, [247, 233, 163]], [.62, [127, 178, 56]], [.8, [0, 124, 0]], [1, [112, 112, 112]]],
    caves: [[.22, [64, 64, 255]], [.5, [112, 112, 112]], [.66, [151, 109, 77]], [.84, [100, 100, 100]], [1, [135, 107, 98]]],
    depths: [[.2, [255, 0, 0]], [.46, [100, 100, 100]], [.62, [13, 18, 23]], [.8, [127, 63, 178]], [1, [87, 87, 87]]],
    nether: [[.3, [255, 90, 0]], [.55, [112, 2, 0]], [.68, [102, 76, 51]], [.84, [189, 48, 49]], [1, [22, 126, 134]]],
    end: [[.34, [21, 8, 32]], [.7, [219, 211, 160]], [.86, [167, 123, 167]], [1, [25, 25, 25]]],
}
const SHADES = [180 / 255, 220 / 255, 1]

function random(seed) {
    let state = seed >>> 0 || 1
    return () => {
        state = (state * 1664525 + 1013904223) >>> 0
        return state / 4294967296
    }
}

function valueNoise(seed) {
    const grid = new Map()
    const at = (x, y) => {
        const key = x * 7919 + y
        if (!grid.has(key)) {
            const value = Math.sin(x * 127.1 + y * 311.7 + seed * .001) * 43758.5453
            grid.set(key, value - Math.floor(value))
        }
        return grid.get(key)
    }
    const smooth = (x, y) => {
        const left = Math.floor(x)
        const top = Math.floor(y)
        const dx = x - left
        const dy = y - top
        const ease = value => value * value * (3 - 2 * value)
        const blend = (from, to, amount) => from + (to - from) * ease(amount)
        return blend(blend(at(left, top), at(left + 1, top), dx), blend(at(left, top + 1), at(left + 1, top + 1), dx), dy)
    }
    return (x, y) => smooth(x, y) * .6 + smooth(x * 2.1, y * 2.1) * .3 + smooth(x * 4.3, y * 4.3) * .1
}

function paintTerrain(context, location, seed, scale) {
    const palette = PALETTES[location] ?? PALETTES.surface
    const noise = valueNoise(seed)
    const zoom = 14 / (1 + scale * .45)
    const image = context.createImageData(SIZE, SIZE)
    const height = (x, y) => noise(x / zoom, y / zoom)
    for (let y = 0; y < SIZE; y += 1) {
        for (let x = 0; x < SIZE; x += 1) {
            const offset = (y * SIZE + x) * 4
            if (x < INNER.from || x >= INNER.to || y < INNER.from || y >= INNER.to) continue
            const value = height(x, y)
            const color = palette.find(([limit]) => value <= limit)[1]
            // Як на мапі гри: північний схил світліший, південний темніший
            const slope = value - height(x, y - 1)
            const shade = SHADES[slope > .004 ? 2 : slope < -.004 ? 0 : 1]
            image.data[offset] = color[0] * shade
            image.data[offset + 1] = color[1] * shade
            image.data[offset + 2] = color[2] * shade
            image.data[offset + 3] = 255
        }
    }
    return image
}

// Маршрут від табору до хрестика через кілька поворотів
function routeOf(seed) {
    const next = random(seed)
    const points = [{ x: 22 + next() * 12, y: 92 + next() * 14 }]
    for (let step = 1; step < 5; step += 1) {
        points.push({ x: 22 + step * 18 + (next() - .5) * 14, y: 92 - step * 13 + (next() - .5) * 26 })
    }
    points.push({ x: 98 + next() * 8, y: 22 + next() * 12 })
    const lengths = points.slice(1).map((point, index) => Math.hypot(point.x - points[index].x, point.y - points[index].y))
    return { points, lengths, total: lengths.reduce((sum, length) => sum + length, 0) }
}

function pointAt(route, progress) {
    let left = route.total * progress
    for (let index = 0; index < route.lengths.length; index += 1) {
        if (left <= route.lengths[index]) {
            const from = route.points[index]
            const to = route.points[index + 1]
            const amount = left / route.lengths[index]
            return { x: from.x + (to.x - from.x) * amount, y: from.y + (to.y - from.y) * amount, angle: Math.atan2(to.y - from.y, to.x - from.x) }
        }
        left -= route.lengths[index]
    }
    const last = route.points.at(-1)
    return { ...last, angle: 0 }
}

// Пунктир із темною облямівкою: його видно і на світлій траві, і на темному сланці
function dots(context, route, from, to, color) {
    for (let step = from; step <= to; step += 4 / route.total) {
        const point = pointAt(route, Math.min(1, step))
        const x = Math.round(point.x) - 1
        const y = Math.round(point.y) - 1
        context.fillStyle = "rgb(30 18 6 / 85%)"
        context.fillRect(x - 1, y - 1, 4, 4)
        context.fillStyle = color
        context.fillRect(x, y, 2, 2)
    }
}

const loadImage = src => new Promise(resolve => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = src
})
const ART = Promise.all(["/assets/map/background.png", "/assets/map/player.png", "/assets/map/red_x.png"].map(loadImage))

function ExpeditionMap({ location, seed, scale, progress }) {
    const canvas = useRef(null)
    const terrain = useRef(null)
    const route = useMemo(() => routeOf(seed), [seed])
    const marker = pointAt(route, progress)

    useEffect(() => {
        terrain.current = null
    }, [location, seed, scale])

    useEffect(() => {
        let cancelled = false
        ART.then(([background, , cross]) => {
            const context = canvas.current?.getContext("2d")
            if (cancelled || !context) return
            context.imageSmoothingEnabled = false
            context.clearRect(0, 0, SIZE, SIZE)
            if (background) context.drawImage(background, 0, 0, SIZE, SIZE)
            terrain.current ??= paintTerrain(context, location, seed, scale)
            const layer = document.createElement("canvas")
            layer.width = SIZE
            layer.height = SIZE
            layer.getContext("2d").putImageData(terrain.current, 0, 0)
            context.drawImage(layer, 0, 0)
            dots(context, route, progress, 1, "#b8a27a")
            dots(context, route, 0, progress, "#fff6d8")
            const end = route.points.at(-1)
            if (cross) context.drawImage(cross, Math.round(end.x) - 4, Math.round(end.y) - 4, 8, 8)
        })
        return () => { cancelled = true }
    }, [location, seed, scale, progress, route])

    return (
        <div className="Expedition__map">
            <canvas ref={canvas} width={SIZE} height={SIZE} />
            <img className="Expedition__marker" src="/assets/map/player.png" alt=""
                style={{ left: `${marker.x / SIZE * 100}%`, top: `${marker.y / SIZE * 100}%`, rotate: `${marker.angle + Math.PI / 2}rad` }} />
        </div>
    )
}

export default ExpeditionMap
