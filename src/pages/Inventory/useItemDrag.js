import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { haptic } from "../../utils/telegram"

const HOLD_MS = 160
const MOVE_PX = 8

function dropTargetAt(x, y) {
    const node = document.elementFromPoint(x, y)
    const craft = node?.closest("[data-craft-index]")
    if (craft) return { area: "craft", key: craft.dataset.craftIndex }
    const inventory = node?.closest("[data-inventory-index]")
    if (inventory) return { area: "inventory", index: Number(inventory.dataset.inventoryIndex) }
    return null
}

const targetId = target => (target ? `${target.area}-${target.key ?? target.index}` : null)

// Перетягування одним кодом для миші й пальця. На сенсорному екрані предмет з інвентаря
// береться коротким утриманням, інакше той самий рух прокручує сітку.
function useItemDrag(onDrop) {
    const [ghost, setGhost] = useState(null)
    const [over, setOver] = useState(null)
    const gesture = useRef(null)
    const ghostNode = useRef(null)
    const skipClick = useRef(false)

    const moveGhost = useCallback(({ x, y }) => {
        if (ghostNode.current) ghostNode.current.style.transform = `translate(${x}px, ${y}px) translate(-50%, -60%)`
    }, [])

    const finish = useCallback(() => {
        const current = gesture.current
        if (!current) return
        clearTimeout(current.timer)
        current.detach()
        gesture.current = null
        setGhost(null)
        setOver(null)
    }, [])

    const startDragging = useCallback(current => {
        current.dragging = true
        setGhost(current.preview)
        setOver(targetId(dropTargetAt(current.x, current.y)))
        haptic("drag")
    }, [])

    const begin = useCallback((event, source, preview) => {
        if (event.button !== 0) return
        finish()

        const needsHold = event.pointerType !== "mouse" && source.area === "inventory"
        const current = { source, preview, x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, dragging: false, timer: null, detach: null }

        const handleMove = moveEvent => {
            current.x = moveEvent.clientX
            current.y = moveEvent.clientY
            if (!current.dragging) {
                if (Math.hypot(current.x - current.startX, current.y - current.startY) < MOVE_PX) return
                if (needsHold) finish()
                else startDragging(current)
                return
            }
            moveGhost(current)
            setOver(targetId(dropTargetAt(current.x, current.y)))
        }

        const handleUp = upEvent => {
            if (current.dragging) {
                skipClick.current = true
                setTimeout(() => { skipClick.current = false }, 0)
                onDrop(current.source, dropTargetAt(upEvent.clientX, upEvent.clientY))
            }
            finish()
        }

        // Після початку перетягування сторінка не має прокручуватись під пальцем
        const blockScroll = touchEvent => {
            if (current.dragging && touchEvent.cancelable) touchEvent.preventDefault()
        }

        window.addEventListener("pointermove", handleMove)
        window.addEventListener("pointerup", handleUp)
        window.addEventListener("pointercancel", finish)
        document.addEventListener("touchmove", blockScroll, { passive: false })
        current.detach = () => {
            window.removeEventListener("pointermove", handleMove)
            window.removeEventListener("pointerup", handleUp)
            window.removeEventListener("pointercancel", finish)
            document.removeEventListener("touchmove", blockScroll)
        }

        if (needsHold) current.timer = setTimeout(() => startDragging(current), HOLD_MS)
        gesture.current = current
    }, [finish, moveGhost, onDrop, startDragging])

    useEffect(() => finish, [finish])

    // Позиція ставиться до малювання, інакше примара на кадр блимає в лівому верхньому куті
    useLayoutEffect(() => {
        if (ghost && gesture.current) moveGhost(gesture.current)
    }, [ghost, moveGhost])

    const suppressClickAfterDrag = useCallback(event => {
        if (skipClick.current) event.stopPropagation()
    }, [])

    return { ghost, ghostNode, over, begin, suppressClickAfterDrag }
}

export default useItemDrag
