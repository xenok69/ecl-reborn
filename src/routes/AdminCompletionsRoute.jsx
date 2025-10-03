import { useState, useEffect } from 'react'
import { Form, useActionData, useNavigation, useSearchParams } from 'react-router'
import { supabaseOperations } from '../lib/supabase'
import { getLevels } from '../lib/levelUtils'
import styles from './AdminSubmitRoute.module.css'

export const adminCompletionsAction = async ({ request }) => {
    const formData = await request.formData()
    const errors = {}

    const userId = formData.get('userId')?.trim()
    const levelId = formData.get('levelId')?.trim()
    const youtubeLink = formData.get('youtubeLink')?.trim()
    const completedAt = formData.get('completedAt')?.trim()
    const isVerifier = formData.get('isVerifier') === 'true'
    const isEdit = formData.get('isEdit') === 'true'

    // Validation
    if (!userId) errors.userId = 'User ID is required'
    if (!levelId) errors.levelId = 'Level ID is required'

    if (Object.keys(errors).length > 0) {
        return { success: false, errors }
    }

    try {
        let result
        if (isEdit) {
            // Update the completed level
            result = await supabaseOperations.updateCompletedLevel(
                userId,
                levelId,
                youtubeLink || null,
                completedAt || null,
                isVerifier
            )
            if (!result) {
                throw new Error('Failed to update completed level')
            }
            return {
                success: true,
                message: `✅ Completed level updated successfully for user ${userId}!`
            }
        } else {
            // Add the completed level
            result = await supabaseOperations.addCompletedLevel(
                userId,
                levelId,
                youtubeLink || null,
                completedAt || null,
                isVerifier
            )
            if (!result) {
                throw new Error('Failed to add completed level')
            }
            return {
                success: true,
                message: `✅ Completed level added successfully for user ${userId}!`
            }
        }
    } catch (error) {
        console.error('Error processing completed level:', error)
        return {
            success: false,
            message: error.message || 'Failed to process completed level. Please try again.'
        }
    }
}

