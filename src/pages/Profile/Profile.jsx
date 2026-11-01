import "./Profile.scss"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { CoinIcon } from "../../utils/icons"
import { useUserContext } from "../../context/UserContext"
import { has24HoursPassed, getRemainingTime } from "../../utils/convertTime"
import { formatNumber } from "../../utils/format"
import { haptic } from "../../utils/telegram"
import ServerImage from "../../components/ServerImage/ServerImage"
import Banner from "../../components/Banner/Banner"
import { gameName, itemName, t } from "../../i18n"

function Avatar({ photo, name }) {
    const [failed, setFailed] = useState(false)
    return (
        <div className="Profile__avatar">
            {photo && !failed
                ? <img src={photo} alt="" onError={() => setFailed(true)} />
                : <span aria-hidden="true">{Array.from(name)[0].toUpperCase()}</span>}
        </div>
    )
}

function Stat({ icon, label, value, accent }) {
    return (
        <div className="Profile__stat mc-panel">
            <span className="Profile__stat-icon">{icon}</span>
            <div className="Profile__stat-text">
                <strong className={accent ? `Profile__stat-value--${accent}` : undefined}>{value}</strong>
                <span>{label}</span>
            </div>
        </div>
    )
}

function Profile() {
    const { user, inventory, stations, userBlocks, handleClaimAward, getFirstBlock, loadMobs } = useUserContext()
    const [mobs, setMobs] = useState(null)
    const [now, setNow] = useState(() => Date.now())
    const [isClaiming, setIsClaiming] = useState(false)
    const [isGettingBlock, setIsGettingBlock] = useState(false)
    const [message, setMessage] = useState("")
    const [reward, setReward] = useState(0)
    const [loot, setLoot] = useState([])

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        let cancelled = false
        loadMobs().then(result => {
            if (!cancelled && result.success) setMobs(result.mobs)
        })
        return () => { cancelled = true }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- статистика читається при відкритті профілю
    }, [])

    const bonusReady = !user.lastAwardTime || has24HoursPassed(user.lastAwardTime, now)
    const name = user.firstName || user.username || t("Гравець")
    const { level, coinsPerTap, cost } = user.upgrade
    const { experience } = user.loadout
    const percent = Math.min(100, user.balance / cost * 100)
    const itemsCount = (inventory?.items ?? []).reduce((sum, stack) => sum + stack.quantity, 0)
    const ownedStations = stations.filter(station => station.owned).length
    const myMobs = (mobs ?? []).filter(mob => (mob.owned && !mob.boss) || mob.kills > 0).sort((left, right) => right.kills - left.kills)

    const claim = async () => {
        if (isClaiming) return
        setIsClaiming(true)
        setMessage("")
        const before = user.balance
        const result = await handleClaimAward()
        setIsClaiming(false)
        if (result.success) {
            setReward(result.user.balance - before)
            setLoot(result.loot ?? [])
            haptic("success")
        } else {
            setMessage(result.message)
            haptic("error")
        }
    }

    const takeFirstBlock = async () => {
        if (isGettingBlock) return
        setIsGettingBlock(true)
        setMessage("")
        const result = await getFirstBlock()
        setIsGettingBlock(false)
        if (!result.success) setMessage(result.message)
    }

    return (
        <main id="Profile">
            <section className="Profile__card mc-panel">
                <div className="Profile__banner" aria-hidden="true" />
                {user.profileBanner?.base && <div className="Profile__flag" role="img" aria-label={t("Мій банер")}>
                    <span className="Profile__flag-pole" />
                    <Banner base={user.profileBanner.base} layers={user.profileBanner.patterns} />
                </div>}
                <div className="Profile__identity">
                    <Avatar photo={user.photo} name={name} />
                    <div className="Profile__names">
                        <h1>{name}</h1>
                        {user.username && <p>@{user.username}</p>}
                        <p className="Profile__id">ID {user.telegramId}</p>
                    </div>
                </div>
                <div className="Profile__level">
                    <div className="Profile__level-row">
                        <strong>{t("Рівень {level}", { level })}</strong>
                        <span>{formatNumber(Math.min(user.balance, cost))} / {formatNumber(cost)}</span>
                    </div>
                    <div className={`mc-xp${user.balance >= cost ? " mc-xp--full" : ""}`} role="progressbar" aria-label={t("Прогрес до покращення")} aria-valuemin={0} aria-valuemax={cost} aria-valuenow={Math.min(user.balance, cost)}>
                        <i style={{ width: `${percent}%` }} />
                    </div>
                    <div className="Profile__level-row">
                        <strong>{t("Рівень досвіду {level}", { level: experience.level })}</strong>
                        <span>{t("Досвід: {xp}", { xp: formatNumber(experience.points) })}</span>
                    </div>
                    <div className="mc-xp" role="progressbar" aria-label={t("Рівень досвіду {level}", { level: experience.level })} aria-valuemin={0} aria-valuemax={experience.needed} aria-valuenow={experience.current}>
                        <i style={{ width: `${experience.current / experience.needed * 100}%` }} />
                    </div>
                </div>
            </section>

            <section className="Profile__stats" aria-label={t("Статистика")}>
                <Stat icon={<CoinIcon />} label={t("Монети")} value={formatNumber(user.balance)} accent="gold" />
                <Stat icon={<ServerImage imgSrc="/items/experience_bottle.png" />} label={t("За тап")} value={`+${coinsPerTap}`} accent="xp" />
                <Stat icon={<ServerImage imgSrc="/items/grass_block.png" />} label={t("Блоки")} value={formatNumber(userBlocks.length)} />
                <Stat icon={<ServerImage imgSrc="/items/chest.png" />} label={t("Предмети")} value={formatNumber(itemsCount)} />
                <Stat icon={<ServerImage imgSrc="/items/crafting_table.png" />} label={t("Верстаки")} value={`${ownedStations}/${stations.length}`} />
            </section>

            <section className={`Profile__bonus mc-panel${bonusReady ? " Profile__bonus--ready" : ""}`}>
                <span className="Profile__chest" key={String(bonusReady)}>
                    <ServerImage imgSrc={bonusReady ? "/items/chest.png" : "/items/ender_chest.png"} />
                </span>
                <div className="Profile__bonus-text">
                    <h2>{t("Щоденна нагорода")}</h2>
                    {bonusReady
                        ? <p>{t("Скриня вже чекає на тебе")}</p>
                        : <>
                            <p>{t("Наступна нагорода через")}</p>
                            <span className="Profile__timer">{getRemainingTime(user.lastAwardTime, now)}</span>
                        </>}
                </div>
                {bonusReady && <button className="mc-btn mc-btn--gold Profile__claim" onClick={claim} disabled={isClaiming}>{t("Забрати")}</button>}
                {loot.length > 0 && <div className="Profile__loot" aria-label={t("Отримано")}>
                    {loot.map(({ slug, quantity }) => (
                        <span key={slug}><ServerImage imgSrc={`/items/${slug}.png`} alt="" />×{quantity}</span>
                    ))}
                </div>}
                {reward > 0 && <span className="Profile__reward" key={reward} onAnimationEnd={() => setReward(0)}>+{formatNumber(reward)}</span>}
            </section>

            {message && <p className="Profile__message" role="alert">{message}</p>}

            <section className="Profile__blocks">
                <div className="Profile__blocks-head">
                    <h2>{t("Мої блоки")}</h2>
                    {userBlocks.length > 0 && <Link to="/game" className="mc-btn mc-btn--small">{t("До гри")}</Link>}
                </div>
                {userBlocks.length > 0
                    ? <div className="Profile__blocks-grid">
                        {userBlocks.map((block, index) => (
                            <article key={block._id} className="Profile__block" style={{ animationDelay: `${Math.min(index, 12) * 25}ms` }}>
                                <ServerImage imgSrc={block.icon} alt="" />
                                <h3>{itemName(block)}</h3>
                                <span>{t("Тапів на блок: {count}", { count: block.tapsToBreak })}</span>
                            </article>
                        ))}
                    </div>
                    : <div className="Profile__empty mc-panel">
                        <p>{t("У тебе ще немає блоків. Отримай перший і починай тапати.")}</p>
                        <button onClick={takeFirstBlock} className="mc-btn mc-btn--green mc-btn--block" disabled={isGettingBlock}>{t("Отримати перший блок")}</button>
                    </div>}
            </section>

            <section className="Profile__blocks">
                <div className="Profile__blocks-head">
                    <h2>{t("Мої моби")}</h2>
                    {myMobs.length > 0 && <Link to="/game" className="mc-btn mc-btn--small">{t("До гри")}</Link>}
                </div>
                {myMobs.length > 0 && <div className="Profile__blocks-grid">
                    {myMobs.map((mob, index) => (
                        <article key={mob.slug} className={`Profile__block${mob.boss ? " Profile__block--boss" : ""}`} style={{ animationDelay: `${Math.min(index, 12) * 25}ms` }}>
                            <ServerImage imgSrc={mob.icon} alt="" />
                            <h3>{gameName("mobs", mob.slug, mob.name)}</h3>
                            <span>{t("Вбито: {count}", { count: formatNumber(mob.kills) })}</span>
                        </article>
                    ))}
                </div>}
            </section>
        </main>
    )
}

export default Profile
