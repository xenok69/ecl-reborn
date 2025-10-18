import { useState } from 'react'
import { useParams, useLoaderData, useNavigation, useNavigate, Link } from 'react-router'
import LevelDisplay from '../components/LevelDisplay'
import { getLevels, getLeaderboard } from '../lib/levelUtils'
import { useAdmin } from '../hooks/useAdmin'
import { useAuth } from '../hooks/useAuth'
import { deleteLevelFromJson } from './AdminSubmitRoute'
import styles from './ChallengesRoute.module.css'

export const challengesLoader = async ({ params, request }) => {
    try {
        // Check if request was aborted before starting
        if (request.signal.aborted) {
            return {
                levels: [],
                placement: params.placement,
                listType: 'main',
                error: null
            }
        }

        const allLevels = await getLevels()

        // Check if request was aborted after data fetch
        if (request.signal.aborted) {
            return {
                levels: [],
                placement: params.placement,
                listType: 'main',
                error: null
            }
        }

        // Determine list type from URL
        const url = new URL(request.url)
        const pathname = url.pathname
        let listType = 'main'
        let filteredLevels = allLevels

        if (pathname.includes('/challenges/extended')) {
            listType = 'extended'
            filteredLevels = allLevels.filter(level => level.placement >= 101 && level.placement <= 150)
        } else if (pathname.includes('/challenges/legacy')) {
            listType = 'legacy'
            filteredLevels = allLevels.filter(level => level.placement > 150)
        } else if (pathname === '/challenges/' || pathname === '/challenges') {
            listType = 'main'
            filteredLevels = allLevels.filter(level => level.placement >= 1 && level.placement <= 100)
        }

        return {
            levels: filteredLevels,
            placement: params.placement,
            listType: listType,
            error: null
        }
    } catch (error) {
        // Don't log errors if the request was aborted
        if (!request.signal.aborted) {
            console.error('Failed to load levels:', error)
        }
        return {
            levels: [],
            placement: params.placement,
            listType: 'main',
            error: request.signal.aborted ? null : error.message
        }
    }
}

