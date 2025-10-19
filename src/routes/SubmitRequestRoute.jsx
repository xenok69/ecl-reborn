import { useState, useEffect } from 'react'
import { Form, useActionData, useNavigation, redirect } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { difficulties, gamemodes, decorationStyles, extraTagTypes } from '../data/levels.js'
import { getLevels } from '../lib/levelUtils'
import { supabaseOperations } from '../lib/supabase'
import styles from './AdminSubmitRoute.module.css'

export const submitRequestAction = async ({ request }) => {
    const formData = await request.formData()
    const errors = {}

    const submissionType = formData.get('submissionType')
    const submittedByUserId = formData.get('submittedByUserId')
    const submittedByUsername = formData.get('submittedByUsername')

    if (!submittedByUserId || !submittedByUsername) {
        return {
            success: false,
            message: 'User authentication required. Please sign in again.'
        }
    }

    try {
        let submissionData = {
            submission_type: submissionType,
            submitted_by_user_id: submittedByUserId,
            submitted_by_username: submittedByUsername
        }

        if (submissionType === 'level') {
            // Level submission
            const levelName = formData.get('levelName')?.trim()
            const creator = formData.get('creator')?.trim()
            const verifier = formData.get('verifier')?.trim()
            const levelId = formData.get('levelId')?.trim()
            const youtubeVideoInput = formData.get('youtubeVideoId')?.trim()
            const suggestedPlacement = formData.get('suggestedPlacement')
            const difficulty = formData.get('difficulty')
            const gamemode = formData.get('gamemode')
            const decorationStyle = formData.get('decorationStyle')
            const selectedExtraTags = formData.getAll('selectedExtraTags')
            const enjoymentRating = formData.get('enjoymentRating')

            // Validation
            if (!levelName) errors.levelName = 'Level name is required'
            if (!creator) errors.creator = 'Creator is required'
            if (!verifier) errors.verifier = 'Verifier is required'
            if (!levelId) errors.levelId = 'Level ID is required'
            if (!youtubeVideoInput) errors.video = 'YouTube video is required'
            if (!difficulty) errors.difficulty = 'Difficulty is required'
            if (!gamemode) errors.gamemode = 'Gamemode is required'
            if (!decorationStyle) errors.decorationStyle = 'Decoration style is required'
            if (!enjoymentRating || enjoymentRating === '') {
                errors.enjoymentRating = 'Enjoyment rating is required'
            } else {
                const rating = parseFloat(enjoymentRating)
                if (isNaN(rating) || rating < 0 || rating > 10) {
                    errors.enjoymentRating = 'Enjoyment rating must be between 0 and 10'
                }
            }

            // Extract YouTube ID
            const extractYoutubeId = (input) => {
                if (!input) return null
                const patterns = [
                    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
                    /^([a-zA-Z0-9_-]{11})$/
                ]
                for (const pattern of patterns) {
                    const match = input.match(pattern)
                    if (match) return match[1]
                }
                return null
            }

            const youtubeVideoId = extractYoutubeId(youtubeVideoInput)
            if (youtubeVideoInput && !youtubeVideoId) {
                errors.video = 'Invalid YouTube URL or video ID'
            }

            if (Object.keys(errors).length > 0) {
                return { success: false, errors }
            }

            submissionData = {
                ...submissionData,
                level_id: levelId,
                level_name: levelName,
                creator,
                verifier,
                youtube_video_id: youtubeVideoId,
                difficulty,
                gamemode,
                decoration_style: decorationStyle,
                extra_tags: selectedExtraTags,
                suggested_placement: suggestedPlacement ? parseInt(suggestedPlacement) : null,
                enjoyment_rating: parseFloat(enjoymentRating)
            }

        } else if (submissionType === 'completion') {
            // Completion submission
            const targetLevelId = formData.get('targetLevelId')
            const youtubeLink = formData.get('youtubeLink')?.trim()
            const completedAtInput = formData.get('completedAt')
            const isVerifier = formData.get('isVerifier') === 'true'
            const enjoymentRating = formData.get('enjoymentRating')

            // Convert datetime-local to ISO timestamp
            const completedAt = completedAtInput
                ? new Date(completedAtInput).toISOString()
                : new Date().toISOString()

            // Validation
            if (!targetLevelId) errors.targetLevel = 'Please select a level'
            if (!enjoymentRating || enjoymentRating === '') {
                errors.enjoymentRating = 'Enjoyment rating is required'
            } else {
                const rating = parseFloat(enjoymentRating)
                if (isNaN(rating) || rating < 0 || rating > 10) {
                    errors.enjoymentRating = 'Enjoyment rating must be between 0 and 10'
                }
            }

            if (Object.keys(errors).length > 0) {
                return { success: false, errors }
            }

            submissionData = {
                ...submissionData,
                target_level_id: targetLevelId,
                youtube_link: youtubeLink || null,
                completed_at: completedAt,
                is_verifier: isVerifier,
                enjoyment_rating: parseFloat(enjoymentRating)
            }
        }

        // Submit to database
        await supabaseOperations.addSubmission(submissionData)

        // Redirect to My Submissions page after successful submission
        return redirect('/my-submissions')

    } catch (error) {
        console.error('Error submitting request:', error)

        // Extract helpful error information
        let errorMessage = 'Failed to submit request. '

        if (error.message) {
            errorMessage += error.message
        }

        // Check for specific error types
        if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
            errorMessage = 'Database table not set up yet. The level_submissions table needs to be created in Supabase. Please contact an admin to run the setup SQL.'
        } else if (error.message === 'Supabase not configured') {
            errorMessage = 'Database connection not configured. Please contact an admin.'
        } else if (error.message?.includes('row-level security') || error.message?.includes('policy')) {
            errorMessage = 'Database security policy blocking submission. The RLS policies need to be updated for Discord OAuth. Please contact an admin to fix the policies (see SUPABASE_SETUP.md).'
        }

        // Add hint if available
        if (error.hint) {
            errorMessage += ` Hint: ${error.hint}`
        }

        // Add details if available
        if (error.details) {
            errorMessage += ` Details: ${error.details}`
        }

        return {
            success: false,
            message: errorMessage
        }
    }
}

