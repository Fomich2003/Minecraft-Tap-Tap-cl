import "./WorldScene.scss"
import { useEffect, useRef, useState } from "react"
import { FLOOR, STOPS, SURFACE_ROWS, loadWorld } from "./worldMap"

// Одна клітинка карти на екрані: карта вдвічі більша за свої текстури
const BLOCK_PX = 32
const FLIGHT_BASE_MS = 2200
const FLIGHT_PER_LOCATION_MS = 3400

const spots = (count, step, shift = 0) => Array.from({ length: count }, (_, index) => ({
    left: `${(index * step + shift) % 100}%`,
    delay: `${-(index * 1.37) % 9}s`,
    duration: `${5 + (index * 2.3) % 6}s`,
}))

const cell = (column, row) => ({ left: column * BLOCK_PX, top: row * BLOCK_PX })

function Flames({ torches, stop }) {
    return torches.map(torch => <i key={`${torch.x}-${torch.y}`} className="World__flame" style={cell(torch.x, torch.y - stop)} />)
}

const BUTTERFLIES = [{ top: 408, color: "#f59e3a", delay: "-3s", speed: "19s" }, { top: 432, color: "#f4f1e8", delay: "-11s", speed: "27s" }, { top: 392, color: "#7fd4ff", delay: "-17s", speed: "23s" }]
const SPLASHES = [{ left: 482, delay: "0s" }, { left: 494, delay: "-.5s" }, { left: 505, delay: "-1s" }]
const POOL_BUBBLES = [{ left: 470, delay: "-1s" }, { left: 512, delay: "-2.4s" }, { left: 548, delay: "-3.7s" }]
const LAVA_BUBBLES = [{ left: 150, delay: "-.6s" }, { left: 262, delay: "-2.1s" }, { left: 372, delay: "-3.2s" }, { left: 500, delay: "-1.4s" }]

// Небо лежить вище карти: його нуль на 600 пікселів над першим рядком
const HEAVEN_TOP = 600
const HORIZON = HEAVEN_TOP + 395
const ZENITH = HEAVEN_TOP + 245
const ARC = { from: 150, to: 490 }
const STARS = Array.from({ length: 64 }, (_, index) => {
    const random = seed => {
        const value = Math.sin(index * 91.7 + seed * 47.3) * 43758.5453
        return value - Math.floor(value)
    }
    return { left: Math.round(random(1) * 640), top: Math.round(HEAVEN_TOP - 120 + random(2) * 470), size: random(3) > .82 ? 3 : 2, delay: `${-random(4) * 6}s` }
})
// Перша смуга далека: нижче, менша й повільніша, друга пливе ближче до камери
const CLOUD_LAYERS = [{ top: HEAVEN_TOP + 300, speed: 900, opacity: .72, scale: .55 }, { top: HEAVEN_TOP + 196, speed: 520, opacity: .95 }]

// Світило йде дугою: сходить ліворуч за пагорбами й сідає праворуч
function arcPosition(progress) {
    return { left: ARC.from + (ARC.to - ARC.from) * progress, top: HORIZON - (HORIZON - ZENITH) * Math.sin(Math.PI * progress) }
}

function Heavens({ sky, clouds, awake }) {
    const body = arcPosition(sky.progress)
    const glow = { left: sky.isDay ? body.left : sky.progress < .5 ? ARC.to : ARC.from }
    return (
        <div className={`World__sky${awake ? "" : " World__sky--asleep"}`}>
            <i className="World__sky-layer World__sky-layer--day" style={{ opacity: sky.daylight }} />
            <i className="World__sky-layer World__sky-layer--dusk" style={{ opacity: sky.dusk }} />
            <i className="World__sky-layer World__sky-layer--storm" style={{ opacity: sky.weather === "clear" ? 0 : .55 + sky.daylight * .3 }} />
            <i className="World__horizon-glow" style={{ left: glow.left, opacity: sky.dusk }} />
            <div className="World__stars" style={{ opacity: sky.stars }}>
                {STARS.map((star, index) => <i key={index} style={{ left: star.left, top: star.top, width: star.size, height: star.size, animationDelay: star.delay }} />)}
            </div>
            <span className={`World__celestial World__celestial--${sky.isDay ? "sun" : "moon"}`}
                style={{ transform: `translate(${body.left - 64}px, ${body.top - 64}px)`, backgroundImage: sky.isDay ? undefined : `url(/assets/world/moon_${sky.moon}.png)`, opacity: sky.weather === "clear" ? 1 : .35 }} />
            {clouds.map((strip, index) => {
                const layer = CLOUD_LAYERS[index]
                return <span key={index} className="World__clouds" style={{
                    top: layer.top, height: strip.height * (layer.scale ?? 1), opacity: layer.opacity,
                    "--cloud-width": `${strip.width * (layer.scale ?? 1)}px`, animationDuration: `${layer.speed}s`,
                }}>
                    <i style={{ backgroundColor: sky.cloud, maskImage: `url(${strip.url})`, WebkitMaskImage: `url(${strip.url})` }} />
                </span>
            })}
        </div>
    )
}

