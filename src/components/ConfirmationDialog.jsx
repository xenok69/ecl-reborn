import { createPortal } from 'react-dom'
import styles from './ConfirmationDialog.module.css'

export default function ConfirmationDialog({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel' }) {
    if (!isOpen) return null

    return createPortal(
        <div className={styles.Overlay}>
            <div className={styles.Blur} />
            <div className={styles.Dialog}>
                <div className={styles.Content}>
                    <h2 className={styles.Title}>{title}</h2>
                    <p className={styles.Message}>{message}</p>
                </div>
                <div className={styles.Actions}>
                    <button className={styles.CancelBtn} onClick={onCancel}>
                        {cancelText}
                    </button>
                    <button className={styles.ConfirmBtn} onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}
