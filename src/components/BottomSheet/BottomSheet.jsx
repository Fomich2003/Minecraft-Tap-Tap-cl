import "./BottomSheet.scss"

function BottomSheet({ open, onClose, label, children }) {
    return (
        <div className={`BottomSheet ${open ? "BottomSheet--opened" : ""}`}>
            <button className="BottomSheet__backdrop" onClick={onClose} aria-label={`Закрити: ${label}`} />
            <div className={`BottomSheet__wrapper ${open ? "BottomSheet__wrapper--opened" : ""}`} role="dialog" aria-label={label}>
                <button onClick={onClose} className="BottomSheet__close" aria-label="Закрити">×</button>
                {children}
            </div>
        </div>
    )
}

export default BottomSheet
