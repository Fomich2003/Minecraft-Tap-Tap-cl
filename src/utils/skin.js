// Обличчя гравця з дев'яти стандартних скінів гри: одне й те саме ім'я завжди отримує той самий скін
const SKINS = ["steve", "alex", "ari", "efe", "kai", "makena", "noor", "sunny", "zuri"]

export function faceOf(name) {
    let hash = 0
    for (const char of String(name ?? "")) hash = (hash * 31 + char.codePointAt(0)) >>> 0
    return `/assets/faces/${SKINS[hash % SKINS.length]}.png`
}
