// Частинки гри на одному canvas поверх екрана: осколки, крити, дроп, монети й сфери досвіду. При 10 тапах за секунду DOM-вузли на кожен осколок
// давали б сотні елементів; тут один кадр малює все, а цикл зупиняється, щойно частинок не лишилось.
// Координати — у пікселях вікна (clientX/clientY), тому предмет може долетіти до кнопки інвентаря внизу.

const MAX_PARTICLES = 320
const MAX_DPR = 2
const GRAVITY = 1500
const SOURCE_TEXELS = 16

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

// Текстура для осколків: які пікселі іконки непрозорі, щоб осколок не вийшов порожнім
const textures = new Map()

function loadTexture(url) {
    if (!url) return null
    let texture = textures.get(url)
    if (texture) return texture
    texture = { image: new Image(), ready: false, opaque: [] }
    textures.set(url, texture)
    texture.image.decoding = "async"
    texture.image.onload = () => {
        try {
            const { naturalWidth: width, naturalHeight: height } = texture.image
            const probe = document.createElement("canvas")
            probe.width = width
            probe.height = height
            const context = probe.getContext("2d", { willReadFrequently: true })
            context.drawImage(texture.image, 0, 0)
            const { data } = context.getImageData(0, 0, width, height)
            const step = Math.max(1, Math.floor(width / 32))
            for (let y = 0; y < height; y += step) {
                for (let x = 0; x < width; x += step) {
                    if (data[(y * width + x) * 4 + 3] > 220) texture.opaque.push(x, y)
                }
            }
        } catch {
            // Без пікселів осколки беруть випадкову частину іконки
        }
        texture.ready = true
    }
    texture.image.src = url
    return texture
}

const random = (min, max) => min + Math.random() * (max - min)

const ORB_COLORS = ["#d8ff3a", "#b6f23a", "#f2ff62"]

const CRIT_COLORS = ["#ffffff", "#f0f0f0", "#d6d6d6", "#bdbdbd"]
const MAGIC_COLORS = ["#7ef7ff", "#4fd6e8", "#a6fff4", "#38b8d0"]

