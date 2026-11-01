import { formatLeft, useCountdown } from "./useCountdown"

function EffectBadges({ effects }) {
    const active = useCountdown(effects)
    return active.map(effect => (
        <span key={effect.id} className="Tap__effect">
            <img src={`/assets/effects/${effect.id}.png`} alt="" />
            {formatLeft(effect.left)}
        </span>
    ))
}

export default EffectBadges
