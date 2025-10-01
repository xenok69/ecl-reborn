import { useLoaderData } from 'react-router'
import { supabaseOperations } from '../lib/supabase'
import { getLevels } from '../lib/levelUtils'
import styles from './UserProfileRoute.module.css'

export const userProfileLoader = async ({ params }) => {
    await new Promise(resolve => setTimeout(resolve, 500))

    try {
        const userId = params.userId

        // Fetch user activity data
        const userActivity = await supabaseOperations.getUserActivity(userId)

        if (!userActivity) {
            return {
                error: 'User not found',
                userId,
                user: null,
                completedLevels: []
            }
        }

        // Fetch all levels to get details of completed levels
        const allLevels = await getLevels()
        const completedLevelIds = userActivity.completed_levels || []

        console.log('🔍 Debug - Completed Level IDs from DB:', completedLevelIds)
        console.log('🔍 Debug - Sample level IDs:', allLevels.slice(0, 3).map(l => l.id))

        // Match levels by their ID field
        const completedLevels = allLevels.filter(level => {
            // Convert both to strings for comparison since completed_levels might be stored as strings or numbers
            const levelId = String(level.id)
            return completedLevelIds.some(completedId => String(completedId) === levelId)
        })

        console.log('✅ Debug - Matched Completed Levels:', completedLevels.length, completedLevels.map(l => l.levelName))

        return {
            userId,
            user: userActivity,
            completedLevels,
            error: null
        }
    } catch (error) {
        console.error('Failed to load user profile:', error)
        return {
            error: error.message,
            userId: params.userId,
            user: null,
            completedLevels: []
        }
    }
}

export default function UserProfileRoute() {
    const { userId, user, completedLevels, error } = useLoaderData()

    // Helper to get Discord avatar URL
    const getAvatarUrl = (userId, avatarHash) => {
        if (!avatarHash) return null
        return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png?size=256`
    }

    if (error) {
        return (
            <div className={styles.profileContainer}>
                <div className={styles.errorCard}>
                    <h2>Error</h2>
                    <p>{error}</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className={styles.profileContainer}>
                <div className={styles.errorCard}>
                    <h2>User Not Found</h2>
                    <p>No activity found for user ID: {userId}</p>
                </div>
            </div>
        )
    }

    const displayName = user.username || 'Unknown User'
    const avatarUrl = getAvatarUrl(userId, user.avatar)

    return (
        <div className={styles.profileContainer}>
            <div className={styles.header}>
                <h1 className={styles.title}>User Profile</h1>
            </div>

            <div className={styles.profileContent}>
                {/* Left side - User Info */}
                <div className={styles.userInfoCard}>
                    <div className={styles.avatarSection}>
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt={displayName}
                                className={styles.avatar}
                            />
                        ) : (
                            <div className={styles.avatarPlaceholder}>
                                {displayName.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>

                    <h2 className={styles.displayName}>{displayName}</h2>
                    <p className={styles.userId}>ID: {userId}</p>

                    <div className={styles.statsGrid}>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{completedLevels.length}</span>
                            <span className={styles.statLabel}>Completed Levels</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>
                                {user.online ? '🟢 Online' : '🔴 Offline'}
                            </span>
                            <span className={styles.statLabel}>Status</span>
                        </div>
                    </div>

                    {user.last_online && (
                        <p className={styles.lastOnline}>
                            Last online: {new Date(user.last_online).toLocaleString()}
                        </p>
                    )}
                </div>

                {/* Right side - Completed Levels */}
                <div className={styles.completedLevelsCard}>
                    <h3 className={styles.sectionTitle}>Completed Levels</h3>

                    {completedLevels.length > 0 ? (
                        <div className={styles.levelsGrid}>
                            {completedLevels.map((level) => (
                                <div key={level.id} className={styles.levelCard}>
                                    <div className={styles.levelHeader}>
                                        <span className={styles.placement}>#{level.placement}</span>
                                        <span className={styles.points}>{level.points} pts</span>
                                    </div>
                                    <h4 className={styles.levelName}>{level.levelName}</h4>
                                    <p className={styles.levelCreator}>by {level.creator}</p>
                                    {level.tags && (
                                        <div className={styles.tags}>
                                            {level.tags.difficulty && (
                                                <span className={`${styles.tag} ${styles.difficultyTag}`}>
                                                    {level.tags.difficulty}
                                                </span>
                                            )}
                                            {level.tags.gamemode && (
                                                <span className={`${styles.tag} ${styles.gamemodeTag}`}>
                                                    {level.tags.gamemode}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.noLevels}>
                            <p>No completed levels yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
