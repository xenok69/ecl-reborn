import styles from './ActionButtons.module.css'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router'
import { useState } from 'react'
import ConfirmationDialog from './ConfirmationDialog'

export default function ActionButtons({ onProfileClick, profileInitial = 'U', navigate: navigateProp }) {
    const { user, signOut, isAuthenticated } = useAuth();
    const navigate = navigateProp || useNavigate();
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

    const handleSearchClick = (e) => {
        e.preventDefault();
        if (isSearchExpanded) {
            // Close the search
            setIsSearchExpanded(false);
            setSearchQuery('');
        } else {
            // Open the search
            setIsSearchExpanded(true);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setIsSearchExpanded(false);
            setSearchQuery('');
        }
    };

    const handleProfileClick = () => {
        if (isAuthenticated) {
            if (onProfileClick) {
                onProfileClick();
            }
        } else {
            navigate('/signin');
        }
    };

    const handleSignOut = (e) => {
        e.stopPropagation();
        setShowSignOutConfirm(true);
    };

    const confirmSignOut = () => {
        setShowSignOutConfirm(false);
        signOut();
        navigate('/');
    };

    const cancelSignOut = () => {
        setShowSignOutConfirm(false);
    };

    const getProfileInitial = () => {
        if (user && user.username) {
            return user.username.charAt(0).toUpperCase();
        }
        return '?';
    };

    const getAvatarUrl = () => {
        if (user && user.id && user.avatar) {
            return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`;
        }
        return null;
    };

    return (
        <>
            <div className={styles.Actions}>
                <form onSubmit={handleSearch} className={`${styles.SearchContainer} ${isSearchExpanded ? styles.Expanded : ''}`}>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users or levels..."
                    className={styles.SearchInput}
                    autoFocus={isSearchExpanded}
                />
                <button
                    type="button"
                    className={styles.SearchBtn}
                    onClick={handleSearchClick}
                >
                    {isSearchExpanded ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    )}
                </button>
            </form>
            {isAuthenticated ? (
                <div className={styles.ProfileContainer}>
                    <button className={styles.ProfileBtn} onClick={handleProfileClick}>
                        <div className={styles.ProfileAvatar}>
                            {getAvatarUrl() ? (
                                <img src={getAvatarUrl()} alt={user?.username || 'Profile'} className={styles.AvatarImage} />
                            ) : (
                                <span>{getProfileInitial()}</span>
                            )}
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
                <button className={styles.SignInBtn} onClick={() => navigate('/signin')}>
                    Sign In
                </button>
            )}
            </div>

            <ConfirmationDialog
                isOpen={showSignOutConfirm}
                title="Sign Out"
                message="Are you sure you want to sign out?"
                onConfirm={confirmSignOut}
                onCancel={cancelSignOut}
                confirmText="Sign Out"
                cancelText="Cancel"
            />
        </>
    )
}