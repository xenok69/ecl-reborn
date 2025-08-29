import { useState } from 'react'
import { useParams, useLoaderData, useNavigation } from 'react-router'
import LevelDisplay from '../components/LevelDisplay'
import { getLevels, getLeaderboard } from '../lib/levelUtils'
import styles from './ChallengesRoute.module.css'

export const challengesLoader = async ({ params }) => {
    // Simulate the loading delay you had
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const allLevels = getLevels()
    return { 
        levels: allLevels,
        placement: params.placement 
    }
}

export default function ChallengesRoute() {
    const { levels, placement: urlPlacement } = useLoaderData()
    const navigation = useNavigation()
    const [currentPage, setCurrentPage] = useState(() => {
        // If placement is provided in URL, calculate initial page
        if (urlPlacement) {
            return Math.ceil(parseInt(urlPlacement) / 10)
        }
        return 1
    })
    const [levelsPerPage] = useState(10)
    
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
            </div>

            <div className={styles.LevelsGrid}>
                {currentLevels.length > 0 ? (
                    currentLevels.map((level) => (
                        <div key={level.id} className={styles.LevelItem}>
                            <LevelDisplay
                                placement={level.placement}
                                levelName={level.levelName}
                                creator={level.creator}
                                verifier={level.verifier}
                                id={level.id}
                                points={level.points}
                                youtubeVideoId={level.youtubeVideoId}
                                tags={level.tags}
                            />
                        </div>
                    ))
                ) : (
                    <div className={styles.NoLevels}>
                        <span>No levels found</span>
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
        </div>
    )
}