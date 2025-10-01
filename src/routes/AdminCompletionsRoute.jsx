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

    // Validation
    if (!userId) errors.userId = 'User ID is required'
    if (!levelId) errors.levelId = 'Level ID is required'

    if (Object.keys(errors).length > 0) {
        return { success: false, errors }
    }

    try {
        // Add the completed level
        const result = await supabaseOperations.addCompletedLevel(
            userId,
            levelId,
            youtubeLink || null,
            completedAt || null
        )

        if (!result) {
            throw new Error('Failed to add completed level')
        }

        return {
            success: true,
            message: `✅ Completed level added successfully for user ${userId}!`
        }
    } catch (error) {
        console.error('Error adding completed level:', error)
        return {
            success: false,
            message: error.message || 'Failed to add completed level. Please try again.'
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

    useEffect(() => {
        const loadLevels = async () => {
            try {
                const allLevels = await getLevels()
                setLevels(allLevels)

                // Pre-select level from URL params if provided
                const levelIdFromParams = searchParams.get('levelId')
                if (levelIdFromParams) {
                    setSelectedLevelId(levelIdFromParams)
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
                <h1 className={styles.Title}>Add Completed Level</h1>
                <p className={styles.Subtitle}>
                    Add a completed level record to a user's profile
                </p>
            </div>

            {actionData?.message && (
                <div className={`${styles.SubmitMessage} ${actionData.success ? '' : styles.ErrorMessage}`}>
                    {actionData.message}
                </div>
            )}

            <Form method="post" className={styles.SubmitForm}>
                <fieldset className={styles.FormSection}>
                    <legend className={styles.SectionTitle}>User & Level Information</legend>

                    <div className={styles.FormGroup}>
                        <label className={styles.Label}>
                            User ID (Discord ID) *
                            <input
                                type="text"
                                name="userId"
                                className={`${styles.Input} ${actionData?.errors?.userId ? styles.Error : ''}`}
                                placeholder="Enter Discord user ID"
                                required
                            />
                            {actionData?.errors?.userId && (
                                <span className={styles.ErrorText}>{actionData.errors.userId}</span>
                            )}
                            <div className={styles.FileInputHint}>
                                💡 Find the user ID from the leaderboard or profile page
                            </div>
                        </label>
                    </div>

                    <div className={styles.FormGroup}>
                        <label className={styles.Label}>
                            Level ID *
                            <select
                                name="levelId"
                                className={`${styles.Select} ${actionData?.errors?.levelId ? styles.Error : ''}`}
                                value={selectedLevelId}
                                onChange={(e) => setSelectedLevelId(e.target.value)}
                                required
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
                            />
                            <div className={styles.FileInputHint}>
                                💡 Leave empty to use current date/time
                            </div>
                        </label>
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
                        {isSubmitting ? 'Adding Completion...' : 'Add Completion'}
                    </button>
                </div>
            </Form>
        </div>
    )
}