export default function ChallengesRoute() {
    const { levels, placement: urlPlacement, listType, error } = useLoaderData()
    const navigation = useNavigation()
    const navigate = useNavigate()
    const { isAdmin } = useAdmin()
    const { isAuthenticated } = useAuth()

    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [deleteTimer, setDeleteTimer] = useState(0)

    const isLoading = navigation.state === 'loading'

    const handleAddLevel = () => {
        navigate('/submit')
    }

    const handleEditLevel = (levelId) => {
        console.log('🔍 ChallengesRoute - Edit button clicked for level ID:', levelId, 'Type:', typeof levelId)
        navigate(`/edit/${levelId}`)
    }

    const handleRemoveLevel = (levelId) => {
        const level = levels.find(l => l.id === levelId)
        setDeleteConfirm({ levelId, levelName: level?.levelName || 'Unknown Level' })
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

    const confirmDelete = async () => {
        try {
            const result = await deleteLevelFromJson(deleteConfirm.levelId)
            console.log('Level deleted successfully:', result)
            
            // Show success message (you could add a toast notification here)
            alert(`Level "${deleteConfirm.levelName}" has been deleted successfully!`)
            
            // Refresh the page to show updated data
            window.location.reload()
        } catch (error) {
            console.error('Error deleting level:', error)
            alert(`Failed to delete level: ${error.message}`)
        } finally {
            setDeleteConfirm(null)
            setDeleteTimer(0)
        }
    }

    const cancelDelete = () => {
        setDeleteConfirm(null)
        setDeleteTimer(0)
    }

    const getListTitle = () => {
        switch (listType) {
            case 'extended':
                return 'Extended List (101-150)'
            case 'legacy':
                return 'Legacy List (151+)'
            default:
                return 'Main List (1-100)'
        }
    }

    return (
        <div className={styles.ChallengesContainer}>
            <div className={styles.Header}>
                <h1 className={styles.Title}>Eclipse Challenge List</h1>
                <p className={styles.Subtitle}>
                    The ultimate collection of Geometry Dash's most challenging levels
                </p>

                {/* List navigation buttons */}
                <div className={styles.ListNavigation}>
                    <button
                        onClick={() => navigate('/challenges/')}
                        className={`${styles.ListNavBtn} ${listType === 'main' ? styles.Active : ''}`}
                    >
                        Main
                    </button>
                    <button
                        onClick={() => navigate('/challenges/extended')}
                        className={`${styles.ListNavBtn} ${listType === 'extended' ? styles.Active : ''}`}
                    >
                        Extended
                    </button>
                    <button
                        onClick={() => navigate('/challenges/legacy')}
                        className={`${styles.ListNavBtn} ${listType === 'legacy' ? styles.Active : ''}`}
                    >
                        Legacy
                    </button>
                </div>

                <div className={styles.Stats}>
                    <span className={styles.StatItem}>
                        {getListTitle()}
                    </span>
                    <span className={styles.StatItem}>
                        Levels: <strong>{levels.length}</strong>
                    </span>
                </div>

                {/* Action buttons for authenticated users and admins */}
                {(isAuthenticated || isAdmin) && (
                    <div className={styles.AdminActions} style={{ gap: '0.75rem', flexWrap: 'wrap' }}>
                        {isAuthenticated && (
                            <>
                                <button
                                    onClick={() => navigate('/submit-request')}
                                    className={styles.SmallActionBtn}
                                    style={{ backgroundColor: '#3b82f6' }}
                                >
                                    Submit Level/Completion
                                </button>
                                <button
                                    onClick={() => navigate('/my-submissions')}
                                    className={styles.SmallActionBtn}
                                    style={{ backgroundColor: '#8b5cf6' }}
                                >
                                    My Submissions
                                </button>
                            </>
                        )}
                        {isAdmin && (
                            <>
                                <button
                                    onClick={() => navigate('/admin/review')}
                                    className={styles.SmallActionBtn}
                                    style={{ backgroundColor: '#10b981' }}
                                >
                                    Review Submissions
                                </button>
                                <button
                                    onClick={handleAddLevel}
                                    className={styles.AddLevelBtn}
                                >
                                    Add Level
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className={styles.LevelsGrid}>
                {levels.length > 0 ? (
                    levels.map((level) => (
                        <div key={level.id} className={styles.LevelItem}>
                            <Link to={`/level/${level.placement}`} className={styles.LevelLink}>
                                <LevelDisplay
                                    placement={level.placement}
                                    levelName={level.levelName}
                                    creator={level.creator}
                                    verifier={level.verifier}
                                    id={level.id}
                                    points={level.points}
                                    youtubeVideoId={level.youtubeVideoId}
                                    tags={level.tags}
                                    showActions={isAdmin}
                                    onEdit={handleEditLevel}
                                    onRemove={handleRemoveLevel}
                                />
                            </Link>
                        </div>
                    ))
                ) : (
                    <div className={styles.NoLevels}>
                        {error ? (
                            <div>
                                <h3>🚫 Database Error</h3>
                                <p>Failed to load levels: {error}</p>
                                <p>Please check your connection and try refreshing the page.</p>
                            </div>
                        ) : (
                            <div>
                                <h3>📭 No Levels Yet</h3>
                                <p>The level database is currently empty.</p>
                                {isAdmin && (
                                    <p>
                                        <button 
                                            onClick={handleAddLevel}
                                            className={styles.AddLevelBtn}
                                        >
                                            Add the First Level
                                        </button>
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {deleteConfirm && (
                <div className={styles.DeleteModal}>
                    <div className={styles.DeleteModalContent}>
                        <h3>Delete Level</h3>
                        <p>Are you sure you want to delete <strong>"{deleteConfirm.levelName}"</strong>?</p>
                        <p>This action cannot be undone.</p>
                        <div className={styles.DeleteModalActions}>
                            <button 
                                onClick={cancelDelete}
                                className={styles.CancelBtn}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDelete}
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