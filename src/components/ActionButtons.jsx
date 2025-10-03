import styles from './ActionButtons.module.css'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router'
import { useState, useRef, useEffect } from 'react'
import ConfirmationDialog from './ConfirmationDialog'

export default function ActionButtons({ onProfileClick, profileInitial = 'U', navigate: navigateProp, onSearchToggle, isSearchActive }) {
    const { user, signOut, isAuthenticated } = useAuth();
    const navigate = navigateProp || useNavigate();
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
    const searchInputRef = useRef(null);

    useEffect(() => {
        if (isSearchFocused && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearchFocused]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
            setIsSearchFocused(false);
            onSearchToggle?.(false);
        }
    };

    const handleSearchFocus = () => {
        setIsSearchFocused(true);
        onSearchToggle?.(true);
    };

    const handleSearchBlur = () => {
        if (!searchQuery.trim()) {
            setIsSearchFocused(false);
            onSearchToggle?.(false);
        }
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        setIsSearchFocused(false);
        onSearchToggle?.(false);
    };

    const handleSearchClick = () => {
        setIsSearchFocused(true);
        onSearchToggle?.(true);
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
            <div className={`${styles.Actions} ${isSearchActive ? styles.SearchMode : ''}`}>
                <button
                    type="button"
                    className={`${styles.SearchToggle} ${isSearchFocused ? styles.Hidden : ''}`}
                    onClick={handleSearchClick}
                    aria-label="Open search"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                        <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                </button>

                <form onSubmit={handleSearch} className={`${styles.SearchContainer} ${isSearchFocused ? styles.Focused : ''}`} role="search">
                    <label htmlFor="search-input" className="sr-only">Search users or levels</label>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={styles.SearchIcon} aria-hidden="true">
                        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                        <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <input
                        ref={searchInputRef}
                        id="search-input"
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={handleSearchFocus}
                        onBlur={handleSearchBlur}
                        placeholder="Search..."
                        className={styles.SearchInput}
                        aria-label="Search users or levels"
                    />
                    {(searchQuery || isSearchFocused) && (
                        <button
                            type="button"
                            className={styles.ClearBtn}
                            onClick={handleClearSearch}
                            aria-label="Close search"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </button>
                    )}
                </form>

                {isAuthenticated ? (
                    <div className={`${styles.ProfileContainer} ${isSearchFocused ? styles.Hidden : ''}`}>
                        <button
                            className={styles.ProfileBtn}
                            onClick={handleProfileClick}
                            aria-label={`View profile for ${user?.username || 'user'}`}
                        >
                            <div className={styles.ProfileAvatar}>
                                {getAvatarUrl() ? (
                                    <img src={getAvatarUrl()} alt="" className={styles.AvatarImage} />
                                ) : (
                                    <span aria-hidden="true">{getProfileInitial()}</span>
                                )}
                            </div>
                            <div className={`${styles.OnlineIndicator} ${styles.Online}`} aria-label="Online" role="status"></div>
                        </button>
                        <button
                            className={styles.SignOutBtn}
                            onClick={handleSignOut}
                            aria-label="Sign out"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <polyline points="16,17 21,12 16,7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
                    </div>
                ) : (
                    <button className={`${styles.SignInBtn} ${isSearchFocused ? styles.Hidden : ''}`} onClick={() => navigate('/signin')}>
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