function createEngine() {
    let canvas = null
    let context = null
    let width = 0
    let height = 0
    let dpr = 1
    let frame = 0
    let last = 0
    const particles = []

    // Canvas створюється при першій частинці і лишається: прозорий і без циклу він нічого не коштує
    const ensureCanvas = () => {
        if (canvas) return true
        if (typeof document === "undefined") return false
        canvas = document.createElement("canvas")
        canvas.className = "mc-particles"
        canvas.setAttribute("aria-hidden", "true")
        document.body.append(canvas)
        context = canvas.getContext("2d")
        resize()
        window.addEventListener("resize", resize)
        return true
    }

    const resize = () => {
        if (!canvas) return
        dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1)
        width = window.innerWidth
        height = window.innerHeight
        canvas.width = Math.round(width * dpr)
        canvas.height = Math.round(height * dpr)
    }

    const push = particle => {
        if (!ensureCanvas()) return
        if (particles.length >= MAX_PARTICLES) particles.shift()
        particles.push(particle)
        if (!frame) {
            last = performance.now()
            frame = requestAnimationFrame(tick)
        }
    }

    function drawDebris(particle) {
        const { texture, size } = particle
        const fade = Math.min(1, particle.life / 0.18)
        const drawn = size * (0.55 + 0.45 * fade)
        if (texture?.ready && texture.image.naturalWidth) {
            context.drawImage(texture.image, particle.sx, particle.sy, particle.sw, particle.sw, particle.x - drawn / 2, particle.y - drawn / 2, drawn, drawn)
        } else {
            context.fillStyle = "#7d7d7d"
            context.fillRect(particle.x - drawn / 2, particle.y - drawn / 2, drawn, drawn)
        }
        // Нижня тінь робить осколок об'ємним, як частинка в оригіналі
        context.fillStyle = "rgba(0,0,0,.28)"
        context.fillRect(particle.x - drawn / 2, particle.y + drawn / 2 - Math.max(1, drawn / 5), drawn, Math.max(1, drawn / 5))
    }

    // Зірочка криту: піксельний хрест 3×3 з яскравим центром
    function drawCrit(particle) {
        const unit = particle.size * Math.min(1, particle.life / 0.25 + 0.2)
        const x = Math.round(particle.x)
        const y = Math.round(particle.y)
        context.globalAlpha = Math.min(1, particle.life / 0.2)
        context.fillStyle = "rgba(40,40,40,.55)"
        context.fillRect(x - unit * 1.5 - 1, y - unit / 2 - 1, unit * 3 + 2, unit + 2)
        context.fillRect(x - unit / 2 - 1, y - unit * 1.5 - 1, unit + 2, unit * 3 + 2)
        context.fillStyle = particle.color
        context.fillRect(x - unit * 1.5, y - unit / 2, unit * 3, unit)
        context.fillRect(x - unit / 2, y - unit * 1.5, unit, unit * 3)
        context.globalAlpha = 1
    }

    // Предмет вилітає з блока, падає, гойдається на місці й летить до інвентаря
    function drawItem(particle) {
        const { texture, age } = particle
        if (!texture?.ready || !texture.image.naturalWidth) return
        let x = particle.x
        let y = particle.y
        let scale = 1
        if (particle.phase === "collect") {
            const progress = Math.min(1, (age - particle.collectAt) / particle.collectTime)
            const eased = progress * progress * (3 - 2 * progress)
            x = particle.fromX + (particle.toX - particle.fromX) * eased
            // Дуга вгору: предмет підстрибує перед тим, як його «підбирають»
            y = particle.fromY + (particle.toY - particle.fromY) * eased - Math.sin(progress * Math.PI) * 60
            scale = 1 - 0.45 * eased
        } else if (particle.phase === "hover") {
            y += Math.sin((age - particle.landedAt) * 5) * 3 - 3
        }
        // Плаский спрайт обертається навколо вертикальної осі, як предмет на землі в оригіналі
        const spin = Math.cos(age * 2.4 + particle.spinOffset)
        const sx = Math.max(0.4, Math.abs(spin)) * scale
        const size = particle.size * scale
        context.save()
        context.translate(Math.round(x), Math.round(y))
        context.fillStyle = "rgba(0,0,0,.25)"
        if (particle.phase !== "collect") context.fillRect(-size * 0.32, particle.groundY - y + 2, size * 0.64, 3)
        context.scale(sx / scale, 1)
        // Тверда тінь без розмиття відділяє предмет від текстури блока за ним
        context.shadowColor = "rgba(0,0,0,.65)"
        context.shadowOffsetX = 3
        context.shadowOffsetY = 3
        context.drawImage(texture.image, -size / 2, -size / 2, size, size)
        context.restore()
    }

    // Монета крутиться навколо вертикальної осі: ширина змінюється, висота стала
    function drawCoin(particle) {
        const size = particle.size
        const width = Math.max(2, size * Math.abs(Math.cos(particle.age * 9 + particle.spinOffset)))
        const x = Math.round(particle.x - width / 2)
        const y = Math.round(particle.y - size / 2)
        context.fillStyle = "#5a3d00"
        context.fillRect(x - 1, y + 2, width + 2, size - 4)
        context.fillRect(x + 1, y - 1, Math.max(1, width - 2), size + 2)
        context.fillStyle = "#f7c531"
        context.fillRect(x, y + 1, width, size - 2)
        context.fillStyle = "#fff2a0"
        if (width > 4) context.fillRect(x + 1, y + 2, Math.max(1, width / 3), Math.max(2, size / 3))
    }

    // Сфера досвіду: пульсує між лаймовим і жовтим, як в оригіналі
    function drawOrb(particle) {
        const size = particle.size
        const x = Math.round(particle.x - size / 2)
        const y = Math.round(particle.y - size / 2)
        const unit = Math.max(1, Math.round(size / 4))
        context.fillStyle = "#2f5d00"
        context.fillRect(x + unit, y - 1, size - unit * 2, size + 2)
        context.fillRect(x - 1, y + unit, size + 2, size - unit * 2)
        context.fillStyle = ORB_COLORS[Math.floor(particle.age * 10 + particle.spinOffset) % ORB_COLORS.length]
        context.fillRect(x + unit, y, size - unit * 2, size)
        context.fillRect(x, y + unit, size, size - unit * 2)
        context.fillStyle = "rgba(255,255,255,.85)"
        context.fillRect(x + unit, y + unit, unit, unit)
    }

    // Розліт у боки, потім політ до цілі з прискоренням, як сфери досвіду до гравця
    function stepHoming(particle, dt) {
        if (particle.age < particle.burst) {
            const drag = Math.pow(0.02, dt)
            particle.vx *= drag
            particle.vy = particle.vy * drag + 300 * dt
            particle.x += particle.vx * dt
            particle.y += particle.vy * dt
            return true
        }
        const target = particle.target?.()
        if (!target) return false
        const pull = Math.min(1, dt * (5 + (particle.age - particle.burst) * 26))
        particle.x += (target.x - particle.x) * pull
        particle.y += (target.y - particle.y) * pull
        if (Math.hypot(target.x - particle.x, target.y - particle.y) < 10 || particle.age > particle.burst + 1.6) {
            particle.onArrive?.()
            return false
        }
        return true
    }

    function step(particle, dt) {
        particle.age += dt
        // Предмети з однієї пачки вилітають по черзі: до свого часу предмет не існує
        if (particle.age < 0) return true
        particle.life -= dt
        if (particle.kind === "item") return stepItem(particle, dt)
        if (particle.kind === "coin" || particle.kind === "orb") return stepHoming(particle, dt)
        if (particle.kind === "crit") {
            const drag = Math.pow(0.04, dt)
            particle.vx *= drag
            particle.vy = particle.vy * drag + 120 * dt
        } else {
            particle.vy += GRAVITY * dt
        }
        particle.x += particle.vx * dt
        particle.y += particle.vy * dt
        if (particle.kind === "debris" && particle.y > particle.groundY) {
            particle.y = particle.groundY
            particle.vy *= -0.28
            particle.vx *= 0.55
        }
        return particle.life > 0
    }

    function stepItem(particle, dt) {
        if (particle.phase === "pop") {
            particle.vy += GRAVITY * 0.9 * dt
            particle.x += particle.vx * dt
            particle.y += particle.vy * dt
            if (particle.y >= particle.groundY && particle.vy > 0) {
                particle.y = particle.groundY
                if (Math.abs(particle.vy) > 260) {
                    particle.vy *= -0.32
                    particle.vx *= 0.5
                } else {
                    particle.phase = "hover"
                    particle.landedAt = particle.age
                }
            }
        }
        if (particle.phase !== "collect" && particle.age >= particle.collectAt) {
            const target = particle.target?.()
            if (!target) return false
            particle.phase = "collect"
            particle.fromX = particle.x
            particle.fromY = particle.y
            particle.toX = target.x
            particle.toY = target.y
        }
        if (particle.phase === "collect" && particle.age - particle.collectAt >= particle.collectTime) {
            particle.onArrive?.()
            return false
        }
        return true
    }

    function tick(now) {
        const dt = Math.min(0.05, (now - last) / 1000)
        last = now
        context.setTransform(dpr, 0, 0, dpr, 0, 0)
        context.clearRect(0, 0, width, height)
        context.imageSmoothingEnabled = false

        let alive = 0
        for (const particle of particles) {
            if (!step(particle, dt)) continue
            particles[alive] = particle
            alive += 1
            if (particle.age < 0) continue
            if (particle.kind === "debris") drawDebris(particle)
            else if (particle.kind === "crit") drawCrit(particle)
            else if (particle.kind === "coin") drawCoin(particle)
            else if (particle.kind === "orb") drawOrb(particle)
            else drawItem(particle)
        }
        particles.length = alive
        frame = alive ? requestAnimationFrame(tick) : 0
        if (!alive) context.clearRect(0, 0, width, height)
    }

    return {
        clear() {
            particles.length = 0
            if (context) context.clearRect(0, 0, width, height)
        },
        preload: loadTexture,

        // Нагорода: монети летять у баланс, сфери досвіду — до профілю. Кількість частинок лише символічна
        reward(x, y, { coins = 0, xp = 0, coinTarget, xpTarget, onCoin, onOrb } = {}) {
            if (reducedMotion()) return
            const burst = (kind, count, target, onArrive, size) => {
                for (let index = 0; index < count; index += 1) {
                    const angle = random(-Math.PI * 0.95, -Math.PI * 0.05)
                    const speed = random(220, 520)
                    push({
                        kind, x: x + random(-8, 8), y: y + random(-6, 6), vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                        size, age: -index * 0.03, life: Infinity, burst: random(0.3, 0.45), spinOffset: random(0, 6), target,
                        onArrive: index === 0 ? onArrive : null,
                    })
                }
            }
            if (coins > 0) burst("coin", Math.min(12, 4 + Math.ceil(Math.log10(coins + 1) * 2)), coinTarget, onCoin, 11)
            if (xp > 0) burst("orb", Math.min(10, 3 + Math.ceil(Math.log10(xp + 1) * 2)), xpTarget, onOrb, 9)
        },

        // Осколки беруть вигляд із текстури самого блока: шматок 2×2 текселі, як частинка руйнування
        debris(x, y, iconUrl, count, { groundY = y + 120, power = 1 } = {}) {
            if (reducedMotion()) return
            const texture = loadTexture(iconUrl)
            const natural = texture?.image.naturalWidth || 64
            const sw = Math.max(1, Math.round(natural / SOURCE_TEXELS * 2))
            for (let index = 0; index < count; index += 1) {
                let sx = random(0, natural - sw)
                let sy = random(0, natural - sw)
                if (texture?.opaque.length) {
                    const pick = Math.floor(Math.random() * texture.opaque.length / 2) * 2
                    sx = Math.min(natural - sw, texture.opaque[pick])
                    sy = Math.min(natural - sw, texture.opaque[pick + 1])
                }
                const angle = random(-Math.PI * 0.95, -Math.PI * 0.05)
                const speed = random(140, 330) * power
                push({
                    kind: "debris", texture, sx, sy, sw,
                    x: x + random(-14, 14), y: y + random(-14, 14),
                    vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                    size: random(7, 12), groundY: groundY + random(-6, 10), age: 0, life: random(0.55, 0.95),
                })
            }
        },

        crit(x, y, { magic = false, count = 14 } = {}) {
            if (reducedMotion()) return
            for (let index = 0; index < count; index += 1) {
                const angle = random(0, Math.PI * 2)
                const speed = random(260, 520)
                const palette = magic && index % 2 ? MAGIC_COLORS : CRIT_COLORS
                push({
                    kind: "crit", color: palette[index % palette.length],
                    x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 80,
                    size: random(2.5, 4), age: 0, life: random(0.45, 0.7),
                })
            }
        },

        // target() викликається в момент підбору: кнопка інвентаря могла зсунутись
        item(x, y, iconUrl, { groundY = y + 100, delay = 0, target, onArrive } = {}) {
            const texture = loadTexture(iconUrl)
            if (reducedMotion()) {
                onArrive?.()
                return
            }
            push({
                kind: "item", texture, phase: "pop",
                x: x + random(-10, 10), y, vx: (Math.random() < 0.5 ? -1 : 1) * random(150, 260), vy: random(-600, -460),
                groundY: groundY + random(-8, 8), size: 42, spinOffset: random(0, Math.PI * 2),
                age: -delay, life: Infinity, collectAt: 0.95 + random(0, 0.25), collectTime: 0.5, target, onArrive,
            })
        },
    }
}

const particles = createEngine()

const BUMP = [{ transform: "scale(1)" }, { transform: "scale(1.25) translateY(-3px)" }, { transform: "scale(1)" }]

function centerOf(selector) {
    const node = document.querySelector(selector)
    if (!node) return null
    const bounds = node.getBoundingClientRect()
    return { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 }
}

function bump(selector) {
    if (reducedMotion()) return
    document.querySelector(selector)?.animate(BUMP, { duration: 220, easing: "steps(4)" })
}

// Ціль польоту — слот нижнього меню. Позиція читається в мить польоту: меню могло зсунутись
export function navTarget(path) {
    const selector = `.NavBar a[href="${path}"] .NavBar__slot`
    return { target: () => centerOf(selector), onArrive: () => bump(selector) }
}

// Монети летять у баланс шапки, досвід — у вкладку профілю, де видно рівень
export function rewardBurst(x, y, { coins = 0, xp = 0 } = {}) {
    const profile = navTarget("/profile")
    particles.reward(x, y, {
        coins, xp,
        coinTarget: () => centerOf(".Header__balance"), onCoin: () => bump(".Header__balance"),
        xpTarget: profile.target, onOrb: profile.onArrive,
    })
}

export default particles
