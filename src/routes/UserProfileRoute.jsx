import { useLoaderData, Link } from 'react-router'
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
                completedLevels: [],
                totalPoints: 0,
                leaderboardRank: null
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

        // Calculate total points from completed levels
        const totalPoints = completedLevels.reduce((sum, level) => sum + (level.points || 0), 0)

        // Calculate leaderboard rank
        // Get all users and calculate their points to determine rank
        let leaderboardRank = null
        try {
            const { data: allUsers } = await supabaseOperations.supabase
                .from('user_activity')
                .select('user_id, completed_levels')

            if (allUsers) {
                // Calculate points for each user
                const userScores = allUsers.map(user => {
                    const userCompletedLevels = allLevels.filter(level =>
                        (user.completed_levels || []).some(id => String(id) === String(level.id))
                    )
                    const points = userCompletedLevels.reduce((sum, level) => sum + (level.points || 0), 0)
                    return {
                        userId: user.user_id,
                        points
                    }
                })

                // Sort by points descending
                userScores.sort((a, b) => b.points - a.points)

                // Find rank (1-indexed)
                const rankIndex = userScores.findIndex(u => u.userId === userId)
                if (rankIndex !== -1) {
                    leaderboardRank = rankIndex + 1
                }
            }
        } catch (error) {
            console.warn('Could not calculate leaderboard rank:', error)
        }

        return {
            userId,
            user: userActivity,
            completedLevels,
            totalPoints,
            leaderboardRank,
            error: null
        }
    } catch (error) {
        console.error('Failed to load user profile:', error)
        return {
            error: error.message,
            userId: params.userId,
            user: null,
            completedLevels: [],
            totalPoints: 0,
            leaderboardRank: null
        }
    }
}

export default function UserProfileRoute() {
    const { userId, user, completedLevels, totalPoints, leaderboardRank, error } = useLoaderData()

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
                            <span className={styles.statValue}>{totalPoints}</span>
                            <span className={styles.statLabel}>Total Points</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>
                                {leaderboardRank ? `#${leaderboardRank}` : 'N/A'}
                            </span>
                            <span className={styles.statLabel}>Global Rank</span>
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
                        <div className={styles.levelsList}>
                            {completedLevels.map((level) => {
                                const thumbnailUrl = level.youtubeVideoId
                                    ? `https://img.youtube.com/vi/${level.youtubeVideoId}/maxresdefault.jpg`
                                    : null

                                return (
                                    <Link
                                        key={level.id}
                                        to={`/level/${level.placement}`}
                                        className={styles.levelListItem}
                                    >
                                        {thumbnailUrl && (
                                            <div className={styles.levelThumbnail}>
                                                <img src={thumbnailUrl} alt={level.levelName} className={styles.thumbnailImage} />
                                                <div className={styles.thumbnailGradient}></div>
                                            </div>
                                        )}
                                        <div className={styles.textFog}></div>
                                        <div className={styles.levelListContent}>
                                            <div className={styles.levelListLeft}>
                                                <span className={styles.levelListPlacement}>#{level.placement}</span>
                                                <div className={styles.levelListInfo}>
                                                    <h4 className={styles.levelListName}>{level.levelName}</h4>
                                                    <p className={styles.levelListCreator}>by {level.creator}</p>
                                                </div>
                                            </div>
                                            <div className={styles.levelListRight}>
                                                <span className={styles.levelListPoints}>{level.points} pts</span>
                                                {level.tags && (
                                                    <div className={styles.levelListTags}>
                                                        {level.tags.difficulty && (
                                                            <span className={styles.levelListTag}>
                                                                {level.tags.difficulty}
                                                            </span>
                                                        )}
                                                        {level.tags.gamemode && (
                                                            <span className={styles.levelListTag}>
                                                                {level.tags.gamemode}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })}
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
