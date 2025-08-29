import { useState, useRef } from 'react'
import { Form, useActionData, useNavigation, redirect } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { useLoading } from '../components/LoadingContext'
import { difficulties, gamemodes, decorationStyles, extraTagTypes } from '../data/levels.js'
import styles from './AdminSubmitRoute.module.css'

export const adminSubmitAction = async ({ request }) => {
    const formData = await request.formData()
    const errors = {}

    // Get form values
    const levelName = formData.get('levelName')?.trim()
    const placement = formData.get('placement')
    const creator = formData.get('creator')?.trim()
    const verifier = formData.get('verifier')?.trim()
    const levelId = formData.get('levelId')?.trim()
    const youtubeVideoId = formData.get('youtubeVideoId')?.trim()
    const videoFile = formData.get('videoFile')
    const difficulty = formData.get('difficulty')
    const gamemode = formData.get('gamemode')
    const decorationStyle = formData.get('decorationStyle')
    const selectedExtraTags = formData.getAll('selectedExtraTags')

    // Validation
    if (!levelName) errors.levelName = 'Level name is required'
    if (!placement) errors.placement = 'Placement is required'
    if (!creator) errors.creator = 'Creator is required'
    if (!verifier) errors.verifier = 'Verifier is required'
    if (!levelId) errors.levelId = 'Level ID is required'
    if (!difficulty) errors.difficulty = 'Difficulty is required'
    if (!gamemode) errors.gamemode = 'Gamemode is required'
    if (!decorationStyle) errors.decorationStyle = 'Decoration style is required'

    // Validate placement is a number
    if (placement && isNaN(parseInt(placement))) {
        errors.placement = 'Placement must be a number'
    }

    // Validate video (YouTube ID only for now - file uploads disabled due to Netlify limitations)
    if (!youtubeVideoId) {
        errors.video = 'YouTube video ID is required'
    }

    if (Object.keys(errors).length > 0) {
        return { success: false, errors }
    }

    try {
        // Use YouTube video ID directly (file upload disabled due to Netlify limitations)
        let videoPath = youtubeVideoId
        
        // Prepare level data
        const levelData = {
            placement: parseInt(placement),
            levelName,
            creator,
            verifier,
            id: levelId,
            youtubeVideoId: videoPath,
            tags: {
                difficulty,
                gamemode,
                decorationStyle,
                extraTags: selectedExtraTags
            },
            addedDate: new Date().toISOString().split('T')[0]
        }
        
        // Add level to the levels.json file and push to staging
        const result = await addLevelToJson(levelData)
        
        return { 
            success: true, 
            message: result.isDevelopment 
                ? `Level "${levelName}" validated successfully! (Development Mode) 🧪`
                : result.isGitHubPages
                ? `Level "${levelName}" validated successfully! (GitHub Pages Mode) 📄`
                : `Level "${levelName}" has been added to the main list successfully! 🚀`,
            data: result
        }
        
    } catch (error) {
        console.error('Error submitting level:', error)
        
        // Handle different types of errors
        if (error.message.includes('Failed to submit level')) {
            return {
                success: false,
                message: 'Failed to submit to staging branch. Please check your permissions and try again.'
            }
        }
        
        if (error.message.includes('network') || error.name === 'TypeError') {
            return {
                success: false,
                message: 'Network error. Please check your connection and try again.'
            }
        }
        
        return { 
            success: false, 
            message: error.message || 'Error adding level. Please try again.' 
        }
    }
}

