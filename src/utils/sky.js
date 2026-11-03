// Небо над поверхнею живе за справжнім часом гравця: схід і захід сонця рахуються для його регіону,
// місяць має сьогоднішню фазу, а погода однакова для всіх, хто живе поруч.
import { useEffect, useState } from "react"

const DAY_MS = 86400000
const RAD = Math.PI / 180
const TWILIGHT_MS = 50 * 60000
const TICK_MS = 20000

// Координати столиць для поширених часових поясів. Решта поясів отримують довготу зі свого зсуву від UTC
const ZONES = {
    "Europe/Kyiv": [50.45, 30.52], "Europe/Kiev": [50.45, 30.52], "Europe/Uzhgorod": [48.62, 22.3], "Europe/Zaporozhye": [47.84, 35.14], "Europe/Simferopol": [44.95, 34.1],
    "Europe/Moscow": [55.76, 37.62], "Europe/Minsk": [53.9, 27.57], "Europe/Warsaw": [52.23, 21.01], "Europe/Berlin": [52.52, 13.4],
    "Europe/London": [51.51, -0.13], "Europe/Paris": [48.86, 2.35], "Europe/Madrid": [40.42, -3.7], "Europe/Rome": [41.9, 12.5],
    "Europe/Amsterdam": [52.37, 4.9], "Europe/Brussels": [50.85, 4.35], "Europe/Vienna": [48.21, 16.37], "Europe/Prague": [50.08, 14.44],
    "Europe/Budapest": [47.5, 19.04], "Europe/Bucharest": [44.43, 26.1], "Europe/Chisinau": [47.01, 28.86], "Europe/Sofia": [42.7, 23.32],
    "Europe/Athens": [37.98, 23.73], "Europe/Istanbul": [41.01, 28.98], "Europe/Helsinki": [60.17, 24.94], "Europe/Stockholm": [59.33, 18.07],
    "Europe/Oslo": [59.91, 10.75], "Europe/Copenhagen": [55.68, 12.57], "Europe/Riga": [56.95, 24.11], "Europe/Vilnius": [54.69, 25.28],
    "Europe/Tallinn": [59.44, 24.75], "Europe/Lisbon": [38.72, -9.14], "Europe/Dublin": [53.35, -6.26], "Europe/Zurich": [47.38, 8.54],
    "Europe/Belgrade": [44.79, 20.45], "Europe/Zagreb": [45.81, 15.98], "Europe/Bratislava": [48.15, 17.11], "Europe/Samara": [53.2, 50.15],
    "Asia/Yekaterinburg": [56.84, 60.6], "Asia/Novosibirsk": [55.03, 82.92], "Asia/Krasnoyarsk": [56.01, 92.89], "Asia/Irkutsk": [52.29, 104.3],
    "Asia/Vladivostok": [43.12, 131.89], "Asia/Almaty": [43.24, 76.89], "Asia/Tashkent": [41.3, 69.24], "Asia/Bishkek": [42.87, 74.59],
    "Asia/Tbilisi": [41.72, 44.79], "Asia/Yerevan": [40.18, 44.51], "Asia/Baku": [40.41, 49.87], "Asia/Tehran": [35.69, 51.39],
    "Asia/Dubai": [25.2, 55.27], "Asia/Riyadh": [24.71, 46.68], "Asia/Jerusalem": [31.77, 35.21], "Asia/Karachi": [24.86, 67.0],
    "Asia/Kolkata": [28.61, 77.21], "Asia/Calcutta": [28.61, 77.21], "Asia/Dhaka": [23.81, 90.41], "Asia/Bangkok": [13.76, 100.5],
    "Asia/Jakarta": [-6.21, 106.85], "Asia/Ho_Chi_Minh": [10.82, 106.63], "Asia/Saigon": [10.82, 106.63], "Asia/Singapore": [1.35, 103.82],
    "Asia/Kuala_Lumpur": [3.14, 101.69], "Asia/Manila": [14.6, 120.98], "Asia/Shanghai": [31.23, 121.47], "Asia/Hong_Kong": [22.32, 114.17],
    "Asia/Taipei": [25.03, 121.57], "Asia/Seoul": [37.57, 126.98], "Asia/Tokyo": [35.68, 139.69],
    "Australia/Sydney": [-33.87, 151.21], "Australia/Melbourne": [-37.81, 144.96], "Australia/Perth": [-31.95, 115.86], "Pacific/Auckland": [-36.85, 174.76],
    "America/New_York": [40.71, -74.01], "America/Chicago": [41.88, -87.63], "America/Denver": [39.74, -104.99], "America/Los_Angeles": [34.05, -118.24],
    "America/Toronto": [43.65, -79.38], "America/Vancouver": [49.28, -123.12], "America/Mexico_City": [19.43, -99.13], "America/Sao_Paulo": [-23.55, -46.63],
    "America/Argentina/Buenos_Aires": [-34.6, -58.38], "America/Bogota": [4.71, -74.07], "America/Lima": [-12.05, -77.04], "America/Santiago": [-33.45, -70.67],
    "Africa/Cairo": [30.04, 31.24], "Africa/Lagos": [6.52, 3.38], "Africa/Nairobi": [-1.29, 36.82], "Africa/Johannesburg": [-26.2, 28.05], "Africa/Casablanca": [33.57, -7.59],
}
const REGION_LATITUDE = { Europe: 50, Asia: 35, America: 35, Africa: 5, Australia: -30, Pacific: -15, Atlantic: 40, Indian: -10 }

