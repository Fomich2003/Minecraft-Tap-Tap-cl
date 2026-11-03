// Світ для фону гри: одна висока карта з текстур Minecraft, якою камера спускається згори донизу.
// Генерується один раз за запуск і малюється в полотно, тому під час польоту браузер лише зсуває готову картинку.
const TILE = 16
const COLUMNS = 20
const ROWS = 250
const STOPS = [0, 54, 108, 162, 216]
// Рядки всередині локації: кімната скомпонована під видиму ділянку екрана навколо блока
const ROOM_TOP = 5
const FLOOR = 15
const BEDROCK_NETHER = [150, 157]
const BEDROCK_END = [204, 212]
const VOID_ROW = 212
const LAVA_ROWS = 12

// Порядок збігається з атласом, який створює server/src/scripts/export-visual-assets.js
const NAMES = [
    "grass_side", "dirt", "stone", "andesite", "granite", "diorite", "gravel", "tuff",
    "coal_ore", "iron_ore", "copper_ore", "gold_ore", "lapis_ore",
    "deepslate", "deepslate_coal_ore", "deepslate_iron_ore", "deepslate_gold_ore", "deepslate_redstone_ore", "deepslate_lapis_ore", "deepslate_diamond_ore", "deepslate_emerald_ore",
    "amethyst_block", "amethyst_cluster", "sculk", "sculk_vein", "bedrock",
    "netherrack", "nether_quartz_ore", "nether_gold_ore", "glowstone", "magma", "soul_sand", "basalt", "blackstone", "nether_bricks",
    "weeping_vines", "weeping_vines_plant", "crimson_fungus", "crimson_roots",
    "obsidian", "end_stone", "end_stone_bricks", "chorus_plant", "chorus_flower",
    "oak_log", "oak_leaves", "oak_planks", "torch", "short_grass", "dandelion", "poppy", "water", "lava",
    "moss_block", "dripstone_block", "stalactite_tip", "stalactite_base", "stalagmite_tip", "stalagmite_base",
    "cobweb", "brown_mushroom", "red_mushroom", "cave_vines", "cave_vines_plant",
]
const TILES = Object.fromEntries(NAMES.map((name, index) => [name, index]))

// Ці текстури прозорі: за ними має бути видно стіну печери
const SEE_THROUGH = new Set([
    "torch", "short_grass", "dandelion", "poppy", "amethyst_cluster", "sculk_vein", "weeping_vines", "weeping_vines_plant", "crimson_fungus", "crimson_roots",
    "chorus_plant", "chorus_flower", "stalactite_tip", "stalactite_base", "stalagmite_tip", "stalagmite_base", "cobweb", "brown_mushroom", "red_mushroom", "cave_vines", "cave_vines_plant",
].map(name => TILES[name]))

// Детермінований шум: світ однаковий при кожному запуску
function hash(x, y) {
    const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
    return value - Math.floor(value)
}

function smooth(x, y) {
    const left = Math.floor(x)
    const top = Math.floor(y)
    const dx = x - left
    const dy = y - top
    const ease = value => value * value * (3 - 2 * value)
    const blend = (from, to, amount) => from + (to - from) * ease(amount)
    return blend(blend(hash(left, top), hash(left + 1, top), dx), blend(hash(left, top + 1), hash(left + 1, top + 1), dx), dy)
}

const noise = (x, y) => smooth(x / 6, y / 5) * .65 + smooth(x / 2.5, y / 2.5) * .35

const inRange = (y, [from, to]) => y >= from && y < to

function baseTile(x, y) {
    if (inRange(y, BEDROCK_NETHER)) return hash(x, y) > .4 ? TILES.bedrock : TILES.deepslate
    if (inRange(y, BEDROCK_END)) return hash(x, y) > .55 ? TILES.bedrock : TILES.obsidian
    if (y < 18 + Math.round(smooth(x / 3, 9) * 3)) return TILES.dirt
    const pocket = smooth(x / 4, y / 3)
    if (y < 100) {
        if (pocket > .78) return TILES.granite
        if (pocket > .7) return TILES.diorite
        if (pocket < .2) return TILES.andesite
        if (y > 70 && pocket < .32) return TILES.tuff
        return hash(x, y) > .985 ? TILES.gravel : TILES.stone
    }
    if (y < 150) return pocket > .8 ? TILES.tuff : TILES.deepslate
    if (y < 204) {
        if (pocket > .76) return TILES.blackstone
        if (pocket < .22) return TILES.basalt
        const roll = hash(x, y)
        if (roll > .985) return TILES.magma
        return roll > .97 ? TILES.soul_sand : TILES.netherrack
    }
    return TILES.end_stone
}

