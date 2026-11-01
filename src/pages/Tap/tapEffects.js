// Ефекти тапа живуть поза React: при 10 тапах за секунду стан не має перемальовувати сторінку
const MAX_NODES = 60

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

function addNode(layer, className, x, y) {
    const node = document.createElement("span")
    node.className = className
    node.style.left = `${x}px`
    node.style.top = `${y}px`
    layer.append(node)
    return node
}

const removeAfter = (animation, node) => {
    animation.onfinish = () => node.remove()
    animation.oncancel = () => node.remove()
}

function showTapNumber(layer, x, y, value) {
    if (layer.childElementCount >= MAX_NODES) return
    const node = addNode(layer, "Tap__number", x, y)
    node.textContent = `+${value}`
    const drift = (Math.random() - 0.5) * 70
    removeAfter(node.animate([
        { opacity: 0, transform: "translate(-50%, -30%) scale(.6)" },
        { opacity: 1, transform: "translate(-50%, -80%) scale(1.15)", offset: .18 },
        { opacity: 0, transform: `translate(calc(-50% + ${drift}px), -240%) scale(.9)` },
    ], { duration: reducedMotion() ? 300 : 760, easing: "cubic-bezier(.16,.7,.25,1)" }), node)
}

// Осколки беруть вигляд із текстури самого блока
function burstChips(layer, x, y, iconUrl, count) {
    if (reducedMotion()) return
    const allowed = Math.min(count, MAX_NODES - layer.childElementCount)

    for (let index = 0; index < allowed; index += 1) {
        const node = addNode(layer, "Tap__chip", x, y)
        node.style.backgroundImage = `url("${iconUrl}")`
        node.style.backgroundPosition = `${Math.random() * 100}% ${Math.random() * 100}%`

        const angle = Math.random() * Math.PI * 2
        const reach = 36 + Math.random() * 64
        const dx = Math.cos(angle) * reach
        const dy = Math.sin(angle) * reach
        removeAfter(node.animate([
            { opacity: 1, transform: "translate(-50%, -50%) rotate(0deg)" },
            { opacity: 1, transform: `translate(calc(-50% + ${dx * .7}px), calc(-50% + ${dy * .7 - 26}px)) rotate(${dx * 2}deg)`, offset: .45 },
            { opacity: 0, transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + 90}px)) rotate(${dx * 4}deg)` },
        ], { duration: 520 + Math.random() * 180, easing: "cubic-bezier(.3,.5,.6,1)" }), node)
    }
}

// Часточки кольору активних ефектів, як завитки зілля навколо персонажа
function burstEffects(layer, x, y, colors) {
    if (reducedMotion()) return
    for (const color of colors) {
        if (!color || layer.childElementCount >= MAX_NODES) continue
        const node = addNode(layer, "Tap__spark", x + (Math.random() - 0.5) * 60, y + (Math.random() - 0.5) * 30)
        node.style.backgroundColor = color
        const dx = (Math.random() - 0.5) * 40
        const dy = -50 - Math.random() * 60
        removeAfter(node.animate([
            { opacity: 1, transform: "translate(-50%, -50%) scale(1)" },
            { opacity: 0, transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.4)` },
        ], { duration: 620 + Math.random() * 260, easing: "ease-out" }), node)
    }
}

const SWING = [
    { opacity: 1, transform: "translate(-20%, -90%) rotate(-55deg)" },
    { opacity: 1, transform: "translate(-40%, -60%) rotate(25deg)", offset: .55 },
    { opacity: 0, transform: "translate(-40%, -60%) rotate(35deg)" },
]

// Лише один замах за раз: при швидких тапах черга іконок виглядала б як шум
let lastSwing = null

function swingTool(layer, x, y, iconUrl) {
    if (reducedMotion()) return
    lastSwing?.cancel()
    const node = addNode(layer, "Tap__swing", x, y)
    node.style.backgroundImage = `url("${iconUrl}")`
    lastSwing = node.animate(SWING, { duration: 170, easing: "steps(4)" })
    removeAfter(lastSwing, node)
}

const PUNCH = [
    { transform: "translateY(0) scale(1)" },
    { transform: "translateY(5px) scale(.92, .9)" },
    { transform: "translateY(-3px) scale(1.04)" },
    { transform: "translateY(0) scale(1)" },
]

const BREAK = [
    { transform: "scale(1) rotate(0)" },
    { transform: "scale(.82) rotate(-5deg)" },
    { transform: "scale(1.12) rotate(4deg)" },
    { transform: "scale(1) rotate(0)" },
]

const hurtFrames = [
    { filter: "none" },
    { filter: "brightness(.75) sepia(1) saturate(7) hue-rotate(-45deg)", offset: .3 },
    { filter: "none" },
]

// Червоний спалах удару, як у моба в оригіналі
function hurtMob(node) {
    if (reducedMotion()) return
    node.querySelector("img")?.animate(hurtFrames, { duration: 180, easing: "steps(3)" })
}

// Останні тріщини спалахують при кожному зламі. Сильний інструмент ламає блок одним тапом,
// і без цього гравець взагалі не бачив би, що блок розколовся.
function shatterBlock(node) {
    if (reducedMotion()) return
    const cracks = document.createElement("span")
    cracks.className = "Tap__cracks"
    cracks.style.setProperty("--crack-y", "100%")
    cracks.append(...Array.from({ length: 3 }, () => document.createElement("i")))
    node.append(cracks)
    removeAfter(cracks.animate([{ opacity: 1 }, { opacity: 1, offset: .45 }, { opacity: 0 }], { duration: 280, easing: "steps(5)" }), cracks)
}

let lastPunch = null

function punchBlock(node, broke) {
    if (reducedMotion()) return
    lastPunch?.cancel()
    lastPunch = node.animate(broke ? BREAK : PUNCH, { duration: broke ? 240 : 130, easing: "steps(5)" })
}

export { showTapNumber, burstChips, burstEffects, swingTool, punchBlock, shatterBlock, hurtMob }
