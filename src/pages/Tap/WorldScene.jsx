import "./WorldScene.scss"
import { useEffect, useRef, useState } from "react"
import { FLOOR, STOPS, loadWorld } from "./worldMap"

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

const CLOUDS = [{ top: 130, delay: "-18s", speed: "78s", scale: 1 }, { top: 205, delay: "-52s", speed: "120s", scale: .7 }, { top: 268, delay: "-66s", speed: "96s", scale: .85 }]

function Flames({ torches, stop }) {
    return torches.map(torch => <i key={`${torch.x}-${torch.y}`} className="World__flame" style={cell(torch.x, torch.y - stop)} />)
}

const BUTTERFLIES = [{ top: 408, color: "#f59e3a", delay: "-3s", speed: "19s" }, { top: 432, color: "#f4f1e8", delay: "-11s", speed: "27s" }, { top: 392, color: "#7fd4ff", delay: "-17s", speed: "23s" }]
const SPLASHES = [{ left: 482, delay: "0s" }, { left: 494, delay: "-.5s" }, { left: 505, delay: "-1s" }]
const POOL_BUBBLES = [{ left: 470, delay: "-1s" }, { left: 512, delay: "-2.4s" }, { left: 548, delay: "-3.7s" }]
const LAVA_BUBBLES = [{ left: 150, delay: "-.6s" }, { left: 262, delay: "-2.1s" }, { left: 372, delay: "-3.2s" }, { left: 500, delay: "-1.4s" }]

// Живі деталі кожної локації: малюються лише там, де стоїть камера
function SurfaceLife() {
    return <>
        <span className="World__sun" />
        {CLOUDS.map(cloud => <span key={cloud.top} className="World__cloud" style={{ top: cloud.top, animationDelay: cloud.delay, animationDuration: cloud.speed, scale: cloud.scale }} />)}
        {spots(3, 31, 12).map(spot => <i key={spot.left} className="World__bird" style={{ top: 170 + parseFloat(spot.left), animationDelay: spot.delay }} />)}
        {[...spots(4, 6, 16), ...spots(4, 6, 61)].map(spot => <i key={spot.left} className="World__leaf" style={{ left: spot.left, animationDelay: spot.delay, animationDuration: spot.duration }} />)}
        {BUTTERFLIES.map(fly => <i key={fly.top} className="World__butterfly" style={{ top: fly.top, color: fly.color, animationDelay: `${fly.delay}, 0s`, animationDuration: `${fly.speed}, .32s` }} />)}
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

function WorldScene({ depth, ready, label }) {
    const holder = useRef(null)
    const [torches, setTorches] = useState([])
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
        })
        return () => { cancelled = true }
    }, [])

    const stop = STOPS[depth]
    const torchesOf = index => torches.filter(torch => torch.y >= STOPS[index] && torch.y < (STOPS[index + 1] ?? Infinity))

    return (
        <div className={`World${depth ? " World--deep" : ""}`} aria-hidden="true">
            <div className="World__anchor">
                <div className="World__camera" style={{ transform: `translateY(${-(stop + FLOOR) * BLOCK_PX}px)`, transitionDuration: `${flight.ms}ms` }}>
                    <div className="World__sky" />
                    <div className="World__holder" ref={holder} />
                    {[...new Set([flight.from, depth])].map(index => {
                        const Life = LIFE[index]
                        return <div className="World__life" key={index} style={{ top: STOPS[index] * BLOCK_PX, animationDelay: index === depth ? `${flight.ms}ms` : "0ms" }}>
                            <Life torches={torchesOf(index)} />
                        </div>
                    })}
                </div>
            </div>
            {flying && <div className={`World__streaks${flight.from > depth ? " World__streaks--up" : ""}`}>
                {spots(11, 9, 4).map(spot => <i key={spot.left} style={{ left: spot.left, animationDelay: spot.delay, animationDuration: `${parseFloat(spot.duration) / 6}s` }} />)}
            </div>}
            <span className="World__place" key={`place-${depth}`} style={{ animationDelay: `${flight.ms * .7}ms` }}>{label}</span>
        </div>
    )
}

export default WorldScene