function oreAt(x, y) {
    // Під підлогою кімнат руд більше: цю породу гравець бачить постійно
    const belowRoom = STOPS.some(stop => y >= stop + FLOOR && y < stop + FLOOR + 10)
    const roll = belowRoom ? hash(x * 3 + 7, y * 5 + 11) ** .55 : hash(x * 3 + 7, y * 5 + 11)
    if (y < 100) {
        if (y < 24) return null
        if (roll > .975) return TILES.coal_ore
        if (roll > .955 && y > 30) return TILES.iron_ore
        if (roll > .945 && y > 40) return TILES.copper_ore
        if (roll > .938 && y > 60) return TILES.lapis_ore
        if (roll > .932 && y > 70) return TILES.gold_ore
        return null
    }
    if (inRange(y, BEDROCK_NETHER)) return null
    if (y < 150) {
        if (roll > .975) return TILES.deepslate_coal_ore
        if (roll > .958) return TILES.deepslate_iron_ore
        if (roll > .945) return TILES.deepslate_redstone_ore
        if (roll > .935) return TILES.deepslate_gold_ore
        if (roll > .928) return TILES.deepslate_lapis_ore
        if (roll > .922) return TILES.deepslate_diamond_ore
        if (roll > .919) return TILES.deepslate_emerald_ore
        return null
    }
    if (y >= BEDROCK_NETHER[1] && y < BEDROCK_END[0]) {
        if (roll > .965) return TILES.nether_quartz_ore
        if (roll > .95) return TILES.nether_gold_ore
    }
    return null
}

// Головна шахта виходить із підлоги однієї кімнати збоку від блока й заходить у стелю наступної
const SHAFTS = [
    [24, STOPS[1] + ROOM_TOP + 1],
    [STOPS[1] + FLOOR - 1, STOPS[2] + ROOM_TOP + 1],
    [STOPS[2] + FLOOR - 1, STOPS[3] + ROOM_TOP],
    [STOPS[3] + FLOOR + LAVA_ROWS, VOID_ROW],
]

function inShaft(x, y) {
    const shaft = SHAFTS.find(([from, to]) => y >= from && y <= to)
    if (!shaft) return false
    const progress = (y - shaft[0]) / (shaft[1] - shaft[0])
    const center = 10 + Math.cos(progress * Math.PI * 3) * 7 + Math.sin(y / 4) * .8
    const narrow = inRange(y, BEDROCK_NETHER) || inRange(y, BEDROCK_END)
    return Math.abs(x - center) < (narrow ? 1.6 : 1.8 + noise(y, 3) * 1.4)
}

function isOpen(x, y) {
    if (y >= VOID_ROW) return true
    if (y < 24) return false
    if (inShaft(x, y)) return true

    const cave = STOPS.slice(1, 3).find(stop => y >= stop + ROOM_TOP && y < stop + FLOOR)
    if (cave) {
        const arch = Math.sin((y - cave - ROOM_TOP + 1) / (FLOOR - ROOM_TOP + 1) * Math.PI)
        return Math.abs(x - 9.5) < 5.2 + arch * 1.8 + (noise(x, y) - .5) * 1.2
    }
    const nether = STOPS[3]
    if (y >= nether && y < nether + FLOOR) return y >= nether + 4 + Math.round(noise(x, 7) * 3)

    // Бічні порожнини: лише там, де пролітає камера, а не поруч із кімнатами
    const stop = STOPS.findLast(value => value <= y)
    const next = STOPS[STOPS.indexOf(stop) + 1] ?? VOID_ROW
    if (y < stop + FLOOR + 11 || y > next - 3 || inRange(y, BEDROCK_NETHER) || inRange(y, BEDROCK_END)) return false
    return noise(x * 1.4, y * 1.2) > .72
}

