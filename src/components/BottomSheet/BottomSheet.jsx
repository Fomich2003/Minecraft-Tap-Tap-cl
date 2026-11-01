import "./BottomSheet.scss"
import { useEffect, useRef } from "react"
import { t } from "../../i18n"

function BottomSheet({ open, onClose, label, title, children }) {
    const closeButton = useRef(null)

    // Після закриття фокус повертається на кнопку, якою шторку відкрили
    useEffect(() => {
        if (!open) return
        const opener = document.activeElement
        closeButton.current?.focus({ preventScroll: true })
        return () => {
            if (opener instanceof HTMLElement) opener.focus({ preventScroll: true })
        }
    }, [open])

    useEffect(() => {
        if (!open) return
        const closeOnEscape = event => { if (event.key === "Escape") onClose() }
        document.addEventListener("keydown", closeOnEscape)
        return () => document.removeEventListener("keydown", closeOnEscape)
    }, [open, onClose])

    return (
        <div className={`BottomSheet${open ? " BottomSheet--opened" : ""}`}>
            <button className="BottomSheet__backdrop" onClick={onClose} aria-label={t("Закрити: {name}", { name: label })} tabIndex={-1} />
            <div className="BottomSheet__wrapper" role="dialog" aria-modal="true" aria-label={label}>
                <div className="BottomSheet__header">
                    <h2 className="BottomSheet__title">{title ?? label}</h2>
                    <button ref={closeButton} onClick={onClose} className="BottomSheet__close" aria-label={t("Закрити")}>×</button>
                </div>
                <div className="BottomSheet__content">
                    {children}
                </div>
            </div>
        </div>
    )
}

export default BottomSheet
