import { useState } from 'react'
import { useParams, useLoaderData, useNavigation, useNavigate, Link } from 'react-router'
import LevelDisplay from '../components/LevelDisplay'
import { getLevels, getLeaderboard } from '../lib/levelUtils'
import { useAdmin } from '../hooks/useAdmin'
import { deleteLevelFromJson } from './AdminSubmitRoute'
import styles from './ChallengesRoute.module.css'

export const challengesLoader = async ({ params }) => {
    // Simulate the loading delay you had
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    try {
        const allLevels = await getLevels()
        return { 
            levels: allLevels,
            placement: params.placement,
            error: null
        }
    } catch (error) {
        console.error('Failed to load levels:', error)
        return { 
            levels: [],
            placement: params.placement,
            error: error.message
        }
    }
}

export default function ChallengesRoute() {
    const { levels, placement: urlPlacement, error } = useLoaderData()
    const navigation = useNavigation()
    const navigate = useNavigate()
    const { isAdmin } = useAdmin()
    
    const [currentPage, setCurrentPage] = useState(() => {
        // If placement is provided in URL, calculate initial page
        if (urlPlacement) {
            return Math.ceil(parseInt(urlPlacement) / 10)
        }
        return 1
    })
    const [levelsPerPage] = useState(10)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [deleteTimer, setDeleteTimer] = useState(0)
    
    const isLoading = navigation.state === 'loading'

    // Calculate pagination
    const indexOfLastLevel = currentPage * levelsPerPage
    const indexOfFirstLevel = indexOfLastLevel - levelsPerPage
    const currentLevels = levels.slice(indexOfFirstLevel, indexOfLastLevel)
    const totalPages = Math.ceil(levels.length / levelsPerPage)

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber)
        // Scroll to top when changing pages
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

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

    const getPaginationRange = () => {
        const range = []
        const maxVisible = 5
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
        let end = Math.min(totalPages, start + maxVisible - 1)
        
        // Adjust start if we're near the end
        if (end - start < maxVisible - 1) {
            start = Math.max(1, end - maxVisible + 1)
        }
        
        for (let i = start; i <= end; i++) {
            range.push(i)
        }
        
        return range
    }

    return (
        <div className={styles.ChallengesContainer}>
            <div className={styles.Header}>
                <h1 className={styles.Title}>Eclipse Challenge List</h1>
                <p className={styles.Subtitle}>
                    The ultimate collection of Geometry Dash's most challenging levels
                </p>
                <div className={styles.Stats}>
                    <span className={styles.StatItem}>
                        Total Levels: <strong>{levels.length}</strong>
                    </span>
                    <span className={styles.StatItem}>
                        Page {currentPage} of {totalPages}
                    </span>
                </div>
                {isAdmin && (
                    <div className={styles.AdminActions}>
                        <button 
                            onClick={handleAddLevel}
                            className={styles.AddLevelBtn}
                        >
                            Add Level
                        </button>
                    </div>
                )}
            </div>

            <div className={styles.LevelsGrid}>
                {currentLevels.length > 0 ? (
                    currentLevels.map((level) => (
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

            {totalPages > 1 && (
                <div className={styles.Pagination}>
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`${styles.PaginationBtn} ${styles.PrevNext}`}
                    >
                        Previous
                    </button>
                    
                    {getPaginationRange().map((pageNumber) => (
                        <button
                            key={pageNumber}
                            onClick={() => handlePageChange(pageNumber)}
                            className={`${styles.PaginationBtn} ${
                                currentPage === pageNumber ? styles.Active : ''
                            }`}
                        >
                            {pageNumber}
                        </button>
                    ))}
                    
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`${styles.PaginationBtn} ${styles.PrevNext}`}
                    >
                        Next
                    </button>
                </div>
            )}

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