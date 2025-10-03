import { useState } from 'react'
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
                    youtubeLink: completionEntry?.yt || '',
                    isVerifier: completionEntry?.verifier || false,
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

    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [deleteTimer, setDeleteTimer] = useState(0)

    // Separate verifiers from regular players
    const verifiers = completedBy.filter(player => player.isVerifier)
    const regularPlayers = completedBy.filter(player => !player.isVerifier)

    const isFirstLevel = placement === 1
    const isLastLevel = placement === totalLevels

    const goToFirst = () => navigate('/level/1')
    const goToPrevious = () => navigate(`/level/${placement - 1}`)
    const goToNext = () => navigate(`/level/${placement + 1}`)
    const goToLast = () => navigate(`/level/${totalLevels}`)

    const handleEditCompletion = (player) => {
        // Navigate to admin completions with pre-filled data
        const params = new URLSearchParams({
            edit: 'true',
            userId: player.userId,
            levelId: level.id,
            youtubeLink: player.youtubeLink || '',
            completedAt: player.completedOn || '',
            isVerifier: player.isVerifier ? 'true' : 'false'
        })
        navigate(`/admin/completions?${params.toString()}`)
    }

    const handleDeleteCompletion = (player) => {
        setDeleteConfirm({
            userId: player.userId,
            username: player.username,
            levelId: level.id,
            levelName: level.levelName
        })
        setDeleteTimer(3)

        const countdown = setInterval(() => {
            setDeleteTimer(prev => {
                if (prev <= 1) {
                    clearInterval(countdown)
                    return 0
                }
                return prev - 1
            })
        }, 1000)
    }

    const confirmDeleteCompletion = async () => {
        try {
            const result = await supabaseOperations.removeCompletedLevel(
                deleteConfirm.userId,
                deleteConfirm.levelId
            )
            console.log('Completion deleted successfully:', result)

            alert(`Completion for "${deleteConfirm.username}" on "${deleteConfirm.levelName}" has been deleted!`)

            // Refresh the page to show updated data
            window.location.reload()
        } catch (error) {
            console.error('Error deleting completion:', error)
            alert(`Failed to delete completion: ${error.message}`)
        } finally {
            setDeleteConfirm(null)
            setDeleteTimer(0)
        }
    }

    const cancelDeleteCompletion = () => {
        setDeleteConfirm(null)
        setDeleteTimer(0)
    }

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

                    {regularPlayers.length > 0 ? (
                        <div className={styles.tableWrapper}>
                            <table className={styles.completedTable}>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Player</th>
                                        <th>Completed On</th>
                                        <th>Video</th>
                                        <th>Status</th>
                                        {isAdmin && <th>Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {regularPlayers.map((player, index) => (
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
                                                {player.youtubeLink ? (
                                                    <a
                                                        href={player.youtubeLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={styles.videoLink}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        🎥 Watch
                                                    </a>
                                                ) : (
                                                    <span className={styles.noVideo}>-</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={player.online ? styles.statusOnline : styles.statusOffline}>
                                                    {player.online ? '🟢 Online' : '🔴 Offline'}
                                                </span>
                                            </td>
                                            {isAdmin && (
                                                <td>
                                                    <div className={styles.actionButtons}>
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault()
                                                                handleEditCompletion(player)
                                                            }}
                                                            className={styles.editBtn}
                                                            title="Edit completion"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault()
                                                                handleDeleteCompletion(player)
                                                            }}
                                                            className={styles.deleteBtn}
                                                            title="Delete completion"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
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

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className={styles.DeleteModal}>
                    <div className={styles.DeleteModalContent}>
                        <h3>Delete Completion</h3>
                        <p>
                            Are you sure you want to delete <strong>"{deleteConfirm.username}"</strong>'s completion
                            of <strong>"{deleteConfirm.levelName}"</strong>?
                        </p>
                        <p>This action cannot be undone.</p>
                        <div className={styles.DeleteModalActions}>
                            <button
                                onClick={cancelDeleteCompletion}
                                className={styles.CancelBtn}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteCompletion}
                                disabled={deleteTimer > 0}
                                className={styles.ConfirmDeleteBtn}
                            >
                                {deleteTimer > 0 ? `Wait ${deleteTimer}s` : 'Confirm Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
