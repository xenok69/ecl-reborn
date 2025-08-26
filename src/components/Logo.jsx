import styles from './Logo.module.css'
import LogoImage from '../assets/Logo.png'

export default function Logo({ onClick }) {
    return (
        <div className={styles.LogoSection} onClick={onClick}>
            <div className={styles.LogoWrapper}>
                <div className={styles.LogoGlow}>
                    <img src={LogoImage} alt="Eclipse Challenge List Logo" className={styles.Logo} />
                </div>
            </div>
            <div className={styles.BrandText}>
                <span className={styles.BrandMain}>Eclipse</span>
                <span className={styles.BrandSub}>Challenge List</span>
            </div>
        </div>
    )
}