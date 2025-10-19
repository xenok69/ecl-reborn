import { useState } from 'react'
import { useLoaderData, Link, useNavigate } from 'react-router'
import { getPacksByCategory, getUserPackProgress } from '../lib/packUtils'
import { useAuth } from '../hooks/useAuth'
import { useAdmin } from '../hooks/useAdmin'
import styles from './PacksRoute.module.css'

export const packsLoader = async () => {
    try {
        const packsByCategory = await getPacksByCategory()

        return {
            packsByCategory,
            error: null
        }
    } catch (error) {
        console.error('Failed to load packs:', error)
        return {
            packsByCategory: {},
            error: error.message
        }
    }
}

export default function PacksRoute() {
    const { packsByCategory, error } = useLoaderData()
    const { user } = useAuth()
    const { isAdmin } = useAdmin()
    const navigate = useNavigate()

    // Get first pack as default selection
    const firstCategory = Object.keys(packsByCategory)[0]
    const firstPack = firstCategory ? packsByCategory[firstCategory][0] : null

    const [selectedPack, setSelectedPack] = useState(firstPack)
    const [userProgress, setUserProgress] = useState(null)

    // Load user progress when component mounts
    useState(() => {
        if (user?.id) {
            getUserPackProgress(user.id).then(progress => {
                setUserProgress(progress)
            }).catch(err => {
                console.error('Failed to load user pack progress:', err)
            })
        }
    }, [user?.id])

    // Helper to get progress for a specific pack
    const getPackProgress = (packId) => {
        if (!userProgress) return null
        return userProgress.find(p => p.id === packId)
    }

    // Admin handlers
    const handleEditPack = (packId) => {
        navigate(`/admin/packs/edit/${packId}`)
    }

    const handleDeletePack = (packId) => {
        if (window.confirm('Are you sure you want to delete this pack? This action cannot be undone.')) {
            // Implement delete logic - for now just navigate to admin page
            console.log('Delete pack:', packId)
            // You can implement the actual delete functionality later
        }
    }

    if (error) {
        return (
            <div className={styles.packsContainer}>
                <div className={styles.errorCard}>
                    <h2>Error</h2>
                    <p>{error}</p>
                </div>
            </div>
        )
    }

    const categories = Object.keys(packsByCategory)

    // Calculate total packs count
    const totalPacks = categories.reduce((sum, category) => sum + packsByCategory[category].length, 0)

    if (categories.length === 0) {
        return (
            <div className={styles.packsContainer}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Level Packs</h1>
                    <p className={styles.subtitle}>Complete packs to earn bonus points</p>

                    <div className={styles.stats}>
                        <span className={styles.statItem}>
                            Total Packs: <strong>0</strong>
                        </span>
                    </div>

                    {isAdmin && (
                        <div className={styles.adminActions}>
                            <button
                                onClick={() => navigate('/admin/packs/create')}
                                className={styles.addPackBtn}
                            >
                                Add Pack
                            </button>
                        </div>
                    )}
                </div>
                <div className={styles.emptyState}>
                    <p>No packs available yet. Check back later!</p>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.packsContainer}>
            <div className={styles.header}>
                <h1 className={styles.title}>Level Packs</h1>
                <p className={styles.subtitle}>Complete all levels in a pack to earn bonus points</p>

                <div className={styles.stats}>
                    <span className={styles.statItem}>
                        Total Packs: <strong>{totalPacks}</strong>
                    </span>
                    <span className={styles.statItem}>
                        Categories: <strong>{categories.length}</strong>
                    </span>
                </div>

                {isAdmin && (
                    <div className={styles.adminActions}>
                        <button
                            onClick={() => navigate('/admin/packs/create')}
                            className={styles.addPackBtn}
                        >
                            Add Pack
                        </button>
                    </div>
                )}
            </div>

            <div className={styles.content}>
                {/* Left Sidebar - Packs List */}
                <div className={styles.sidebar}>
                    <div className={styles.packsList}>
                        {categories.sort().map(category => (
                            <div key={category} className={styles.categorySection}>
                                <h3 className={styles.categoryTitle}>{category}</h3>
                                {packsByCategory[category].map(pack => {
                                    const progress = getPackProgress(pack.id)
                                    const isSelected = selectedPack?.id === pack.id

                                    return (
                                        <div key={pack.id} className={styles.packItemWrapper}>
                                            <button
                                                className={`${styles.packItem} ${isSelected ? styles.packItemActive : ''}`}
                                                onClick={() => setSelectedPack(pack)}
                                            >
                                                <div className={styles.packItemContent}>
                                                    <span className={styles.packName}>{pack.name}</span>
                                                    <span className={styles.packLevelCount}>
                                                        {pack.levelCount} level{pack.levelCount !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                                {progress && (
                                                    <div className={styles.packItemProgress}>
                                                        {progress.isCompleted ? (
                                                            <span className={styles.completedBadge}>✓ Completed</span>
                                                        ) : (
                                                            <span className={styles.progressText}>
                                                                {progress.completedLevels}/{progress.totalLevels}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </button>
                                            {isAdmin && (
                                                <div className={styles.packItemAdminActions}>
                                                    <button
                                                        className={styles.packEditBtn}
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleEditPack(pack.id)
                                                        }}
                                                        title="Edit pack"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        className={styles.packDeleteBtn}
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleDeletePack(pack.id)
                                                        }}
                                                        title="Delete pack"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Panel - Pack Details */}
                <div className={styles.mainPanel}>
                    {selectedPack ? (
                        <div className={styles.packDetails}>
                            <div className={styles.packHeader}>
                                <h2 className={styles.packTitle}>{selectedPack.name}</h2>
                                {selectedPack.description && (
                                    <p className={styles.packDescription}>{selectedPack.description}</p>
                                )}
                                <div className={styles.packMeta}>
                                    <span className={styles.packCategory}>{selectedPack.category}</span>
                                    <span className={styles.packPoints}>
                                        {selectedPack.bonus_points} bonus points
                                    </span>
                                </div>
                                {user && getPackProgress(selectedPack.id) && (
                                    <div className={styles.progressBar}>
                                        <div className={styles.progressBarFill}
                                            style={{ width: `${getPackProgress(selectedPack.id).progress}%` }}
                                        />
                                        <span className={styles.progressBarText}>
                                            {getPackProgress(selectedPack.id).progress}% Complete
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className={styles.levelsSection}>
                                <h3 className={styles.levelsTitle}>
                                    Levels in this pack ({selectedPack.levels.length})
                                </h3>
                                {selectedPack.levels.length > 0 ? (
                                    <div className={styles.levelsList}>
                                        {selectedPack.levels.map((level) => {
                                            const thumbnailUrl = level.youtubeVideoId
                                                ? `https://img.youtube.com/vi/${level.youtubeVideoId}/maxresdefault.jpg`
                                                : null

                                            return (
                                                <Link
                                                    key={level.id}
                                                    to={`/level/${level.placement}`}
                                                    className={styles.levelCard}
                                                >
                                                    {thumbnailUrl && (
                                                        <div className={styles.levelThumbnail}>
                                                            <img
                                                                src={thumbnailUrl}
                                                                alt={level.levelName}
                                                                className={styles.thumbnailImage}
                                                            />
                                                            <div className={styles.thumbnailGradient}></div>
                                                        </div>
                                                    )}
                                                    <div className={styles.textFog}></div>
                                                    <div className={styles.levelCardContent}>
                                                        <div className={styles.levelCardLeft}>
                                                            <span className={styles.levelPlacement}>
                                                                #{level.placement}
                                                            </span>
                                                            <div className={styles.levelInfo}>
                                                                <h4 className={styles.levelName}>{level.levelName}</h4>
                                                                <p className={styles.levelCreator}>by {level.creator}</p>
                                                            </div>
                                                        </div>
                                                        <div className={styles.levelCardRight}>
                                                            <span className={styles.levelPoints}>
                                                                {level.points} pts
                                                            </span>
                                                        </div>
                                                    </div>
                                                </Link>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className={styles.noLevels}>
                                        <p>No levels in this pack</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className={styles.noSelection}>
                            <p>Select a pack from the sidebar to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