export default function SubmitRequestRoute() {
    const { user, isAuthenticated } = useAuth()
    const navigation = useNavigation()
    const actionData = useActionData()

    const [submissionType, setSubmissionType] = useState('level')
    const [extraTags, setExtraTags] = useState([])
    const [levels, setLevels] = useState([])
    const [isLoadingLevels, setIsLoadingLevels] = useState(true)

    const isSubmitting = navigation.state === 'submitting'

    // Load levels for completion dropdown
    useEffect(() => {
        const loadLevels = async () => {
            try {
                const levelsData = await getLevels()
                setLevels(levelsData)
            } catch (error) {
                console.error('Failed to load levels:', error)
            } finally {
                setIsLoadingLevels(false)
            }
        }
        loadLevels()
    }, [])

    const handleExtraTagsChange = (tag) => {
        setExtraTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        )
    }

    if (!isAuthenticated) {
        return (
            <div className={styles.AdminContainer}>
                <div className={styles.ErrorMessage}>
                    <h2>Sign In Required</h2>
                    <p>Please sign in with Discord to submit levels or completions.</p>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.AdminContainer}>
            <div className={styles.Header}>
                <h1 className={styles.Title}>Submit to ECL</h1>
                <p className={styles.Subtitle}>
                    Submit new levels or your completions for admin approval
                </p>
            </div>

            {actionData?.message && (
                <div className={`${styles.SubmitMessage} ${actionData.success ? '' : styles.ErrorMessage}`}>
                    {actionData.message}
                </div>
            )}

            <div className={styles.ToggleSection} style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                    type="button"
                    onClick={() => setSubmissionType('level')}
                    className={`${styles.SubmitBtn} ${submissionType === 'level' ? styles.AddBtn : ''}`}
                    style={{ opacity: submissionType === 'level' ? 1 : 0.5 }}
                >
                    Submit New Level
                </button>
                <button
                    type="button"
                    onClick={() => setSubmissionType('completion')}
                    className={`${styles.SubmitBtn} ${submissionType === 'completion' ? styles.AddBtn : ''}`}
                    style={{ opacity: submissionType === 'completion' ? 1 : 0.5 }}
                >
                    Submit Completion
                </button>
            </div>

            <Form method="post" className={styles.SubmitForm}>
                <input type="hidden" name="submissionType" value={submissionType} />
                <input type="hidden" name="submittedByUserId" value={user?.id || ''} />
                <input type="hidden" name="submittedByUsername" value={user?.username || ''} />

                {submissionType === 'level' ? (
                    <>
                        <fieldset className={styles.FormSection}>
                            <legend className={styles.SectionTitle}>Level Information</legend>

                            <div className={styles.FormRow}>
                                <div className={styles.FormGroup}>
                                    <label className={styles.Label}>
                                        Level Name *
                                        <input
                                            type="text"
                                            name="levelName"
                                            className={`${styles.Input} ${actionData?.errors?.levelName ? styles.Error : ''}`}
                                            placeholder="Enter level name"
                                            required
                                        />
                                        {actionData?.errors?.levelName && <span className={styles.ErrorText}>{actionData.errors.levelName}</span>}
                                    </label>
                                </div>

                                <div className={styles.FormGroup}>
                                    <label className={styles.Label}>
                                        Suggested Placement (Optional)
                                        <input
                                            type="number"
                                            name="suggestedPlacement"
                                            className={styles.Input}
                                            placeholder="Where should this level be placed?"
                                            min="1"
                                        />
                                        <div className={styles.PlacementHint}>
                                            💡 Suggest where you think this level belongs in the list
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className={styles.FormRow}>
                                <div className={styles.FormGroup}>
                                    <label className={styles.Label}>
                                        Creator *
                                        <input
                                            type="text"
                                            name="creator"
                                            className={`${styles.Input} ${actionData?.errors?.creator ? styles.Error : ''}`}
                                            placeholder="Enter creator name"
                                            required
                                        />
                                        {actionData?.errors?.creator && <span className={styles.ErrorText}>{actionData.errors.creator}</span>}
                                    </label>
                                </div>

                                <div className={styles.FormGroup}>
                                    <label className={styles.Label}>
                                        Verifier *
                                        <input
                                            type="text"
                                            name="verifier"
                                            className={`${styles.Input} ${actionData?.errors?.verifier ? styles.Error : ''}`}
                                            placeholder="Enter verifier name"
                                            required
                                        />
                                        {actionData?.errors?.verifier && <span className={styles.ErrorText}>{actionData.errors.verifier}</span>}
                                    </label>
                                </div>
                            </div>

                            <div className={styles.FormGroup}>
                                <label className={styles.Label}>
                                    Level ID *
                                    <input
                                        type="text"
                                        name="levelId"
                                        className={`${styles.Input} ${actionData?.errors?.levelId ? styles.Error : ''}`}
                                        placeholder="Enter Geometry Dash level ID"
                                        required
                                    />
                                    {actionData?.errors?.levelId && <span className={styles.ErrorText}>{actionData.errors.levelId}</span>}
                                </label>
                            </div>
                        </fieldset>

                        <fieldset className={styles.FormSection}>
                            <legend className={styles.SectionTitle}>Video</legend>
                            <div className={styles.FormGroup}>
                                <label className={styles.Label}>
                                    YouTube Video Link *
                                    <input
                                        type="text"
                                        name="youtubeVideoId"
                                        className={`${styles.Input} ${actionData?.errors?.video ? styles.Error : ''}`}
                                        placeholder="Paste full YouTube URL"
                                        required
                                    />
                                    {actionData?.errors?.video && <span className={styles.ErrorText}>{actionData.errors.video}</span>}
                                    <div className={styles.FileInputHint}>
                                        💡 Paste the full YouTube URL or video ID
                                    </div>
                                </label>
                            </div>
                        </fieldset>

                        <fieldset className={styles.FormSection}>
                            <legend className={styles.SectionTitle}>Tags</legend>

                            <div className={styles.FormRow}>
                                <div className={styles.FormGroup}>
                                    <label className={styles.Label}>
                                        Difficulty *
                                        <select
                                            name="difficulty"
                                            className={`${styles.Select} ${actionData?.errors?.difficulty ? styles.Error : ''}`}
                                            required
                                        >
                                            <option value="">Select difficulty</option>
                                            {Object.entries(difficulties).map(([key, value]) => (
                                                <option key={key} value={value}>{value}</option>
                                            ))}
                                        </select>
                                        {actionData?.errors?.difficulty && <span className={styles.ErrorText}>{actionData.errors.difficulty}</span>}
                                    </label>
                                </div>

                                <div className={styles.FormGroup}>
                                    <label className={styles.Label}>
                                        Gamemode *
                                        <select
                                            name="gamemode"
                                            className={`${styles.Select} ${actionData?.errors?.gamemode ? styles.Error : ''}`}
                                            required
                                        >
                                            <option value="">Select gamemode</option>
                                            {Object.entries(gamemodes).map(([key, value]) => (
                                                <option key={key} value={value}>{value}</option>
                                            ))}
                                        </select>
                                        {actionData?.errors?.gamemode && <span className={styles.ErrorText}>{actionData.errors.gamemode}</span>}
                                    </label>
                                </div>
                            </div>

                            <div className={styles.FormGroup}>
                                <label className={styles.Label}>
                                    Decoration Style *
                                    <select
                                        name="decorationStyle"
                                        className={`${styles.Select} ${actionData?.errors?.decorationStyle ? styles.Error : ''}`}
                                        required
                                    >
                                        <option value="">Select decoration style</option>
                                        {Object.entries(decorationStyles).map(([key, value]) => (
                                            <option key={key} value={value}>{value}</option>
                                        ))}
                                    </select>
                                    {actionData?.errors?.decorationStyle && <span className={styles.ErrorText}>{actionData.errors.decorationStyle}</span>}
                                </label>
                            </div>

                            <div className={styles.FormGroup}>
                                <span className={styles.Label}>Extra Tags (Optional)</span>
                                <div className={styles.CheckboxGrid}>
                                    {Object.entries(extraTagTypes).map(([key, value]) => (
                                        <label key={key} className={styles.CheckboxLabel}>
                                            <input
                                                type="checkbox"
                                                value={value}
                                                checked={extraTags.includes(value)}
                                                onChange={() => handleExtraTagsChange(value)}
                                                className={styles.Checkbox}
                                            />
                                            <span className={styles.CheckboxText}>{value}</span>
                                        </label>
                                    ))}
                                </div>
                                {extraTags.map(tag => (
                                    <input key={tag} type="hidden" name="selectedExtraTags" value={tag} />
                                ))}
                            </div>

                            <div className={styles.FormGroup}>
                                <label className={styles.Label}>
                                    Enjoyment Rating *
                                    <input
                                        type="number"
                                        name="enjoymentRating"
                                        className={`${styles.Input} ${actionData?.errors?.enjoymentRating ? styles.Error : ''}`}
                                        placeholder="Rate 0-10 (decimals allowed)"
                                        min="0"
                                        max="10"
                                        step="0.01"
                                        required
                                    />
                                    <div className={styles.PlacementHint}>
                                        How much did you enjoy this level? (0 = terrible, 10 = amazing)
                                    </div>
                                    {actionData?.errors?.enjoymentRating && <span className={styles.ErrorText}>{actionData.errors.enjoymentRating}</span>}
                                </label>
                            </div>
                        </fieldset>
                    </>
                ) : (
                    <>
                        <fieldset className={styles.FormSection}>
                            <legend className={styles.SectionTitle}>Completion Information</legend>

                            <div className={styles.FormGroup}>
                                <label className={styles.Label}>
                                    Level *
                                    <select
                                        name="targetLevelId"
                                        className={`${styles.Select} ${actionData?.errors?.targetLevel ? styles.Error : ''}`}
                                        required
                                        disabled={isLoadingLevels}
                                    >
                                        <option value="">Select a level</option>
                                        {levels.map(level => (
                                            <option key={level.id} value={level.id}>
                                                #{level.placement} - {level.levelName}
                                            </option>
                                        ))}
                                    </select>
                                    {actionData?.errors?.targetLevel && <span className={styles.ErrorText}>{actionData.errors.targetLevel}</span>}
                                </label>
                            </div>

                            <div className={styles.FormGroup}>
                                <label className={styles.Label}>
                                    YouTube Proof Link (Optional)
                                    <input
                                        type="text"
                                        name="youtubeLink"
                                        className={styles.Input}
                                        placeholder="Paste YouTube link to your completion"
                                    />
                                    <div className={styles.FileInputHint}>
                                        💡 Optional: Add video proof of your completion
                                    </div>
                                </label>
                            </div>

                            <div className={styles.FormGroup}>
                                <label className={styles.Label}>
                                    Completion Date & Time (Optional)
                                    <input
                                        type="datetime-local"
                                        name="completedAt"
                                        className={styles.Input}
                                    />
                                    <div className={styles.FileInputHint}>
                                        💡 If not provided, defaults to current date & time
                                    </div>
                                </label>
                            </div>

                            <div className={styles.FormGroup}>
                                <label className={styles.CheckboxLabel}>
                                    <input
                                        type="checkbox"
                                        name="isVerifier"
                                        value="true"
                                        className={styles.Checkbox}
                                    />
                                    <span className={styles.CheckboxText}>This is a verification (first completion)</span>
                                </label>
                            </div>

                            <div className={styles.FormGroup}>
                                <label className={styles.Label}>
                                    Enjoyment Rating *
                                    <input
                                        type="number"
                                        name="enjoymentRating"
                                        className={`${styles.Input} ${actionData?.errors?.enjoymentRating ? styles.Error : ''}`}
                                        placeholder="Rate 0-10 (decimals allowed)"
                                        min="0"
                                        max="10"
                                        step="0.01"
                                        required
                                    />
                                    <div className={styles.PlacementHint}>
                                        How much did you enjoy this level? (0 = terrible, 10 = amazing)
                                    </div>
                                    {actionData?.errors?.enjoymentRating && <span className={styles.ErrorText}>{actionData.errors.enjoymentRating}</span>}
                                </label>
                            </div>
                        </fieldset>
                    </>
                )}

                <div className={styles.SubmitSection}>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`${styles.SubmitBtn} ${styles.AddBtn}`}
                    >
                        {isSubmitting ? 'Submitting...' : `Submit ${submissionType === 'level' ? 'Level' : 'Completion'}`}
                    </button>
                </div>
            </Form>
        </div>
    )
}