const FIREFLIES = Array.from({ length: 12 }, (_, index) => ({ left: 90 + (index * 47) % 470, top: 360 + (index * 37) % 110, delay: `${-(index * 1.9) % 7}s`, speed: `${6 + (index * 1.3) % 5}s` }))

// Живі деталі кожної локації: малюються лише там, де стоїть камера
function SurfaceLife({ sky }) {
    const calm = sky.weather === "clear"
    const day = calm ? sky.daylight : 0
    return <>
        <div className="World__daylife" style={{ opacity: day }}>
            {spots(3, 31, 12).map(spot => <i key={spot.left} className="World__bird" style={{ top: 170 + parseFloat(spot.left), animationDelay: spot.delay }} />)}
            {BUTTERFLIES.map(fly => <i key={fly.top} className="World__butterfly" style={{ top: fly.top, color: fly.color, animationDelay: `${fly.delay}, 0s`, animationDuration: `${fly.speed}, .32s` }} />)}
        </div>
        <div className="World__daylife" style={{ opacity: .3 + sky.daylight * .7 }}>
            {[...spots(4, 6, 16), ...spots(4, 6, 61)].map(spot => <i key={spot.left} className="World__leaf" style={{ left: spot.left, animationDelay: spot.delay, animationDuration: spot.duration }} />)}
        </div>
        <div className="World__nightlife" style={{ opacity: calm ? 1 - sky.daylight : 0 }}>
            {FIREFLIES.map((fly, index) => <i key={index} className="World__firefly" style={{ left: fly.left, top: fly.top, animationDelay: `${fly.delay}, ${fly.delay}`, animationDuration: `${fly.speed}, 2.4s` }} />)}
        </div>
        {!calm && <div className={`World__weather World__weather--${sky.weather}`}><i /></div>}
    </>
}

function CavesLife({ torches }) {
    const stop = STOPS[1]
    return <>
        <i className="World__fall World__fall--water" style={{ ...cell(15, 7), height: 8 * BLOCK_PX }} />
        <Flames torches={torches} stop={stop} />
        {torches.map((torch, index) => <i key={torch.x} className="World__smoke" style={{ left: torch.x * BLOCK_PX + 14, top: (torch.y - stop) * BLOCK_PX - 2, animationDelay: `${-index * .9}s` }} />)}
        {spots(6, 13, 34).map(spot => <i key={spot.left} className="World__drip" style={{ left: spot.left, animationDelay: spot.delay, animationDuration: spot.duration }} />)}
        {spots(10, 6, 22).map((spot, index) => <i key={spot.left} className="World__mote" style={{ left: spot.left, top: 220 + index * 21, animationDelay: spot.delay, animationDuration: spot.duration }} />)}
        {SPLASHES.map(drop => <i key={drop.left} className="World__splash" style={{ left: drop.left, animationDelay: drop.delay }} />)}
        <i className="World__ripple" style={{ left: 462 }} />
        <i className="World__ripple" style={{ left: 500, animationDelay: "-1.3s" }} />
        <i className="World__bat" style={{ top: 225 }} />
        <i className="World__bat World__bat--far" style={{ top: 330 }} />
    </>
}

function DepthsLife({ torches }) {
    return <>
        <i className="World__lava" style={{ ...cell(14, FLOOR), width: 5 * BLOCK_PX, height: 2 * BLOCK_PX }} />
        <Flames torches={torches} stop={STOPS[2]} />
        {spots(12, 8, 22).map((spot, index) => <i key={spot.left} className="World__spark" style={{ left: spot.left, top: 170 + index * 26, animationDelay: spot.delay }} />)}
        <i className="World__pulse" style={{ left: "28%", top: 420 }} />
        <i className="World__pulse" style={{ left: "48%", top: 430, animationDelay: "-1.6s" }} />
        <i className="World__charge" />
        <i className="World__charge" style={{ animationDelay: "-2.6s" }} />
        {spots(7, 9, 22).map(spot => <i key={spot.left} className="World__soul" style={{ left: spot.left, animationDelay: spot.delay, animationDuration: spot.duration }} />)}
        {POOL_BUBBLES.map(bubble => <i key={bubble.left} className="World__bubble" style={{ left: bubble.left, top: 472, animationDelay: bubble.delay }} />)}
    </>
}

const LAVA_SPANS = [[0, 6], [7, 6], [14, 6]]

function NetherLife() {
    return <>
        <i className="World__glow" />
        <i className="World__ghast"><span /></i>
        <i className="World__ghast World__ghast--far"><span /></i>
        <i className="World__fall World__fall--lava" style={{ ...cell(4, 7), height: 9 * BLOCK_PX }} />
        <i className="World__fall World__fall--lava" style={{ ...cell(15, 8), height: 8 * BLOCK_PX }} />
        {LAVA_SPANS.map(([column, width]) => <i key={column} className="World__lava" style={{ ...cell(column, FLOOR + 1), width: width * BLOCK_PX, height: 9 * BLOCK_PX }} />)}
        {LAVA_BUBBLES.map(bubble => <i key={bubble.left} className="World__bubble" style={{ left: bubble.left, top: 520, animationDelay: bubble.delay }} />)}
        {spots(14, 7.5, 12).map(spot => <i key={spot.left} className="World__ember" style={{ left: spot.left, animationDelay: spot.delay, animationDuration: spot.duration }} />)}
        {spots(10, 8, 18).map(spot => <i key={spot.left} className="World__ash" style={{ left: spot.left, animationDelay: spot.delay, animationDuration: spot.duration }} />)}
    </>
}

