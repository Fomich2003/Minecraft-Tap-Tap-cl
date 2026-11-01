import BottomSheet from "../../components/BottomSheet/BottomSheet"
import { CoinIcon } from "../../utils/icons"
import { useUserContext } from "../../context/UserContext"
import { formatNumber } from "../../utils/format"
import { t } from "../../i18n"

function UpgradeSheet({ open, onClose, onConfirm, busy, message }) {
    const { user } = useUserContext()
    const { level, coinsPerTap, nextCoinsPerTap, cost } = user.upgrade
    const missing = cost - user.balance
    const ready = missing <= 0
    const percent = Math.min(100, user.balance / cost * 100)

    return (
        <BottomSheet open={open} onClose={onClose} label={t("Покращення тапа")}>
            <div className="Upgrade">
                {message && <p className="BottomSheet__message">{message}</p>}

                <div className="Upgrade__levels">
                    <div className="Upgrade__level">
                        <span>{t("Рівень {level}", { level })}</span>
                        <strong>+{coinsPerTap}</strong>
                        <small>{t("за тап")}</small>
                    </div>
                    <span className="Upgrade__arrow" aria-hidden="true">▶</span>
                    <div className="Upgrade__level Upgrade__level--next">
                        <span>{t("Рівень {level}", { level: level + 1 })}</span>
                        <strong>+{nextCoinsPerTap}</strong>
                        <small>{t("за тап")}</small>
                    </div>
                </div>

                <div className="Upgrade__progress">
                    <div className="Upgrade__cost">
                        <span>{t("Потрібно монет")}</span>
                        <strong><CoinIcon /> {formatNumber(user.balance)} / {formatNumber(cost)}</strong>
                    </div>
                    <div className={`mc-xp${ready ? " mc-xp--full" : ""}`}><i style={{ width: `${percent}%` }} /></div>
                </div>

                <ul className="Upgrade__rules">
                    <li>{t("Діє одразу на всі блоки")}</li>
                    <li>{t("Інвентар, блоки й верстаки залишаються")}</li>
                    <li className="Upgrade__rule--warn">{t("Усі монети скинуться до 0")}</li>
                </ul>

                <button className="mc-btn mc-btn--gold mc-btn--block Upgrade__confirm" disabled={!ready || busy} onClick={onConfirm}>
                    {busy ? t("Покращуємо...") : ready ? <><CoinIcon /> {t("Скинути {amount} і покращити", { amount: formatNumber(user.balance) })}</> : <><CoinIcon /> {t("Бракує {amount}", { amount: formatNumber(missing) })}</>}
                </button>
            </div>
        </BottomSheet>
    )
}

export default UpgradeSheet
