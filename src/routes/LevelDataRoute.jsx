import { useLoaderData, useNavigate, Link } from 'react-router'
import { getLevels } from '../lib/levelUtils'
import { supabaseOperations } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useAdmin } from '../hooks/useAdmin'
import styles from './LevelDataRoute.module.css'

export const levelDataLoader = async ({ params, request }) => {
    try {
        // Check if request was aborted before starting
        if (request.signal.aborted) {
            return {
                error: null,
                placement: params.placement,
                level: null,
                completedBy: [],
                totalLevels: 0
            }
        }

        const placement = parseInt(params.placement, 10)

        if (isNaN(placement) || placement < 1) {
            return {
                error: 'Invalid placement number',
                placement: params.placement,
                level: null,
                completedBy: [],
                totalLevels: 0
            }
        }

        // Fetch all levels
        const allLevels = await getLevels()

        // Check if request was aborted after fetching levels
        if (request.signal.aborted) {
            return {
                error: null,
                placement: params.placement,
                level: null,
                completedBy: [],
                totalLevels: 0
            }
        }

        const level = allLevels.find(l => l.placement === placement)

        if (!level) {
            return {
                error: 'Level not found',
                placement,
                level: null,
                completedBy: [],
                totalLevels: allLevels.length
            }
        }

        // Fetch users who completed this level
        let completedBy = []
        try {
            const users = await supabaseOperations.getUsersWhoCompletedLevel(level.id)

            // Check if request was aborted after fetching users
            if (request.signal.aborted) {
                return {
                    error: null,
                    placement: params.placement,
                    level: null,
                    completedBy: [],
                    totalLevels: 0
                }
            }

            completedBy = users.map((user, index) => {
                // Find the completion entry for this specific level
                const completionEntry = user.completed_levels?.find(entry => String(entry.lvl) === String(level.id))
                return {
                    userId: user.user_id,
                    username: user.username || 'Unknown User',
                    avatar: user.avatar,
                    completedOn: completionEntry?.completedAt || user.updated_at,
                    online: user.online
                }
            })
            // Sort by completion date, most recent first
            completedBy.sort((a, b) => new Date(b.completedOn) - new Date(a.completedOn))
            console.log(`✅ Found ${completedBy.length} users who completed this level`)
        } catch (error) {
            if (!request.signal.aborted) {
                console.warn('Could not fetch users who completed this level:', error)
            }
        }

        return {
            placement,
            level,
            completedBy,
            totalLevels: allLevels.length,
            error: null
        }
    } catch (error) {
        // Don't log errors if the request was aborted
        if (!request.signal.aborted) {
            console.error('Failed to load level data:', error)
        }
        return {
            error: request.signal.aborted ? null : error.message,
            placement: params.placement,
            level: null,
            completedBy: [],
            totalLevels: 0
        }
    }
}