function zoneName() {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
    } catch {
        return "UTC"
    }
}

// Стандартний зсув без літнього часу: менший із січневого й липневого
function standardOffsetHours(year) {
    const winter = new Date(year, 0, 1).getTimezoneOffset()
    const summer = new Date(year, 6, 1).getTimezoneOffset()
    return -Math.max(winter, summer) / 60
}

export function regionOf(now = new Date()) {
    const zone = zoneName()
    const known = ZONES[zone]
    if (known) return { zone, latitude: known[0], longitude: known[1] }
    const continent = zone.split("/")[0]
    return { zone, latitude: REGION_LATITUDE[continent] ?? 45, longitude: standardOffsetHours(now.getFullYear()) * 15 }
}

// Схід і захід за алгоритмом SunCalc: точності до хвилини досить, щоб небо збігалось із вікном
const J1970 = 2440588
const J2000 = 2451545
const toDays = time => time / DAY_MS - .5 + J1970 - J2000
const fromJulian = julian => (julian + .5 - J1970) * DAY_MS
const OBLIQUITY = RAD * 23.4397

function sunEvents(time, latitude, longitude) {
    const lw = RAD * -longitude
    const phi = RAD * latitude
    const days = toDays(time)
    const cycle = Math.round(days - .0009 - lw / (2 * Math.PI))
    const approx = .0009 + lw / (2 * Math.PI) + cycle
    const anomaly = RAD * (357.5291 + .98560028 * approx)
    const center = RAD * (1.9148 * Math.sin(anomaly) + .02 * Math.sin(2 * anomaly) + .0003 * Math.sin(3 * anomaly))
    const ecliptic = anomaly + center + RAD * 102.9372 + Math.PI
    const declination = Math.asin(Math.sin(OBLIQUITY) * Math.sin(ecliptic))
    const transit = J2000 + approx + .0053 * Math.sin(anomaly) - .0069 * Math.sin(2 * ecliptic)
    const cosHour = (Math.sin(RAD * -.833) - Math.sin(phi) * Math.sin(declination)) / (Math.cos(phi) * Math.cos(declination))
    // Полярний день або ніч: сонце не сходить чи не заходить
    if (cosHour < -1) return { polar: "day", noon: fromJulian(transit) }
    if (cosHour > 1) return { polar: "night", noon: fromJulian(transit) }
    const hour = Math.acos(cosHour)
    const set = J2000 + .0009 + (hour + lw) / (2 * Math.PI) + cycle + .0053 * Math.sin(anomaly) - .0069 * Math.sin(2 * ecliptic)
    return { rise: fromJulian(transit - (set - transit)), set: fromJulian(set), noon: fromJulian(transit) }
}

// Фаза місяця за справжньою датою, у порядку текстур гри: 0 повня, 4 молодик
const SYNODIC_DAYS = 29.530588853
const NEW_MOON = Date.UTC(2000, 0, 6, 18, 14)

export function moonFrame(time) {
    const age = (((time - NEW_MOON) / DAY_MS) % SYNODIC_DAYS + SYNODIC_DAYS) % SYNODIC_DAYS / SYNODIC_DAYS
    return (Math.round(age * 8) + 4) % 8
}

function hash(value) {
    const x = Math.sin(value * 127.1 + 311.7) * 43758.5453
    return x - Math.floor(x)
}

