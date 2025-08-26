import styles from './ActionButtons.module.css'

export default function ActionButtons({ onSearchClick, onProfileClick, profileInitial = 'U' }) {
    return (
        <div className={styles.Actions}>
            <button className={styles.SearchBtn} onClick={onSearchClick}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
            </button>
            <button className={styles.ProfileBtn} onClick={onProfileClick}>
                <div className={styles.ProfileAvatar}>
                    <span>{profileInitial}</span>
                </div>
                <div className={styles.OnlineIndicator}></div>
            </button>
        </div>
    )
}