function createMap() {
    const grid = new Int16Array(COLUMNS * ROWS).fill(-1)
    const inside = (x, y) => x >= 0 && x < COLUMNS && y >= 0 && y < ROWS
    const set = (x, y, tile) => {
        if (inside(x, y)) grid[y * COLUMNS + x] = tile
    }
    const get = (x, y) => (inside(x, y) ? grid[y * COLUMNS + x] : 0)
    const fill = (fromX, toX, fromY, toY, tile) => {
        for (let y = fromY; y <= toY; y += 1) for (let x = fromX; x <= toX; x += 1) set(x, y, tile)
    }
    // Рослини й сталактити кріпляться до першої порожньої клітинки під стелею
    const hang = (x, from, ...tiles) => {
        let y = from
        while (y < from + 12 && get(x, y) !== -1) y += 1
        tiles.forEach((tile, offset) => {
            if (get(x, y + offset) === -1) set(x, y + offset, tile)
        })
    }
    return { grid, get, set, fill, hang, torches: [] }
}

function dressSurface(map) {
    for (let x = 0; x < COLUMNS; x += 1) map.set(x, FLOOR, TILES.grass_side)
    for (const [column, height] of [[5, 5], [14, 6], [1, 4], [18, 5]]) {
        map.fill(column, column, FLOOR - height, FLOOR - 1, TILES.oak_log)
        for (let layer = 0; layer < 4; layer += 1) {
            const reach = layer < 2 ? 2 : 1
            for (let dx = -reach; dx <= reach; dx += 1) {
                const row = FLOOR - height + 1 - layer
                if (map.get(column + dx, row) === -1) map.set(column + dx, row, TILES.oak_leaves)
            }
        }
    }
    for (let x = 0; x < COLUMNS; x += 1) {
        if (map.get(x, FLOOR - 1) !== -1) continue
        const roll = hash(x, 1)
        if (roll > .55) map.set(x, FLOOR - 1, TILES.short_grass)
        else if (roll > .35) map.set(x, FLOOR - 1, TILES.poppy)
        else if (roll > .15) map.set(x, FLOOR - 1, TILES.dandelion)
    }
}

function addDripstone(map, stop, columns) {
    columns.forEach((column, index) => {
        if (index % 2) map.hang(column, stop + ROOM_TOP - 2, TILES.stalactite_base, TILES.stalactite_tip)
        else map.hang(column, stop + ROOM_TOP - 2, TILES.stalactite_tip)
    })
}

// Старе кріплення штольні, вода, мох і сталактити
function dressCaves(map) {
    const stop = STOPS[1]
    const floor = stop + FLOOR
    map.fill(4, 8, floor, floor, TILES.moss_block)
    map.fill(14, 18, floor, floor + 1, TILES.water)
    map.fill(9, 13, floor, floor, TILES.dripstone_block)

    map.fill(4, 15, stop + 8, stop + 8, TILES.oak_planks)
    map.fill(5, 5, stop + 9, floor - 1, TILES.oak_log)
    map.fill(14, 14, stop + 9, floor - 1, TILES.oak_log)
    map.set(6, stop + 9, TILES.cobweb)
    map.set(13, stop + 9, TILES.cobweb)
    map.set(4, stop + 9, TILES.cobweb)

    addDripstone(map, stop, [6, 8, 11, 12, 13, 9])
    map.set(4, floor - 1, TILES.red_mushroom)
    map.set(6, floor - 1, TILES.brown_mushroom)
    map.set(7, floor - 1, TILES.stalagmite_tip)
    map.hang(7, stop + ROOM_TOP - 2, TILES.cave_vines_plant, TILES.cave_vines)
    map.hang(10, stop + ROOM_TOP - 2, TILES.cave_vines_plant, TILES.cave_vines_plant, TILES.cave_vines)

    map.torches.push({ x: 7, y: stop + 7 }, { x: 12, y: stop + 7 }, { x: 4, y: stop + 11 }, { x: 15, y: stop + 11 })
}