const addLevelToJson = async (levelData) => {
    try {
        // Read current levels.json - try multiple paths
        const possiblePaths = [
            '/levels.json',
            './levels.json',
            './src/data/levels.json',
            '/src/data/levels.json'
        ]
        
        let response, responseText, currentData
        let lastError
        
        for (const path of possiblePaths) {
            try {
                console.log('📖 Trying to fetch levels.json from:', path)
                response = await fetch(path)
                
                if (response.ok) {
                    console.log('✅ Found levels.json at:', path)
                    break
                } else {
                    console.log('❌ Not found at:', path, 'Status:', response.status)
                    lastError = `HTTP ${response.status} at ${path}`
                }
            } catch (err) {
                console.log('❌ Error fetching from:', path, err.message)
                lastError = err.message
            }
        }
        
        if (!response || !response.ok) {
            // Fallback: use the data directly from the imported module
            console.log('⚠️ Cannot fetch levels.json, using imported data as fallback')
            try {
                const { levels: importedLevels, metadata, difficulties, gamemodes, decorationStyles, extraTagTypes } = await import('../data/levels.js')
                currentData = {
                    metadata: {
                        ...metadata,
                        get totalLevels() { return importedLevels.length }
                    },
                    difficulties,
                    gamemodes, 
                    decorationStyles,
                    extraTagTypes,
                    levels: importedLevels
                }
                console.log('✅ Using imported levels data:', currentData.levels.length, 'levels')
            } catch (importError) {
                console.error('❌ Cannot import levels.js either:', importError)
                throw new Error(`Cannot load levels data: ${lastError || importError.message}`)
            }
        } else {
            console.log('📄 Response status:', response.status)
            console.log('📄 Response headers:', Object.fromEntries(response.headers))
            
            // Get the raw text first to debug JSON issues
            responseText = await response.text()
            console.log('📝 Raw levels.json content (first 200 chars):', responseText.substring(0, 200))
            
            // Try to parse as JSON
            try {
                currentData = JSON.parse(responseText)
                console.log('✅ Successfully parsed levels.json')
            } catch (parseError) {
                console.error('❌ JSON parse error in levels.json:', parseError)
                console.error('📄 Full response text:', responseText)
                throw new Error(`levels.json contains invalid JSON: ${parseError.message}`)
            }
        }
        
        const newPlacement = levelData.placement
        
        // Shift existing levels down if necessary
        currentData.levels.forEach(level => {
            if (level.placement >= newPlacement) {
                level.placement += 1
            }
        })
        
        // Add new level to the levels array
        currentData.levels.push(levelData)
        
        // Sort levels by placement to ensure correct order
        currentData.levels.sort((a, b) => a.placement - b.placement)
        
        // Update lastUpdated
        currentData.metadata.lastUpdated = new Date().toISOString().split('T')[0]
        
        // Check if we're in development mode or on GitHub Pages
        const isDevelopment = window.location.hostname === 'localhost' || 
                             window.location.hostname === '127.0.0.1' ||
                             window.location.port === '5173' ||
                             import.meta.env.DEV
        
        const isGitHubPages = window.location.hostname.includes('github.io')
        
        console.log('🔍 Environment check:')
        console.log('Hostname:', window.location.hostname)
        console.log('isDevelopment:', isDevelopment)
        console.log('isGitHubPages:', isGitHubPages)
        console.log('Should bypass:', isDevelopment || isGitHubPages)
        
        if (isDevelopment || isGitHubPages) {
            // GitHub Pages / Development fallback - just log the data and simulate success
            console.log('🚧 GITHUB PAGES / DEV MODE - Netlify functions not available')
            console.log('📝 Level data that would be submitted:')
            console.log('Level:', levelData)
            console.log('Updated levels.json:', JSON.stringify(currentData, null, 2))
            
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            return {
                success: true,
                message: `Level "${levelData.levelName}" validated successfully! (GitHub Pages - no backend submission) 📄`,
                data: { levelData, updatedData: currentData },
                isDevelopment: true,
                isGitHubPages: isGitHubPages
            }
        }

        // Final safety check - should never reach here on GitHub Pages
        if (window.location.hostname.includes('github.io')) {
            console.error('🚨 ERROR: Attempting to call Netlify function on GitHub Pages!')
            throw new Error('Cannot call Netlify functions on GitHub Pages. Deploy to Netlify for full functionality.')
        }

        // Send to backend API for staging branch update
        console.log('Sending request to:', '/.netlify/functions/submit-level')
        console.log('Request data:', { levelData, updatedData: currentData })

        const result = await fetch('/.netlify/functions/submit-level', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}` // Implement this based on your auth
            },
            body: JSON.stringify({
                action: 'add_level',
                levelData,
                updatedData: currentData,
                targetBranch: 'main', // Push directly to main
                commitMessage: `Added Level to data list: ${levelData.levelName}`
            })
        })

        console.log('Response status:', result.status)
        console.log('Response headers:', Object.fromEntries(result.headers))

        // Get response text first to debug
        const resultText = await result.text()
        console.log('Raw response:', resultText)
        console.log('Response length:', resultText.length)

        // Check for empty response
        if (!resultText || resultText.trim() === '') {
            console.error('❌ Received empty response from Netlify function')
            throw new Error('Netlify function returned empty response. Check function deployment and logs.')
        }

        // Check if response looks like HTML (Netlify error page)
        if (resultText.includes('<html') || resultText.includes('<!DOCTYPE')) {
            console.error('❌ Received HTML instead of JSON - likely a Netlify function error')
            throw new Error('Netlify function returned HTML error page. Check function deployment and environment variables.')
        }

        // Try to parse as JSON
        let responseData
        try {
            responseData = JSON.parse(resultText)
        } catch (parseError) {
            console.error('JSON parse error:', parseError)
            console.error('Response was:', resultText)
            console.error('First 10 characters:', JSON.stringify(resultText.substring(0, 10)))
            throw new Error(`Server returned invalid JSON. Response: ${resultText.substring(0, 200)}...`)
        }

        if (!result.ok) {
            throw new Error(responseData.message || `HTTP ${result.status}: Failed to submit level`)
        }

        console.log('Level submitted successfully:', responseData)
        
        return responseData
        
    } catch (error) {
        console.error('Error updating levels.json:', error)
        throw error
    }
}

// Helper function to get auth token (implement based on your auth system)
const getAuthToken = () => {
    // This should return the actual auth token from your auth system
    // For now, return a placeholder
    return localStorage.getItem('authToken') || 'placeholder-token'
}

export default function AdminSubmitRoute() {
    const { user, isAuthenticated } = useAuth()
    const { setIsLoading } = useLoading()
    const navigation = useNavigation()
    const actionData = useActionData()
    const fileInputRef = useRef(null)
    
    const [extraTags, setExtraTags] = useState([])

    // Check if user is admin (temporarily disabled for testing)
    const isAdmin = true
    const isSubmitting = navigation.state === 'submitting'

    const handleExtraTagsChange = (tag) => {
        setExtraTags(prev => 
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        )
    }

    // Protection temporarily disabled for testing
    // if (!isAuthenticated) {
    //     return (
    //         <div className={styles.AdminContainer}>
    //             <div className={styles.ErrorMessage}>
    //                 <h2>Access Denied</h2>
    //                 <p>Please sign in to access this page.</p>
    //             </div>
    //         </div>
    //     )
    // }

    // if (!isAdmin) {
    //     return (
    //         <div className={styles.AdminContainer}>
    //             <div className={styles.ErrorMessage}>
    //                 <h2>Admin Access Required</h2>
    //                 <p>You don't have permission to access this page. Admin privileges required.</p>
    //             </div>
    //         </div>
    //     )
    // }

    return (
        <div className={styles.AdminContainer}>
            <div className={styles.Header}>
                <h1 className={styles.Title}>Admin Level Submission</h1>
                <p className={styles.Subtitle}>
                    Review and approve levels submitted for the Eclipse Challenge List
                </p>
                {window.location.hostname.includes('github.io') && (
                    <div style={{
                        background: '#fff3cd',
                        border: '1px solid #ffeaa7',
                        borderRadius: '4px',
                        padding: '12px',
                        margin: '16px 0',
                        color: '#856404'
                    }}>
                        📄 <strong>GitHub Pages Mode:</strong> Form validation only - no backend submission available. 
                        Deploy to Netlify to enable full functionality.
                    </div>
                )}
            </div>

            {actionData?.message && (
                <div className={`${styles.SubmitMessage} ${actionData.success ? '' : styles.ErrorMessage}`}>
                    {actionData.message}
                </div>
            )}

            <Form method="post" className={styles.SubmitForm} encType="multipart/form-data">
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
                                Placement *
                                <input
                                    type="number"
                                    name="placement"
                                    className={`${styles.Input} ${actionData?.errors?.placement ? styles.Error : ''}`}
                                    placeholder="Enter placement number"
                                    min="1"
                                    required
                                />
                                {actionData?.errors?.placement && <span className={styles.ErrorText}>{actionData.errors.placement}</span>}
                                <div className={styles.PlacementHint}>
                                    💡 Existing levels at this placement and below will automatically shift down
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
                    {actionData?.errors?.video && <span className={styles.ErrorText}>{actionData.errors.video}</span>}
                    
                    <div className={styles.FormGroup}>
                        <label className={styles.Label}>
                            YouTube Video ID *
                            <input
                                type="text"
                                name="youtubeVideoId"
                                className={`${styles.Input} ${actionData?.errors?.video ? styles.Error : ''}`}
                                placeholder="Enter YouTube video ID (e.g., dQw4w9WgXcQ)"
                                required
                            />
                            <div className={styles.FileInputHint}>
                                💡 Extract the video ID from the YouTube URL. For example: https://youtube.com/watch?v=<strong>dQw4w9WgXcQ</strong>
                            </div>
                        </label>
                    </div>

                    <div className={styles.FormGroup}>
                        <div className={styles.FileInputHint} style={{fontStyle: 'italic', color: '#666'}}>
                            📹 File uploads are currently disabled due to hosting limitations. Please use YouTube links only.
                        </div>
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
                        <span className={styles.Label}>Extra Tags</span>
                        <div className={styles.CheckboxGrid}>
                            {Object.entries(extraTagTypes).map(([key, value]) => (
                                <label key={key} className={styles.CheckboxLabel}>
                                    <input
                                        type="checkbox"
                                        name="extraTags"
                                        value={value}
                                        checked={extraTags.includes(value)}
                                        onChange={() => handleExtraTagsChange(value)}
                                        className={styles.Checkbox}
                                    />
                                    <span className={styles.CheckboxText}>{value}</span>
                                </label>
                            ))}
                        </div>
                        {/* Hidden inputs to submit selected extra tags */}
                        {extraTags.map(tag => (
                            <input key={tag} type="hidden" name="selectedExtraTags" value={tag} />
                        ))}
                    </div>
                </fieldset>


                <div className={styles.SubmitSection}>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`${styles.SubmitBtn} ${styles.AddBtn}`}
                    >
                        {isSubmitting ? 'Adding Level...' : 'Add Level'}
                    </button>
                </div>
            </Form>
        </div>
    )
}