import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { supabaseOperations } from '../lib/supabase'
import styles from './ChallengesRoute.module.css'
import adminStyles from './AdminSubmitRoute.module.css'
import levelDisplayStyles from '../components/LevelDisplay.module.css'

function SubmissionDisplay({ submission, onApprove, onDecline }) {
    const isLevelSubmission = submission.submission_type === 'level'
    const [isProcessing, setIsProcessing] = useState(false)

    const handleApprove = async () => {
        if (window.confirm(`Approve this ${submission.submission_type}?`)) {
            setIsProcessing(true)
            await onApprove(submission.id)
            setIsProcessing(false)
        }
    }

    const handleDecline = async () => {
        if (window.confirm(`Decline and delete this ${submission.submission_type}?`)) {
            setIsProcessing(true)
            await onDecline(submission.id)
            setIsProcessing(false)
        }
    }

    if (isLevelSubmission) {
        return (
            <div className={levelDisplayStyles.LevelContainer}>
                <div className={levelDisplayStyles.VideoSection}>
                    <div className={levelDisplayStyles.VideoWrapper}>
                        {submission.youtube_video_id ? (
                            <iframe
                                src={`https://www.youtube-nocookie.com/embed/${submission.youtube_video_id}?rel=0&modestbranding=1&controls=1&showinfo=0&fs=1&iv_load_policy=3&disablekb=1`}
                                title={`${submission.level_name} - Submission`}
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
                            {submission.suggested_placement && `#${submission.suggested_placement} - `}
                            {submission.level_name}
                        </h2>
                        <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.25rem' }}>
                            Submitted by {submission.submitted_by_username}
                        </div>
                    </div>

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
                                <span className={levelDisplayStyles.InfoLabel}>Suggested Placement:</span>
                                <span className={levelDisplayStyles.InfoValue}>
                                    {submission.suggested_placement || 'Not specified'}
                                </span>
                            </div>
                            <div className={levelDisplayStyles.InfoItem}>
                                <span className={levelDisplayStyles.InfoLabel}>ID:</span>
                                <span className={levelDisplayStyles.InfoValue}>{submission.level_id}</span>
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

                    <div className={levelDisplayStyles.LevelActions} style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={handleApprove}
                            disabled={isProcessing}
                            className={adminStyles.SubmitBtn}
                            style={{
                                backgroundColor: '#10b981',
                                flex: 1
                            }}
                        >
                            {isProcessing ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                            onClick={handleDecline}
                            disabled={isProcessing}
                            className={adminStyles.SubmitBtn}
                            style={{
                                backgroundColor: '#ef4444',
                                flex: 1
                            }}
                        >
                            {isProcessing ? 'Processing...' : 'Decline'}
                        </button>
                    </div>
                </div>
            </div>
        )
    } else {
        // Completion submission
        return (
            <div className={levelDisplayStyles.LevelContainer}>
                <div className={levelDisplayStyles.VideoSection}>
                    <div className={levelDisplayStyles.VideoWrapper}>
                        {submission.youtube_link ? (
                            <iframe
                                src={`https://www.youtube-nocookie.com/embed/${extractYoutubeId(submission.youtube_link)}?rel=0&modestbranding=1&controls=1&showinfo=0&fs=1&iv_load_policy=3&disablekb=1`}
                                title="Completion proof"
                                frameBorder="0"
                                allowFullScreen
                                className={levelDisplayStyles.Video}
                                loading="lazy"
                            />
                        ) : (
                            <div className={levelDisplayStyles.VideoPlaceholder}>
                                <span>No video proof provided</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className={levelDisplayStyles.InfoSection}>
                    <div className={levelDisplayStyles.LevelTitle}>
                        <h2>Completion Submission</h2>
                        <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.25rem' }}>
                            by {submission.submitted_by_username}
                        </div>
                    </div>

                    <div className={levelDisplayStyles.InfoBox}>
                        <div className={levelDisplayStyles.InfoGrid}>
                            <div className={levelDisplayStyles.InfoItem}>
                                <span className={levelDisplayStyles.InfoLabel}>Level ID:</span>
                                <span className={levelDisplayStyles.InfoValue}>{submission.target_level_id}</span>
                            </div>
                            <div className={levelDisplayStyles.InfoItem}>
                                <span className={levelDisplayStyles.InfoLabel}>Type:</span>
                                <span className={levelDisplayStyles.InfoValue}>
                                    {submission.is_verifier ? 'Verification' : 'Completion'}
                                </span>
                            </div>
                            <div className={levelDisplayStyles.InfoItem}>
                                <span className={levelDisplayStyles.InfoLabel}>Date:</span>
                                <span className={levelDisplayStyles.InfoValue}>
                                    {new Date(submission.completed_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className={levelDisplayStyles.LevelActions} style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={handleApprove}
                            disabled={isProcessing}
                            className={adminStyles.SubmitBtn}
                            style={{
                                backgroundColor: '#10b981',
                                flex: 1
                            }}
                        >
                            {isProcessing ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                            onClick={handleDecline}
                            disabled={isProcessing}
                            className={adminStyles.SubmitBtn}
                            style={{
                                backgroundColor: '#ef4444',
                                flex: 1
                            }}
                        >
                            {isProcessing ? 'Processing...' : 'Decline'}
                        </button>
                    </div>
                </div>
            </div>
        )
    }
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

export default function AdminReviewRoute() {
    const [submissions, setSubmissions] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [filter, setFilter] = useState('pending') // 'pending', 'level', 'completion'
    const [message, setMessage] = useState(null)

    const loadSubmissions = async () => {
        setIsLoading(true)
        try {
            const filters = { status: 'pending' }
            if (filter === 'level') filters.submissionType = 'level'
            if (filter === 'completion') filters.submissionType = 'completion'

            const data = await supabaseOperations.getSubmissions(filters)
            setSubmissions(data)
        } catch (error) {
            console.error('Error loading submissions:', error)
            setMessage({ success: false, text: 'Failed to load submissions' })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadSubmissions()
    }, [filter])

    const handleApprove = async (submissionId) => {
        try {
            await supabaseOperations.approveSubmission(submissionId)
            setMessage({ success: true, text: 'Submission approved successfully!' })
            loadSubmissions() // Reload to remove approved submission
        } catch (error) {
            console.error('Error approving submission:', error)
            setMessage({ success: false, text: 'Failed to approve submission' })
        }
    }

    const handleDecline = async (submissionId) => {
        try {
            await supabaseOperations.declineSubmission(submissionId)
            setMessage({ success: true, text: 'Submission declined and removed' })
            loadSubmissions() // Reload to remove declined submission
        } catch (error) {
            console.error('Error declining submission:', error)
            setMessage({ success: false, text: 'Failed to decline submission' })
        }
    }

    return (
        <div className={styles.ChallengesContainer}>
            <div className={styles.Header}>
                <h1 className={styles.Title}>Review Submissions</h1>
                <p className={styles.Subtitle}>
                    Review and approve pending level and completion submissions
                </p>
            </div>

            {message && (
                <div
                    className={adminStyles.SubmitMessage}
                    style={{
                        backgroundColor: message.success ? '#d1fae5' : '#fee2e2',
                        color: message.success ? '#065f46' : '#991b1b',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        marginBottom: '1rem'
                    }}
                >
                    {message.text}
                </div>
            )}

            <div className={styles.FilterSection} style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                    onClick={() => setFilter('pending')}
                    className={adminStyles.SubmitBtn}
                    style={{
                        opacity: filter === 'pending' ? 1 : 0.5,
                        backgroundColor: filter === 'pending' ? '#3b82f6' : '#6b7280'
                    }}
                >
                    All Pending ({submissions.length})
                </button>
                <button
                    onClick={() => setFilter('level')}
                    className={adminStyles.SubmitBtn}
                    style={{
                        opacity: filter === 'level' ? 1 : 0.5,
                        backgroundColor: filter === 'level' ? '#3b82f6' : '#6b7280'
                    }}
                >
                    Levels Only
                </button>
                <button
                    onClick={() => setFilter('completion')}
                    className={adminStyles.SubmitBtn}
                    style={{
                        opacity: filter === 'completion' ? 1 : 0.5,
                        backgroundColor: filter === 'completion' ? '#3b82f6' : '#6b7280'
                    }}
                >
                    Completions Only
                </button>
            </div>

            {isLoading ? (
                <div className={styles.LoadingMessage}>Loading submissions...</div>
            ) : submissions.length === 0 ? (
                <div className={styles.EmptyMessage} style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
                    <h2>No pending submissions</h2>
                    <p>All submissions have been reviewed!</p>
                </div>
            ) : (
                <div className={styles.LevelsGrid}>
                    {submissions.map(submission => (
                        <SubmissionDisplay
                            key={submission.id}
                            submission={submission}
                            onApprove={handleApprove}
                            onDecline={handleDecline}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