function geode(map, centerX, centerY) {
    for (let dy = -3; dy <= 3; dy += 1) {
        for (let dx = -3; dx <= 3; dx += 1) {
            const distance = Math.hypot(dx, dy)
            if (distance < 3.4 && distance > 1.8) map.set(centerX + dx, centerY + dy, TILES.amethyst_block)
            else if (distance <= 1.8) map.set(centerX + dx, centerY + dy, -1)
        }
    }
    map.set(centerX, centerY + 1, TILES.amethyst_cluster)
    map.set(centerX - 1, centerY + 1, TILES.amethyst_cluster)
    map.set(centerX + 1, centerY - 1, TILES.amethyst_cluster)
}

// Темна безодня: скалк на підлозі, аметистові жеоди й лавове озеро
function dressDepths(map) {
    const stop = STOPS[2]
    const floor = stop + FLOOR
    geode(map, 2, stop + 9)
    geode(map, 17, stop + 8)
    map.fill(3, 13, floor, floor, TILES.sculk)
    map.fill(14, 18, floor, floor + 1, TILES.lava)
    for (const column of [4, 6, 12, 13]) map.set(column, floor - 1, TILES.sculk_vein)
    addDripstone(map, stop, [6, 7, 12, 13])
    map.torches.push({ x: 5, y: stop + 9 }, { x: 14, y: stop + 10 })
}

// Міст фортеці над лавовим морем, світлокамінь і багряні лози під стелею
function dressNether(map) {
    const stop = STOPS[3]
    const floor = stop + FLOOR
    for (let x = 0; x < COLUMNS; x += 1) map.fill(x, x, floor + 1, floor + LAVA_ROWS - 3 + Math.round(noise(x * 2, 11) * 3), TILES.lava)
    map.fill(0, COLUMNS - 1, floor, floor, TILES.nether_bricks)
    for (const column of [6, 13]) map.fill(column, column, floor + 1, floor + LAVA_ROWS, TILES.nether_bricks)

    for (const [column, row] of [[4, 6], [9, 5], [15, 6]]) {
        for (let dy = -2; dy <= 1; dy += 1) {
            for (let dx = -2; dx <= 2; dx += 1) {
                if (hash(column + dx, row + dy) > .25 - dy * .1) map.set(column + dx, stop + row + dy, TILES.glowstone)
            }
        }
    }
    map.hang(7, stop + 3, TILES.weeping_vines_plant, TILES.weeping_vines_plant, TILES.weeping_vines)
    map.hang(12, stop + 3, TILES.weeping_vines_plant, TILES.weeping_vines)
    map.hang(11, stop + 3, TILES.weeping_vines_plant, TILES.weeping_vines_plant, TILES.weeping_vines_plant, TILES.weeping_vines)
    for (const [column, tile] of [[4, TILES.crimson_fungus], [5, TILES.crimson_roots], [14, TILES.crimson_roots], [15, TILES.crimson_fungus], [16, TILES.crimson_roots]]) {
        map.set(column, floor - 1, tile)
    }
}

// Острів із ендерняку, обсидіанові стовпи й хорус-дерева
function dressEnd(map) {
    const stop = STOPS[4]
    const floor = stop + FLOOR
    for (let x = 0; x < COLUMNS; x += 1) {
        const distance = Math.abs(x - 9.5)
        const top = floor + Math.round(distance / 6)
        const bottom = floor + 9 - Math.round(distance * .75) + Math.round(smooth(x / 2, 4) * 2)
        map.fill(x, x, top, bottom, TILES.end_stone)
    }
    map.fill(7, 12, floor, floor, TILES.end_stone_bricks)
    for (const [column, top] of [[4, 6], [15, 8]]) map.fill(column, column, stop + top, floor, TILES.obsidian)

    for (const [column, height] of [[5, 5], [14, 6]]) {
        map.fill(column, column, floor - height, floor - 1, TILES.chorus_plant)
        map.set(column, floor - height - 1, TILES.chorus_flower)
    }
    map.set(13, floor - 3, TILES.chorus_plant)
    map.set(13, floor - 4, TILES.chorus_flower)
    map.set(6, floor - 2, TILES.chorus_plant)
    map.set(6, floor - 3, TILES.chorus_flower)
}

