import styles from './Logo.module.css'
import LogoImage from '../assets/Logo.png'

export default function Logo({ onClick, className = '' }) {
    return (
        <button
            className={`${styles.LogoSection} ${className}`}
            onClick={onClick}
            aria-label="Go to home page"
        >
            <div className={styles.LogoWrapper}>
                <div className={styles.LogoGlow}>
                    <img src={LogoImage} alt="Eclipse Challenge List" className={styles.Logo} />
                </div>
            </div>
            <div className={styles.BrandText} aria-hidden="true">
                <span className={styles.BrandMain}>Eclipse</span>
                <span className={styles.BrandSub}>Challenge List</span>
            </div>
        </button>
    )
}