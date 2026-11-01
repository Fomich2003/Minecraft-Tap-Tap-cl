import { useEffect, useMemo, useState } from "react"
import ServerImage from "../../components/ServerImage/ServerImage"
import { formatRemaining } from "../../utils/convertTime"
import { t } from "../../i18n"
import { formatLeft, useCountdown } from "./useCountdown"

// Таймер у власному компоненті: щосекундне оновлення не має перемальовувати всю сторінку тапу
function BossTimer({ expiresAt, onExpire }) {
    const entries = useMemo(() => [{ id: "boss", expiresAt }], [expiresAt])
    const [left] = useCountdown(entries)
    const expired = !left

    useEffect(() => {
        if (expired) onExpire()
        // eslint-disable-next-line react-hooks/exhaustive-deps -- обробник новий на кожен рендер, важливий лише момент завершення
    }, [expired])

    if (!left) return null
    return (
        <span className="Tap__effect" role="timer" aria-label={t("До втечі: {time}", { time: formatLeft(left.left) })}>
            <ServerImage imgSrc="/items/clock.png" alt="" />
            {formatLeft(left.left)}
        </span>
    )
}

function BossAction({ mob, level, isActive, busy, onSummon }) {
    const { boss } = mob
    const [now, setNow] = useState(() => Date.now())

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(timer)
    }, [])

    if (boss.active) return <span className="BottomSheet__owned">{t(isActive ? "Активний" : "Обрати")}</span>
    if (level < mob.location.level) return <span className="BottomSheet__owned">{t("Потрібен рівень досвіду {level}", { level: mob.location.level })}</span>

    const left = boss.readyAt ? new Date(boss.readyAt).getTime() - now : 0
    if (left > 0) return <span className="BottomSheet__owned">{t("Доступно через {time}", { time: formatRemaining(left) })}</span>

    return <button className="mc-btn mc-btn--gold mc-btn--small BottomSheet__buy" disabled={busy} onClick={onSummon}>{t("Призвати")}</button>
}

export { BossAction, BossTimer }