function buildMap() {
    const map = createMap()
    for (let y = FLOOR + 1; y < ROWS; y += 1) {
        for (let x = 0; x < COLUMNS; x += 1) {
            if (!isOpen(x, y)) map.set(x, y, oreAt(x, y) ?? baseTile(x, y))
        }
    }
    dressSurface(map)
    dressCaves(map)
    dressDepths(map)
    dressNether(map)
    dressEnd(map)
    return map
}

// Стіна за порожнечею однорідна, щоб кімната читалась як простір, а не як плями
function wallOf(y) {
    if (y <= FLOOR || y >= VOID_ROW) return null
    if (y < 100) return { tile: TILES.stone, shade: "rgb(6 8 14 / 58%)" }
    if (y < BEDROCK_NETHER[1]) return { tile: TILES.deepslate, shade: "rgb(4 5 12 / 62%)" }
    if (y < BEDROCK_END[0]) return { tile: TILES.netherrack, shade: "rgb(30 3 3 / 68%)" }
    return { tile: TILES.obsidian, shade: "rgb(8 2 16 / 60%)" }
}

function paintHills(context) {
    const layers = [{ top: 8, range: 4, color: "#a9c9ea", seed: 2 }, { top: 10, range: 4, color: "#8db98b", seed: 5 }]
    for (const { top, range, color, seed } of layers) {
        context.fillStyle = color
        for (let x = 0; x < COLUMNS * 2; x += 1) {
            const height = top + Math.round(smooth(x / 5, seed) * range)
            context.fillRect(x * TILE / 2, height * TILE, TILE / 2, (FLOOR - height) * TILE)
        }
    }
}

function paintVoid(context) {
    const top = VOID_ROW * TILE
    const gradient = context.createLinearGradient(0, top, 0, ROWS * TILE)
    gradient.addColorStop(0, "#07030f")
    gradient.addColorStop(.42, "#2a1147")
    gradient.addColorStop(.7, "#170a2c")
    gradient.addColorStop(1, "#05020a")
    context.fillStyle = gradient
    context.fillRect(0, top, COLUMNS * TILE, (ROWS - VOID_ROW) * TILE)

    for (let index = 0; index < 150; index += 1) {
        context.fillStyle = hash(index, 3) > .5 ? "#f0e6ff" : "#a98bd8"
        context.fillRect(Math.floor(hash(index, 1) * COLUMNS * TILE), Math.floor(top + hash(index, 2) * (ROWS - VOID_ROW) * TILE), 1, 1)
    }
    // Далекі острови
    context.fillStyle = "#3a2a55"
    for (const [column, row, width] of [[1, 221, 3], [15, 224, 4], [7, 217, 2], [16, 240, 3]]) {
        for (let step = 0; step < 3; step += 1) {
            context.fillRect((column + step / 2) * TILE, (row + step) * TILE / 1, (width - step) * TILE, TILE / 2)
        }
    }
}