export default function LevelDataRoute() {
    const { placement, level, completedBy, totalLevels, error } = useLoaderData()
    const navigate = useNavigate()
    const { isAuthenticated } = useAuth()
    const { isAdmin } = useAdmin()

    const isFirstLevel = placement === 1
    const isLastLevel = placement === totalLevels

    const goToFirst = () => navigate('/level/1')
    const goToPrevious = () => navigate(`/level/${placement - 1}`)
    const goToNext = () => navigate(`/level/${placement + 1}`)
    const goToLast = () => navigate(`/level/${totalLevels}`)

    if (error) {
        return (
            <div className={styles.levelContainer}>
                <div className={styles.errorCard}>
                    <h2>Error</h2>
                    <p>{error}</p>
                    <button onClick={() => navigate('/challenges')} className={styles.backBtn}>
                        Back to Challenges
                    </button>
                </div>
            </div>
        )
    }

    if (!level) {
        return (
            <div className={styles.levelContainer}>
                <div className={styles.errorCard}>
                    <h2>Level Not Found</h2>
                    <p>No level found at placement #{placement}</p>
                    <button onClick={() => navigate('/challenges')} className={styles.backBtn}>
                        Back to Challenges
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.levelContainer}>
            {/* Navigation Controls */}
            <div className={styles.navigationBar}>
                <button
                    onClick={goToFirst}
                    disabled={isFirstLevel}
                    className={`${styles.navBtn} ${isFirstLevel ? styles.disabled : ''}`}
                    title="First level"
                >
                    ⟪
                </button>
                <button
                    onClick={goToPrevious}
                    disabled={isFirstLevel}
                    className={`${styles.navBtn} ${isFirstLevel ? styles.disabled : ''}`}
                    title="Previous level"
                >
                    ‹
                </button>
                <span className={styles.navInfo}>
                    Level {placement} of {totalLevels}
                </span>
                <button
                    onClick={goToNext}
                    disabled={isLastLevel}
                    className={`${styles.navBtn} ${isLastLevel ? styles.disabled : ''}`}
                    title="Next level"
                >
                    ›
                </button>
                <button
                    onClick={goToLast}
                    disabled={isLastLevel}
                    className={`${styles.navBtn} ${isLastLevel ? styles.disabled : ''}`}
                    title="Last level"
                >
                    ⟫
                </button>
            </div>

            {/* YouTube Video First */}
            {level.youtubeVideoId && (
                <div className={styles.videoSection}>
                    <div className={styles.videoWrapper}>
                        <iframe
                            src={`https://www.youtube.com/embed/${level.youtubeVideoId}`}
                            title={level.levelName}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className={styles.videoFrame}
                        />
                    </div>
                </div>
            )}

            {/* Compact Header Section Below Video */}
            <div className={styles.levelHeader}>
                <div className={styles.headerTop}>
                    <div className={styles.placementBadge}>#{level.placement}</div>
                    <h1 className={styles.levelTitle}>{level.levelName}</h1>
                </div>

                <div className={styles.metadataGrid}>
                    <div className={styles.metadataItem}>
                        <span className={styles.metaLabel}>Creator</span>
                        <span className={styles.metaValue}>{level.creator}</span>
                    </div>
                    {level.verifier && (
                        <div className={styles.metadataItem}>
                            <span className={styles.metaLabel}>Verifier</span>
                            <span className={styles.metaValue}>{level.verifier}</span>
                        </div>
                    )}
                    <div className={styles.metadataItem}>
                        <span className={styles.metaLabel}>Points</span>
                        <span className={styles.metaValue}>{level.points}</span>
                    </div>
                    {level.tags?.difficulty && (
                        <div className={styles.metadataItem}>
                            <span className={styles.metaLabel}>Difficulty</span>
                            <span className={styles.metaValue}>{level.tags.difficulty}</span>
                        </div>
                    )}
                    {level.tags?.gamemode && (
                        <div className={styles.metadataItem}>
                            <span className={styles.metaLabel}>Gamemode</span>
                            <span className={styles.metaValue}>{level.tags.gamemode}</span>
                        </div>
                    )}
                    {level.tags?.decorationStyle && (
                        <div className={styles.metadataItem}>
                            <span className={styles.metaLabel}>Style</span>
                            <span className={styles.metaValue}>{level.tags.decorationStyle}</span>
                        </div>
                    )}
                </div>

                {/* Extra Tags as inline badges */}
                {level.tags?.extraTags && level.tags.extraTags.length > 0 && (
                    <div className={styles.extraTagsRow}>
                        {level.tags.extraTags.map((tag, index) => (
                            <span key={index} className={styles.inlineBadge}>
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Completed By Table at Bottom - Protected */}
            {isAuthenticated && (
                <div className={styles.completedBySection}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Players Who Completed This Level</h2>
                        {isAdmin && (
                            <button
                                onClick={() => navigate(`/admin/completions?levelId=${level.id}`)}
                                className={styles.addCompletionBtn}
                            >
                                + Add Completion
                            </button>
                        )}
                    </div>

                    {completedBy.length > 0 ? (
                        <div className={styles.tableWrapper}>
                            <table className={styles.completedTable}>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Player</th>
                                        <th>Completed On</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {completedBy.map((player, index) => (
                                        <tr key={player.userId}>
                                            <td>{index + 1}</td>
                                            <td>
                                                <Link to={`/profile/${player.userId}`} className={styles.playerLink}>
                                                    <div className={styles.playerCell}>
                                                        {player.avatar ? (
                                                            <img
                                                                src={`https://cdn.discordapp.com/avatars/${player.userId}/${player.avatar}.png?size=64`}
                                                                alt={player.username}
                                                                className={styles.playerAvatar}
                                                            />
                                                        ) : (
                                                            <div className={styles.playerAvatarPlaceholder}>
                                                                {player.username.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <span className={styles.playerName}>{player.username}</span>
                                                    </div>
                                                </Link>
                                            </td>
                                            <td>{player.completedOn ? new Date(player.completedOn).toLocaleDateString() : 'N/A'}</td>
                                            <td>
                                                <span className={player.online ? styles.statusOnline : styles.statusOffline}>
                                                    {player.online ? '🟢 Online' : '🔴 Offline'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className={styles.noPlayers}>
                            <p>No players have completed this level yet</p>
                        </div>
                    )}
                </div>
            )}

            <div className={styles.actions}>
                <button onClick={() => navigate('/challenges')} className={styles.backBtn}>
                    Back to Challenges
                </button>
            </div>
        </div>
    )
}
