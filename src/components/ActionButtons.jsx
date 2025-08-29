import styles from './ActionButtons.module.css'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router'

export default function ActionButtons({ onSearchClick, onProfileClick, profileInitial = 'U' }) {
    const { user, signOut, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const handleProfileClick = () => {
        if (isAuthenticated) {
            if (onProfileClick) {
                onProfileClick();
            }
        } else {
            navigate('/ecl-reborn/signin');
        }
    };

    const handleSignOut = (e) => {
        e.stopPropagation();
        signOut();
        navigate('/ecl-reborn');
    };

    const getProfileInitial = () => {
        if (user && user.username) {
            return user.username.charAt(0).toUpperCase();
        }
        return '?';
    };

    return (
        <div className={styles.Actions}>
            <button className={styles.SearchBtn} onClick={onSearchClick}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
            </button>
            {isAuthenticated ? (
                <div className={styles.ProfileContainer}>
                    <button className={styles.ProfileBtn} onClick={handleProfileClick}>
                        <div className={styles.ProfileAvatar}>
                            <span>{getProfileInitial()}</span>
                        </div>
                        <div className={`${styles.OnlineIndicator} ${styles.Online}`}></div>
                    </button>
                    <button className={styles.SignOutBtn} onClick={handleSignOut} title="Sign Out">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <polyline points="16,17 21,12 16,7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                </div>
            ) : (
                <button className={styles.SignInBtn} onClick={() => navigate('/ecl-reborn/signin')}>
                    Sign In
                </button>
            )}
        </div>
    )
}