function paint(atlas, map) {
    const canvas = document.createElement("canvas")
    canvas.width = COLUMNS * TILE
    canvas.height = ROWS * TILE
    canvas.className = "World__map"
    const context = canvas.getContext("2d")
    context.imageSmoothingEnabled = false
    const draw = (tile, x, y) => context.drawImage(atlas, tile * TILE, 0, TILE, TILE, x * TILE, y * TILE, TILE, TILE)

    paintHills(context)
    paintVoid(context)

    for (let y = 0; y < ROWS; y += 1) {
        for (let x = 0; x < COLUMNS; x += 1) {
            const tile = map.grid[y * COLUMNS + x]
            if (tile === -1 || SEE_THROUGH.has(tile)) {
                const wall = wallOf(y)
                if (wall) {
                    draw(wall.tile, x, y)
                    context.fillStyle = wall.shade
                    context.fillRect(x * TILE, y * TILE, TILE, TILE)
                }
            }
            if (tile !== -1) draw(tile, x, y)
        }
    }

    // Тінь під кожним блоком, що межує з порожнечею, додає глибини
    context.fillStyle = "rgb(0 0 0 / 38%)"
    for (let y = FLOOR + 2; y < VOID_ROW; y += 1) {
        for (let x = 0; x < COLUMNS; x += 1) {
            const open = map.grid[y * COLUMNS + x] === -1
            const above = map.grid[(y - 1) * COLUMNS + x]
            if (open && above !== -1 && !SEE_THROUGH.has(above)) context.fillRect(x * TILE, y * TILE, TILE, TILE / 2)
        }
    }

    context.globalCompositeOperation = "lighter"
    const glow = (x, y, radius, color) => {
        const gradient = context.createRadialGradient(x * TILE, y * TILE, 2, x * TILE, y * TILE, radius * TILE)
        gradient.addColorStop(0, color)
        gradient.addColorStop(1, "rgb(0 0 0 / 0%)")
        context.fillStyle = gradient
        context.fillRect((x - radius) * TILE, (y - radius) * TILE, radius * 2 * TILE, radius * 2 * TILE)
    }
    map.torches.forEach(({ x, y }) => glow(x + .5, y + .5, 6, "rgb(255 170 80 / 60%)"))
    for (let y = FLOOR + 1; y < VOID_ROW; y += 1) {
        for (let x = 0; x < COLUMNS; x += 1) {
            const tile = map.grid[y * COLUMNS + x]
            if (tile === TILES.glowstone && hash(x, y) > .6) glow(x + .5, y + .5, 4, "rgb(255 205 130 / 16%)")
            if (tile === TILES.amethyst_cluster) glow(x + .5, y + .5, 3, "rgb(190 120 255 / 34%)")
            if (tile === TILES.lava && y < STOPS[3] && map.get(x, y - 1) === -1) glow(x + .5, y, 4, "rgb(255 110 20 / 34%)")
        }
    }
    for (let x = 0; x < COLUMNS; x += 2) glow(x, STOPS[3] + FLOOR, 7, "rgb(255 90 10 / 30%)")
    glow(15.5, STOPS[1] + FLOOR, 5, "rgb(60 130 255 / 18%)")
    context.globalCompositeOperation = "source-over"
    map.torches.forEach(({ x, y }) => draw(TILES.torch, x, y))
    return canvas
}

// Рядки поверхні, які темніють уночі: маска з тих самих пікселів, тож небо за пагорбами лишається своїм
const SURFACE_ROWS = 30

function surfaceMask(canvas) {
    const crop = document.createElement("canvas")
    crop.width = COLUMNS * TILE
    crop.height = SURFACE_ROWS * TILE
    crop.getContext("2d").drawImage(canvas, 0, 0, crop.width, crop.height, 0, 0, crop.width, crop.height)
    return crop.toDataURL()
}

// Смуги хмар із текстури гри: кожен піксель маски це клітинка хмари, три рядки дають їй товщину
const CLOUD_CELL = { width: 14, height: 9 }

function cloudStrips(image, rows) {
    const source = document.createElement("canvas")
    source.width = image.width
    source.height = image.height
    const context = source.getContext("2d")
    context.drawImage(image, 0, 0)
    const pixels = context.getImageData(0, 0, image.width, image.height).data
    return rows.map(row => {
        const strip = document.createElement("canvas")
        strip.width = image.width * CLOUD_CELL.width
        strip.height = 3 * CLOUD_CELL.height
        const target = strip.getContext("2d")
        target.fillStyle = "#fff"
        for (let line = 0; line < 3; line += 1) {
            for (let x = 0; x < image.width; x += 1) {
                if (pixels[((row + line) * image.width + x) * 4 + 3] > 128) target.fillRect(x * CLOUD_CELL.width, line * CLOUD_CELL.height, CLOUD_CELL.width, CLOUD_CELL.height)
            }
        }
        return { url: strip.toDataURL(), width: strip.width, height: strip.height }
    })
}

const loadImage = src => new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
})

let loading = null

function loadWorld() {
    if (!loading) {
        loading = Promise.all([loadImage("/assets/world/atlas.png"), loadImage("/assets/world/clouds.png").catch(() => null)]).then(([atlas, clouds]) => {
            const map = buildMap()
            const canvas = paint(atlas, map)
            return { canvas, torches: map.torches, mask: surfaceMask(canvas), clouds: clouds ? cloudStrips(clouds, [57, 101]) : [] }
        })
    }
    return loading
}

export { FLOOR, ROOM_TOP, ROWS, STOPS, SURFACE_ROWS, loadWorld }
