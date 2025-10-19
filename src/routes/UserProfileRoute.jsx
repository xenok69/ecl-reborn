import { useLoaderData, Link } from 'react-router'
import { supabaseOperations } from '../lib/supabase'
import { getLevels } from '../lib/levelUtils'
import { getUserCompletedPacks, calculateUserPackPoints } from '../lib/packUtils'
import styles from './UserProfileRoute.module.css'

export const userProfileLoader = async ({ params, request }) => {
    try {
        // Check if request was aborted before starting
        if (request.signal.aborted) {
            return {
                error: null,
                userId: params.userId,
                user: null,
                completedLevels: [],
                totalPoints: 0,
                leaderboardRank: null
            }
        }

        const userId = params.userId

        if (!userId) {
            return {
                error: 'Invalid user ID',
                userId,
                user: null,
                completedLevels: [],
                totalPoints: 0,
                leaderboardRank: null
            }
        }

        // Fetch user activity and levels in parallel to avoid race conditions
        const [userActivity, allLevels] = await Promise.all([
            supabaseOperations.getUserActivity(userId),
            getLevels()
        ])

        // Check if request was aborted after initial fetches
        if (request.signal.aborted) {
            return {
                error: null,
                userId,
                user: null,
                completedLevels: [],
                completedPacks: [],
                levelPoints: 0,
                packPoints: 0,
                totalPoints: 0,
                leaderboardRank: null
            }
        }

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

        const completedLevelData = userActivity.completed_levels || []

        console.log('🔍 Debug - Completed Level Data from DB:', completedLevelData)
        console.log('🔍 Debug - Sample level IDs:', allLevels.slice(0, 3).map(l => l.id))

        // Match levels by their ID field and add YouTube link from completed_levels
        const completedLevels = allLevels
            .filter(level => {
                const levelId = String(level.id)
                return completedLevelData.some(entry => String(entry.lvl) === levelId)
            })
            .map(level => {
                // Find the completion entry to get YouTube link
                const completionEntry = completedLevelData.find(entry => String(entry.lvl) === String(level.id))
                return {
                    ...level,
                    youtubeLink: completionEntry?.yt || null,
                    completedAt: completionEntry?.completedAt || null
                }
            })

        console.log('✅ Debug - Matched Completed Levels:', completedLevels.length, completedLevels.map(l => l.levelName))

        // Clean up invalid level IDs (levels that don't exist in the list anymore)
        const validLevelIds = new Set(allLevels.map(l => String(l.id)))
        const cleanedLevelData = completedLevelData.filter(entry => validLevelIds.has(String(entry.lvl)))

        // If there are invalid levels, update the database to remove them
        if (cleanedLevelData.length !== completedLevelData.length) {
            const removedCount = completedLevelData.length - cleanedLevelData.length
            console.log(`🧹 Cleaning up ${removedCount} invalid level(s) from user's completed levels`)

            try {
                await supabaseOperations.updateUserActivity(userId, {
                    completed_levels: cleanedLevelData
                })
                console.log('✅ Invalid levels cleaned up successfully')
            } catch (cleanupError) {
                console.error('⚠️ Failed to clean up invalid levels:', cleanupError)
                // Don't fail the entire request if cleanup fails
            }
        }

        // Calculate total points from completed levels
        const levelPoints = completedLevels.reduce((sum, level) => sum + (level.points || 0), 0)

        // Get completed packs and pack bonus points
        let completedPacks = []
        let packPoints = 0
        try {
            completedPacks = await getUserCompletedPacks(userId)
            packPoints = await calculateUserPackPoints(userId)
            console.log(`✅ User has completed ${completedPacks.length} pack(s) for ${packPoints} bonus points`)
        } catch (error) {
            if (!request.signal.aborted) {
                console.warn('Could not fetch user pack data:', error)
            }
        }

        const totalPoints = levelPoints + packPoints

        // Calculate leaderboard rank
        // Get all users and calculate their points to determine rank
        let leaderboardRank = null
        try {
            const { data: allUsers } = await supabaseOperations.supabase
                .from('user_activity')
                .select('user_id, completed_levels')

            // Check if request was aborted after fetching users
            if (request.signal.aborted) {
                return {
                    error: null,
                    userId,
                    user: null,
                    completedLevels: [],
                    totalPoints: 0,
                    leaderboardRank: null
                }
            }

            if (allUsers) {
                // Calculate points for each user
                const userScores = allUsers.map(user => {
                    const userCompletedData = user.completed_levels || []
                    const userCompletedLevels = allLevels.filter(level =>
                        userCompletedData.some(entry => String(entry.lvl) === String(level.id))
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
            if (!request.signal.aborted) {
                console.warn('Could not calculate leaderboard rank:', error)
            }
        }

        return {
            userId,
            user: userActivity,
            completedLevels,
            completedPacks,
            levelPoints,
            packPoints,
            totalPoints,
            leaderboardRank,
            error: null
        }
    } catch (error) {
        // Don't log errors if the request was aborted
        if (!request.signal.aborted) {
            console.error('Failed to load user profile:', error)
        }
        return {
            error: request.signal.aborted ? null : error.message,
            userId: params.userId,
            user: null,
            completedLevels: [],
            completedPacks: [],
            levelPoints: 0,
            packPoints: 0,
            totalPoints: 0,
            leaderboardRank: null
        }
    }
}

export default function UserProfileRoute() {
    const { userId, user, completedLevels, completedPacks, levelPoints, packPoints, totalPoints, leaderboardRank, error } = useLoaderData()

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
                            <span className={styles.statValue}>{completedPacks.length}</span>
                            <span className={styles.statLabel}>Completed Packs</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{levelPoints}</span>
                            <span className={styles.statLabel}>Level Points</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>+{packPoints}</span>
                            <span className={styles.statLabel}>Pack Bonus</span>
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
                                                {level.youtubeLink && (
                                                    <a
                                                        href={level.youtubeLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={styles.youtubeButton}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        Watch Video
                                                    </a>
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

                    {/* Completed Packs Section */}
                    {completedPacks.length > 0 && (
                        <>
                            <h3 className={styles.sectionTitle}>Completed Packs</h3>
                            <div className={styles.packsList}>
                                {completedPacks.map((pack) => (
                                    <Link
                                        key={pack.id}
                                        to="/packs"
                                        className={styles.packCard}
                                    >
                                        <div className={styles.packCardContent}>
                                            <div className={styles.packCardHeader}>
                                                <h4 className={styles.packName}>{pack.name}</h4>
                                                <span className={styles.packCategory}>{pack.category}</span>
                                            </div>
                                            {pack.description && (
                                                <p className={styles.packDescription}>{pack.description}</p>
                                            )}
                                            <div className={styles.packMeta}>
                                                <span className={styles.packLevelCount}>
                                                    {pack.levelCount} level{pack.levelCount !== 1 ? 's' : ''}
                                                </span>
                                                <span className={styles.packPoints}>
                                                    +{pack.bonus_points} points
                                                </span>
                                            </div>
                                            <div className={styles.packCompletedDate}>
                                                Completed: {new Date(pack.completedAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