function EndLife() {
    return <>
        <i className="World__nebula" />
        <i className="World__nebula World__nebula--far" />
        {spots(18, 5.6, 8).map((spot, index) => <i key={spot.left} className="World__star" style={{ left: spot.left, top: 90 + (index * 47) % 340, animationDelay: spot.delay }} />)}
        <i className="World__comet" />
        <i className="World__comet World__comet--late" />
        <i className="World__beam" style={{ left: 144, top: 176, width: 215, rotate: "35deg" }} />
        <i className="World__beam" style={{ left: 496, top: 240, width: 186, rotate: "161deg", animationDelay: "-1.1s" }} />
        <i className="World__crystal" style={cell(4, 5)} />
        <i className="World__crystal" style={{ ...cell(15, 7), animationDelay: "-1.4s" }} />
        {spots(10, 7, 16).map(spot => <i key={spot.left} className="World__portal" style={{ left: spot.left, animationDelay: spot.delay, animationDuration: spot.duration }} />)}
    </>
}

const LIFE = [SurfaceLife, CavesLife, DepthsLife, NetherLife, EndLife]

function WorldScene({ depth, ready, label, sky, skyLabel }) {
    const holder = useRef(null)
    const [torches, setTorches] = useState([])
    const [art, setArt] = useState({ mask: null, clouds: [] })
    const [flight, setFlight] = useState({ depth, ready, from: depth, ms: 0 })

    // Тривалість залежить від відстані: перехід через весь світ має бути справжнім спуском
    if (flight.depth !== depth || flight.ready !== ready) {
        const distance = flight.ready ? Math.abs(depth - flight.depth) : 0
        setFlight({ depth, ready, from: distance ? flight.depth : depth, ms: distance ? FLIGHT_BASE_MS + distance * FLIGHT_PER_LOCATION_MS : 0 })
    }

    // Локація, з якої вилетіли, живе до прильоту: лава не завмирає просто в кадрі
    const flying = flight.from !== flight.depth
    useEffect(() => {
        if (!flying) return
        const timer = setTimeout(() => setFlight(current => ({ ...current, from: current.depth })), flight.ms)
        return () => clearTimeout(timer)
    }, [flying, flight.ms])

    useEffect(() => {
        let cancelled = false
        loadWorld().then(world => {
            if (cancelled || !holder.current) return
            holder.current.replaceChildren(world.canvas)
            setTorches(world.torches)
            setArt({ mask: world.mask, clouds: world.clouds })
        })
        return () => { cancelled = true }
    }, [])

    const stop = STOPS[depth]
    const torchesOf = index => torches.filter(torch => torch.y >= STOPS[index] && torch.y < (STOPS[index + 1] ?? Infinity))
    const onSurface = depth === 0 || flight.from === 0

    return (
        <div className={`World${depth ? " World--deep" : ""}`} aria-hidden="true">
            <div className="World__anchor">
                <div className="World__camera" style={{ transform: `translateY(${-(stop + FLOOR) * BLOCK_PX}px)`, transitionDuration: `${flight.ms}ms` }}>
                    <Heavens sky={sky} clouds={art.clouds} awake={onSurface} />
                    <div className="World__holder" ref={holder} />
                    {art.mask && <i className="World__shade" style={{ height: SURFACE_ROWS * BLOCK_PX, opacity: sky.shade, maskImage: `url(${art.mask}), linear-gradient(#000 62%, transparent)`, WebkitMaskImage: `url(${art.mask}), linear-gradient(#000 62%, transparent)` }} />}
                    {[...new Set([flight.from, depth])].map(index => {
                        const Life = LIFE[index]
                        return <div className="World__life" key={index} style={{ top: STOPS[index] * BLOCK_PX, animationDelay: index === depth ? `${flight.ms}ms` : "0ms" }}>
                            <Life torches={torchesOf(index)} sky={sky} />
                        </div>
                    })}
                </div>
            </div>
            {flying && <div className={`World__streaks${flight.from > depth ? " World__streaks--up" : ""}`}>
                {spots(11, 9, 4).map(spot => <i key={spot.left} style={{ left: spot.left, animationDelay: spot.delay, animationDuration: `${parseFloat(spot.duration) / 6}s` }} />)}
            </div>}
            <span className="World__place" key={`place-${depth}`} style={{ animationDelay: `${flight.ms * .7}ms` }}>
                {label}
                {depth === 0 && skyLabel && <small>{skyLabel}</small>}
            </span>
        </div>
    )
}

export default WorldScene
