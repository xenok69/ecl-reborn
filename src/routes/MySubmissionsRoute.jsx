import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabaseOperations } from '../lib/supabase'
import styles from './ChallengesRoute.module.css'
import adminStyles from './AdminSubmitRoute.module.css'
import levelDisplayStyles from '../components/LevelDisplay.module.css'

function SubmissionCard({ submission }) {
    const isLevelSubmission = submission.submission_type === 'level'
    const statusColors = {
        pending: { bg: '#fef3c7', text: '#92400e', label: 'Pending Review' },
        approved: { bg: '#d1fae5', text: '#065f46', label: 'Approved' },
        declined: { bg: '#fee2e2', text: '#991b1b', label: 'Declined' }
    }
    const statusStyle = statusColors[submission.status] || statusColors.pending

    return (
        <div className={levelDisplayStyles.LevelContainer}>
            <div className={levelDisplayStyles.VideoSection}>
                <div className={levelDisplayStyles.VideoWrapper}>
                    {(isLevelSubmission ? submission.youtube_video_id : submission.youtube_link) ? (
                        <iframe
                            src={`https://www.youtube-nocookie.com/embed/${extractYoutubeId(isLevelSubmission ? submission.youtube_video_id : submission.youtube_link)}?rel=0&modestbranding=1&controls=1&showinfo=0&fs=1&iv_load_policy=3&disablekb=1`}
                            title={isLevelSubmission ? submission.level_name : 'Completion proof'}
                            frameBorder="0"
                            allowFullScreen
                            className={levelDisplayStyles.Video}
                            loading="lazy"
                        />
                    ) : (
                        <div className={levelDisplayStyles.VideoPlaceholder}>
                            <span>No video available</span>
                        </div>
                    )}
                </div>
            </div>

            <div className={levelDisplayStyles.InfoSection}>
                <div className={levelDisplayStyles.LevelTitle}>
                    <h2>
                        {isLevelSubmission
                            ? `${submission.suggested_placement ? `#${submission.suggested_placement} - ` : ''}${submission.level_name}`
                            : `Completion for Level ID: ${submission.target_level_id}`
                        }
                    </h2>
                    <div
                        style={{
                            fontSize: '0.85rem',
                            marginTop: '0.5rem',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.25rem',
                            backgroundColor: statusStyle.bg,
                            color: statusStyle.text,
                            display: 'inline-block',
                            fontWeight: 'bold'
                        }}
                    >
                        {statusStyle.label}
                    </div>
                </div>

                {isLevelSubmission ? (
                    <>
                        <div className={levelDisplayStyles.InfoBox}>
                            <div className={levelDisplayStyles.InfoGrid}>
                                <div className={levelDisplayStyles.InfoItem}>
                                    <span className={levelDisplayStyles.InfoLabel}>Creator:</span>
                                    <span className={levelDisplayStyles.InfoValue}>{submission.creator}</span>
                                </div>
                                <div className={levelDisplayStyles.InfoItem}>
                                    <span className={levelDisplayStyles.InfoLabel}>Verifier:</span>
                                    <span className={levelDisplayStyles.InfoValue}>{submission.verifier}</span>
                                </div>
                                <div className={levelDisplayStyles.InfoItem}>
                                    <span className={levelDisplayStyles.InfoLabel}>Level ID:</span>
                                    <span className={levelDisplayStyles.InfoValue}>{submission.level_id}</span>
                                </div>
                                <div className={levelDisplayStyles.InfoItem}>
                                    <span className={levelDisplayStyles.InfoLabel}>Submitted:</span>
                                    <span className={levelDisplayStyles.InfoValue}>
                                        {new Date(submission.submitted_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className={levelDisplayStyles.TagsContainer}>
                            {submission.difficulty && (
                                <span className={`${levelDisplayStyles.Tag} ${levelDisplayStyles.DifficultyTag}`}>
                                    {submission.difficulty}
                                </span>
                            )}
                            {submission.gamemode && (
                                <span className={`${levelDisplayStyles.Tag} ${levelDisplayStyles.GamemodeTag}`}>
                                    {submission.gamemode}
                                </span>
                            )}
                            {submission.decoration_style && (
                                <span className={`${levelDisplayStyles.Tag} ${levelDisplayStyles.DecorationTag}`}>
                                    {submission.decoration_style}
                                </span>
                            )}
                            {submission.extra_tags?.map((tag, index) => (
                                <span key={index} className={`${levelDisplayStyles.Tag} ${levelDisplayStyles.ExtraTag}`}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className={levelDisplayStyles.InfoBox}>
                        <div className={levelDisplayStyles.InfoGrid}>
                            <div className={levelDisplayStyles.InfoItem}>
                                <span className={levelDisplayStyles.InfoLabel}>Type:</span>
                                <span className={levelDisplayStyles.InfoValue}>
                                    {submission.is_verifier ? 'Verification' : 'Completion'}
                                </span>
                            </div>
                            <div className={levelDisplayStyles.InfoItem}>
                                <span className={levelDisplayStyles.InfoLabel}>Completed:</span>
                                <span className={levelDisplayStyles.InfoValue}>
                                    {new Date(submission.completed_at).toLocaleDateString()}
                                </span>
                            </div>
                            <div className={levelDisplayStyles.InfoItem}>
                                <span className={levelDisplayStyles.InfoLabel}>Submitted:</span>
                                <span className={levelDisplayStyles.InfoValue}>
                                    {new Date(submission.submitted_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function extractYoutubeId(url) {
    if (!url) return null
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
        /^([a-zA-Z0-9_-]{11})$/
    ]
    for (const pattern of patterns) {
        const match = url.match(pattern)
        if (match) return match[1]
    }
    return null
}

export default function MySubmissionsRoute() {
    const { user, isAuthenticated } = useAuth()
    const [submissions, setSubmissions] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [filter, setFilter] = useState('all') // 'all', 'pending', 'approved', 'declined'

    useEffect(() => {
        const loadSubmissions = async () => {
            if (!user?.id) return

            setIsLoading(true)
            try {
                const data = await supabaseOperations.getUserSubmissions(user.id)
                setSubmissions(data)
            } catch (error) {
                console.error('Error loading submissions:', error)
            } finally {
                setIsLoading(false)
            }
        }

        if (isAuthenticated && user) {
            loadSubmissions()
        }
    }, [user, isAuthenticated])

    if (!isAuthenticated) {
        return (
            <div className={styles.ChallengesContainer}>
                <div className={adminStyles.ErrorMessage}>
                    <h2>Sign In Required</h2>
                    <p>Please sign in to view your submissions.</p>
                </div>
            </div>
        )
    }

    const filteredSubmissions = submissions.filter(sub => {
        if (filter === 'all') return true
        return sub.status === filter
    })

    const counts = {
        all: submissions.length,
        pending: submissions.filter(s => s.status === 'pending').length,
        approved: submissions.filter(s => s.status === 'approved').length,
        declined: submissions.filter(s => s.status === 'declined').length
    }

    return (
        <div className={styles.ChallengesContainer}>
            <div className={styles.Header}>
                <h1 className={styles.Title}>My Submissions</h1>
                <p className={styles.Subtitle}>
                    Track the status of your level and completion submissions
                </p>
            </div>

            <div className={styles.FilterSection} style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                    onClick={() => setFilter('all')}
                    className={adminStyles.SubmitBtn}
                    style={{
                        opacity: filter === 'all' ? 1 : 0.6,
                        backgroundColor: filter === 'all' ? '#3b82f6' : '#6b7280'
                    }}
                >
                    All ({counts.all})
                </button>
                <button
                    onClick={() => setFilter('pending')}
                    className={adminStyles.SubmitBtn}
                    style={{
                        opacity: filter === 'pending' ? 1 : 0.6,
                        backgroundColor: filter === 'pending' ? '#f59e0b' : '#6b7280'
                    }}
                >
                    Pending ({counts.pending})
                </button>
                <button
                    onClick={() => setFilter('approved')}
                    className={adminStyles.SubmitBtn}
                    style={{
                        opacity: filter === 'approved' ? 1 : 0.6,
                        backgroundColor: filter === 'approved' ? '#10b981' : '#6b7280'
                    }}
                >
                    Approved ({counts.approved})
                </button>
                <button
                    onClick={() => setFilter('declined')}
                    className={adminStyles.SubmitBtn}
                    style={{
                        opacity: filter === 'declined' ? 1 : 0.6,
                        backgroundColor: filter === 'declined' ? '#ef4444' : '#6b7280'
                    }}
                >
                    Declined ({counts.declined})
                </button>
            </div>

            {isLoading ? (
                <div className={styles.LoadingMessage}>Loading your submissions...</div>
            ) : filteredSubmissions.length === 0 ? (
                <div className={styles.EmptyMessage} style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
                    <h2>No submissions found</h2>
                    <p>
                        {filter === 'all'
                            ? "You haven't submitted anything yet. Head to the Submit page to get started!"
                            : `No ${filter} submissions found.`
                        }
                    </p>
                </div>
            ) : (
                <div className={styles.LevelsGrid}>
                    {filteredSubmissions.map(submission => (
                        <SubmissionCard key={submission.id} submission={submission} />
                    ))}
                </div>
            )}
        </div>
    )
}