export default function AdminCompletionsRoute() {
    const actionData = useActionData()
    const navigation = useNavigation()
    const isSubmitting = navigation.state === 'submitting'
    const [searchParams] = useSearchParams()

    const [levels, setLevels] = useState([])
    const [isLoadingLevels, setIsLoadingLevels] = useState(true)
    const [selectedLevelId, setSelectedLevelId] = useState('')
    const [userId, setUserId] = useState('')
    const [youtubeLink, setYoutubeLink] = useState('')
    const [completedAt, setCompletedAt] = useState('')
    const [isVerifier, setIsVerifier] = useState(false)

    // Check if we're in edit mode
    const isEdit = searchParams.get('edit') === 'true'

    useEffect(() => {
        const loadLevels = async () => {
            try {
                const allLevels = await getLevels()
                setLevels(allLevels)

                // Pre-fill data from URL params if provided (for edit mode)
                const levelIdFromParams = searchParams.get('levelId')
                const userIdFromParams = searchParams.get('userId')
                const youtubeFromParams = searchParams.get('youtubeLink')
                const completedAtFromParams = searchParams.get('completedAt')
                const isVerifierFromParams = searchParams.get('isVerifier') === 'true'

                if (levelIdFromParams) {
                    setSelectedLevelId(levelIdFromParams)
                }
                if (userIdFromParams) {
                    setUserId(userIdFromParams)
                }
                if (youtubeFromParams) {
                    setYoutubeLink(youtubeFromParams)
                }
                if (completedAtFromParams) {
                    // Convert ISO string to datetime-local format
                    const date = new Date(completedAtFromParams)
                    const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
                        .toISOString()
                        .slice(0, 16)
                    setCompletedAt(localDateTime)
                }
                if (isVerifierFromParams) {
                    setIsVerifier(true)
                }
            } catch (error) {
                console.error('Failed to load levels:', error)
            } finally {
                setIsLoadingLevels(false)
            }
        }
        loadLevels()
    }, [searchParams])

    return (
        <div className={styles.AdminContainer}>
            <div className={styles.Header}>
                <h1 className={styles.Title}>{isEdit ? 'Edit Completion' : 'Add Completed Level'}</h1>
                <p className={styles.Subtitle}>
                    {isEdit ? 'Update a completion record' : 'Add a completed level record to a user\'s profile'}
                </p>
            </div>

            {actionData?.message && (
                <div className={`${styles.SubmitMessage} ${actionData.success ? '' : styles.ErrorMessage}`}>
                    {actionData.message}
                </div>
            )}

            <Form method="post" className={styles.SubmitForm}>
                <input type="hidden" name="isEdit" value={isEdit} />

                <fieldset className={styles.FormSection}>
                    <legend className={styles.SectionTitle}>User & Level Information</legend>

                    <div className={styles.FormGroup}>
                        <label className={styles.Label}>
                            User ID (Discord ID) * {isEdit && <span className={styles.LockedBadge}>🔒 Locked</span>}
                            <input
                                type="text"
                                name="userId"
                                className={`${styles.Input} ${actionData?.errors?.userId ? styles.Error : ''} ${isEdit ? styles.LockedInput : ''}`}
                                placeholder="Enter Discord user ID"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                disabled={isEdit}
                                required={!isEdit}
                            />
                            {actionData?.errors?.userId && (
                                <span className={styles.ErrorText}>{actionData.errors.userId}</span>
                            )}
                            <div className={styles.FileInputHint}>
                                💡 {isEdit ? 'User ID cannot be changed' : 'Find the user ID from the leaderboard or profile page'}
                            </div>
                        </label>
                    </div>

                    <div className={styles.FormGroup}>
                        <label className={styles.Label}>
                            Level ID * {isEdit && <span className={styles.LockedBadge}>🔒 Locked</span>}
                            <select
                                name="levelId"
                                className={`${styles.Select} ${actionData?.errors?.levelId ? styles.Error : ''} ${isEdit ? styles.LockedInput : ''}`}
                                value={selectedLevelId}
                                onChange={(e) => setSelectedLevelId(e.target.value)}
                                disabled={isEdit}
                                required={!isEdit}
                            >
                                <option value="">Select a level</option>
                                {isLoadingLevels ? (
                                    <option disabled>Loading levels...</option>
                                ) : (
                                    levels.map(level => (
                                        <option key={level.id} value={level.id}>
                                            #{level.placement} - {level.levelName} (ID: {level.id})
                                        </option>
                                    ))
                                )}
                            </select>
                            {actionData?.errors?.levelId && (
                                <span className={styles.ErrorText}>{actionData.errors.levelId}</span>
                            )}
                            {isEdit && (
                                <div className={styles.FileInputHint}>
                                    💡 Level ID cannot be changed
                                </div>
                            )}
                        </label>
                    </div>

                    <div className={styles.FormGroup}>
                        <label className={styles.Label}>
                            YouTube Video Link (Optional)
                            <input
                                type="url"
                                name="youtubeLink"
                                className={styles.Input}
                                placeholder="https://youtube.com/watch?v=..."
                                value={youtubeLink}
                                onChange={(e) => setYoutubeLink(e.target.value)}
                            />
                            <div className={styles.FileInputHint}>
                                💡 Full YouTube URL (e.g., https://youtube.com/watch?v=dQw4w9WgXcQ)
                            </div>
                        </label>
                    </div>

                    <div className={styles.FormGroup}>
                        <label className={styles.Label}>
                            Completion Date (Optional)
                            <input
                                type="datetime-local"
                                name="completedAt"
                                className={styles.Input}
                                value={completedAt}
                                onChange={(e) => setCompletedAt(e.target.value)}
                            />
                            <div className={styles.FileInputHint}>
                                💡 Leave empty to use current date/time
                            </div>
                        </label>
                    </div>

                    <div className={styles.FormGroup}>
                        <label className={styles.CheckboxLabel}>
                            <input
                                type="checkbox"
                                name="isVerifier"
                                className={styles.Checkbox}
                                checked={isVerifier}
                                onChange={(e) => setIsVerifier(e.target.checked)}
                                value="true"
                            />
                            <span className={styles.CheckboxText}>This user is a verifier for this level</span>
                        </label>
                        <div className={styles.FileInputHint}>
                            💡 Verifiers are shown at the top of the level page and excluded from the leaderboard
                        </div>
                    </div>
                </fieldset>

                <div className={styles.SubmitSection}>
                    {actionData?.message && (
                        <div className={`${styles.SubmitFeedback} ${actionData.success ? styles.SuccessMessage : styles.ErrorMessage}`}>
                            {actionData.message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`${styles.SubmitBtn} ${styles.AddBtn}`}
                    >
                        {isSubmitting
                            ? (isEdit ? 'Updating Completion...' : 'Adding Completion...')
                            : (isEdit ? 'Update Completion' : 'Add Completion')}
                    </button>
                </div>
            </Form>
        </div>
    )
}