// Погода міняється раз на чотири години й однакова в межах широкого поясу довготи
function weatherAt(time, region) {
    const block = Math.floor(time / (4 * 3600000))
    const band = Math.round(region.longitude / 20)
    if (hash(block * 7.31 + band * 13.7) > .17) return "clear"
    const month = new Date(time).getMonth()
    const winter = region.latitude > 35 ? [11, 0, 1].includes(month) : region.latitude < -35 && [5, 6, 7].includes(month)
    return winter ? "snow" : "rain"
}

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value))

// Висота світила від -1 (глибока ніч) до 1 (полудень), прогрес дня або ночі й кадр годинника
function solarState(time, region) {
    const today = sunEvents(time, region.latitude, region.longitude)
    if (today.polar) {
        const progress = clamp(.5 + (time - today.noon) / DAY_MS)
        const isDay = today.polar === "day"
        return { isDay, progress, elevation: isDay ? .6 : -.7, twilight: 0, morning: false, rise: null, set: null }
    }
    let { rise, set } = today
    let isDay = time >= rise && time < set
    let progress
    if (isDay) progress = (time - rise) / (set - rise)
    else if (time >= set) {
        const next = sunEvents(time + DAY_MS, region.latitude, region.longitude)
        progress = (time - set) / ((next.rise ?? set + DAY_MS / 2) - set)
    } else {
        const previous = sunEvents(time - DAY_MS, region.latitude, region.longitude)
        progress = (time - (previous.set ?? rise - DAY_MS / 2)) / (rise - (previous.set ?? rise - DAY_MS / 2))
    }
    progress = clamp(progress)
    const elevation = isDay ? Math.sin(Math.PI * progress) : -Math.sin(Math.PI * progress)
    const nearest = Math.min(Math.abs(time - rise), Math.abs(time - set))
    const twilight = clamp(1 - nearest / TWILIGHT_MS)
    const morning = Math.abs(time - rise) < Math.abs(time - set)
    return { isDay, progress, elevation, twilight, morning, rise, set }
}

const mix = (from, to, amount) => from.map((value, index) => Math.round(value + (to[index] - value) * amount))
const rgb = color => `rgb(${color.join(" ")})`

const CLOUD_DAY = [255, 255, 255]
const CLOUD_DUSK = [255, 196, 170]
const CLOUD_NIGHT = [52, 58, 92]
const CLOUD_STORM = [128, 134, 146]

export function skyAt(time = Date.now(), region = regionOf(new Date(time))) {
    const solar = solarState(time, region)
    const weather = weatherAt(time, region)
    const stormy = weather !== "clear"
    // Денне світло росте ще до сходу: небо світлішає в сутінках, а не вмикається
    const daylight = clamp((solar.elevation + .12) / .4)
    const dusk = solar.twilight * (stormy ? .35 : .9)
    const night = 1 - daylight
    let cloud = mix(CLOUD_NIGHT, CLOUD_DAY, daylight)
    cloud = mix(cloud, CLOUD_DUSK, dusk * .8)
    if (stormy) cloud = mix(cloud, mix(CLOUD_NIGHT, CLOUD_STORM, daylight), .7)

    const phase = solar.twilight > .35 ? (solar.morning ? "dawn" : "dusk") : daylight > .5 ? "day" : "night"
    // Годинник гри: кадр 0 полудень, 16 захід, 32 північ, 48 схід
    const clock = Math.round(solar.isDay ? 48 + solar.progress * 32 : 16 + solar.progress * 32) % 64
    return {
        phase, weather, region, clock, time,
        isDay: solar.isDay,
        progress: solar.progress,
        elevation: solar.elevation,
        daylight, dusk,
        stars: clamp(1 - daylight * 1.8) * (stormy ? .15 : 1),
        // Темрява на землі: уночі місяць лишає трохи світла, як у грі
        shade: night * .68 + (stormy ? .16 : 0),
        cloud: rgb(cloud),
        moon: moonFrame(time),
        rise: solar.rise,
        set: solar.set,
    }
}

// Хук оновлює небо раз на 20 секунд: переходи CSS розтягують зміну на весь інтервал
export function useSky() {
    const [sky, setSky] = useState(() => skyAt())
    useEffect(() => {
        const timer = setInterval(() => setSky(skyAt()), TICK_MS)
        const wake = () => document.visibilityState === "visible" && setSky(skyAt())
        document.addEventListener("visibilitychange", wake)
        return () => {
            clearInterval(timer)
            document.removeEventListener("visibilitychange", wake)
        }
    }, [])
    return sky
}

export const SKY_TICK_MS = TICK_MS
