import { useState, useEffect } from 'react'
import { Form, useActionData, useNavigation, redirect, useLoaderData, useParams } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { getLevels } from '../lib/levelUtils'
import { getPackById, addPack, updatePack, deletePack } from '../lib/packUtils'
import styles from './AdminPacksRoute.module.css'

// Predefined pack categories
const PACK_CATEGORIES = [
    'Beginner Packs',
    'Intermediate Packs',
    'Advanced Packs',
    'Expert Packs',
    'Theme Packs',
    'Challenge Packs',
    'Creator Packs',
    'Special Packs'
]

export const editPackLoader = async ({ params }) => {
    const packId = params.packId
    console.log('🔍 Edit Pack Loader - Looking for pack with ID:', packId)

    const pack = await getPackById(packId)

    if (!pack) {
        console.error('❌ Edit Pack Loader - Pack not found:', packId)
        throw new Response('Pack not found', { status: 404 })
    }

    console.log('✅ Edit Pack Loader - Found pack:', pack.name)
    return { pack, isEdit: true }
}

export const adminPacksAction = async ({ request, params }) => {
    const formData = await request.formData()
    const action = formData.get('_action')

    // Handle deletion
    if (action === 'delete') {
        const packId = params.packId
        try {
            await deletePack(packId)
            console.log('✅ Pack deleted successfully:', packId)
            return redirect('/packs')
        } catch (error) {
            console.error('❌ Failed to delete pack:', error)
            return {
                success: false,
                errors: { general: `Failed to delete pack: ${error.message}` }
            }
        }
    }

    // Handle create/update
    const errors = {}
    const isEditMode = !!params?.packId
    const packId = isEditMode ? params.packId : formData.get('packId')?.trim()

    // Get form values
    const name = formData.get('name')?.trim()
    const description = formData.get('description')?.trim()
    const category = formData.get('category')?.trim()
    const bonusPoints = formData.get('bonusPoints')
    const selectedLevelIds = formData.getAll('selectedLevelIds')

    // Validation
    if (!name) errors.name = 'Pack name is required'
    if (!packId && !isEditMode) errors.packId = 'Pack ID is required'
    if (!category) errors.category = 'Category is required'
    if (!bonusPoints || isNaN(bonusPoints) || Number(bonusPoints) < 0) {
        errors.bonusPoints = 'Valid bonus points required (must be a positive number)'
    }
    if (selectedLevelIds.length === 0) {
        errors.levels = 'At least one level must be selected'
    }

    // Check for duplicate pack ID (only in create mode)
    if (!isEditMode && packId) {
        const existingPack = await getPackById(packId).catch(() => null)
        if (existingPack) {
            errors.packId = 'A pack with this ID already exists'
        }
    }

    if (Object.keys(errors).length > 0) {
        return { success: false, errors }
    }

    // Get user info
    const submittedByUserId = formData.get('submittedByUserId')

    // Prepare pack data
    const packData = {
        name,
        description: description || '',
        category,
        bonus_points: Number(bonusPoints),
        level_ids: selectedLevelIds,
        created_by_user_id: submittedByUserId
    }

    // Add ID for create mode
    if (!isEditMode) {
        packData.id = packId
    }

    try {
        if (isEditMode) {
            console.log('📝 Updating pack:', packId, packData)
            await updatePack(packId, packData)
            console.log('✅ Pack updated successfully')
            return redirect('/packs')
        } else {
            console.log('➕ Creating new pack:', packData)
            await addPack(packData)
            console.log('✅ Pack created successfully')
            return redirect('/packs')
        }
    } catch (error) {
        console.error('❌ Failed to save pack:', error)
        return {
            success: false,
            errors: { general: `Failed to save pack: ${error.message}` }
        }
    }
}

export default function AdminPacksRoute() {
    const { user } = useAuth()
    const navigation = useNavigation()
    const actionData = useActionData()
    const loaderData = useLoaderData()
    const params = useParams()

    const isEditMode = !!loaderData?.isEdit
    const existingPack = loaderData?.pack

    const isSubmitting = navigation.state === 'submitting'

    // State for form fields
    const [packId, setPackId] = useState(existingPack?.id || '')
    const [name, setName] = useState(existingPack?.name || '')
    const [description, setDescription] = useState(existingPack?.description || '')
    const [category, setCategory] = useState(existingPack?.category || '')
    const [bonusPoints, setBonusPoints] = useState(existingPack?.bonus_points || 30)
    const [selectedLevelIds, setSelectedLevelIds] = useState(existingPack?.level_ids || [])
    const [allLevels, setAllLevels] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    // Load all levels on mount
    useEffect(() => {
        getLevels().then(levels => {
            setAllLevels(levels)
        }).catch(error => {
            console.error('Failed to load levels:', error)
        })
    }, [])

    // Filter levels based on search query
    const filteredLevels = allLevels.filter(level => {
        const query = searchQuery.toLowerCase()
        return (
            level.levelName.toLowerCase().includes(query) ||
            level.creator.toLowerCase().includes(query) ||
            String(level.placement).includes(query)
        )
    })

    // Get selected levels with full data
    const selectedLevels = selectedLevelIds
        .map(id => allLevels.find(level => String(level.id) === String(id)))
        .filter(level => level !== undefined)

    // Toggle level selection
    const toggleLevel = (levelId) => {
        setSelectedLevelIds(prev => {
            const idStr = String(levelId)
            if (prev.includes(idStr)) {
                return prev.filter(id => id !== idStr)
            } else {
                return [...prev, idStr]
            }
        })
    }

    // Generate pack ID from name
    const generatePackId = () => {
        if (name && !isEditMode) {
            const id = 'pack_' + name.toLowerCase()
                .replace(/[^a-z0-9]+/g, '_')
                .replace(/^_+|_+$/g, '')
            setPackId(id)
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>
                    {isEditMode ? 'Edit Pack' : 'Create New Pack'}
                </h1>
                {isEditMode && (
                    <button
                        type="button"
                        className={styles.deleteButton}
                        onClick={() => setShowDeleteConfirm(true)}
                    >
                        Delete Pack
                    </button>
                )}
            </div>

            {actionData?.errors?.general && (
                <div className={styles.errorMessage}>
                    {actionData.errors.general}
                </div>
            )}

            <Form method="post" className={styles.form}>
                <input type="hidden" name="submittedByUserId" value={user?.id || ''} />

                {/* Pack Information */}
                <fieldset className={styles.fieldset}>
                    <legend className={styles.legend}>Pack Information</legend>

                    <div className={styles.formGroup}>
                        <label htmlFor="name" className={styles.label}>
                            Pack Name *
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onBlur={generatePackId}
                            className={styles.input}
                            required
                        />
                        {actionData?.errors?.name && (
                            <span className={styles.fieldError}>{actionData.errors.name}</span>
                        )}
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="packId" className={styles.label}>
                            Pack ID * {!isEditMode && <span className={styles.hint}>(auto-generated from name)</span>}
                        </label>
                        <input
                            type="text"
                            id="packId"
                            name="packId"
                            value={packId}
                            onChange={(e) => setPackId(e.target.value)}
                            className={styles.input}
                            disabled={isEditMode}
                            required
                        />
                        {actionData?.errors?.packId && (
                            <span className={styles.fieldError}>{actionData.errors.packId}</span>
                        )}
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="description" className={styles.label}>
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className={styles.textarea}
                            rows={3}
                            placeholder="Describe the pack's theme or requirements..."
                        />
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label htmlFor="category" className={styles.label}>
                                Category *
                            </label>
                            <select
                                id="category"
                                name="category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className={styles.select}
                                required
                            >
                                <option value="">Select category...</option>
                                {PACK_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            {actionData?.errors?.category && (
                                <span className={styles.fieldError}>{actionData.errors.category}</span>
                            )}
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="bonusPoints" className={styles.label}>
                                Bonus Points *
                            </label>
                            <input
                                type="number"
                                id="bonusPoints"
                                name="bonusPoints"
                                value={bonusPoints}
                                onChange={(e) => setBonusPoints(e.target.value)}
                                className={styles.input}
                                min="0"
                                step="1"
                                required
                            />
                            {actionData?.errors?.bonusPoints && (
                                <span className={styles.fieldError}>{actionData.errors.bonusPoints}</span>
                            )}
                        </div>
                    </div>
                </fieldset>

                {/* Level Selection */}
                <fieldset className={styles.fieldset}>
                    <legend className={styles.legend}>
                        Levels in Pack ({selectedLevelIds.length} selected)
                    </legend>

                    {actionData?.errors?.levels && (
                        <div className={styles.fieldError}>{actionData.errors.levels}</div>
                    )}

                    {/* Selected Levels */}
                    {selectedLevels.length > 0 && (
                        <div className={styles.selectedLevelsSection}>
                            <h4 className={styles.sectionTitle}>Selected Levels</h4>
                            <div className={styles.selectedLevelsList}>
                                {selectedLevels.map(level => (
                                    <div key={level.id} className={styles.selectedLevel}>
                                        <div className={styles.selectedLevelInfo}>
                                            <span className={styles.levelPlacement}>#{level.placement}</span>
                                            <span className={styles.levelName}>{level.levelName}</span>
                                            <span className={styles.levelCreator}>by {level.creator}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => toggleLevel(level.id)}
                                            className={styles.removeButton}
                                        >
                                            Remove
                                        </button>
                                        <input
                                            type="hidden"
                                            name="selectedLevelIds"
                                            value={level.id}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Level Search and Selection */}
                    <div className={styles.levelSearchSection}>
                        <h4 className={styles.sectionTitle}>Add Levels</h4>
                        <input
                            type="text"
                            placeholder="Search levels by name, creator, or placement..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                        <div className={styles.levelSelectList}>
                            {filteredLevels.slice(0, 20).map(level => {
                                const isSelected = selectedLevelIds.includes(String(level.id))
                                return (
                                    <button
                                        key={level.id}
                                        type="button"
                                        onClick={() => toggleLevel(level.id)}
                                        className={`${styles.levelSelectItem} ${isSelected ? styles.levelSelectItemSelected : ''}`}
                                    >
                                        <div className={styles.levelSelectInfo}>
                                            <span className={styles.levelPlacement}>#{level.placement}</span>
                                            <span className={styles.levelName}>{level.levelName}</span>
                                            <span className={styles.levelCreator}>by {level.creator}</span>
                                        </div>
                                        <span className={styles.levelSelectCheckbox}>
                                            {isSelected ? '✓' : '+'}
                                        </span>
                                    </button>
                                )
                            })}
                            {filteredLevels.length > 20 && (
                                <div className={styles.moreResults}>
                                    + {filteredLevels.length - 20} more levels (refine search to see more)
                                </div>
                            )}
                            {filteredLevels.length === 0 && (
                                <div className={styles.noResults}>
                                    No levels found
                                </div>
                            )}
                        </div>
                    </div>
                </fieldset>

                {/* Submit Button */}
                <div className={styles.submitSection}>
                    <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Pack' : 'Create Pack')}
                    </button>
                </div>
            </Form>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className={styles.modal} onClick={() => setShowDeleteConfirm(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <h3>Delete Pack?</h3>
                        <p>Are you sure you want to delete "{existingPack?.name}"?</p>
                        <p className={styles.warningText}>
                            This action cannot be undone. User progress on this pack will be lost.
                        </p>
                        <div className={styles.modalButtons}>
                            <Form method="post">
                                <input type="hidden" name="_action" value="delete" />
                                <button type="submit" className={styles.confirmDeleteButton}>
                                    Yes, Delete Pack
                                </button>
                            </Form>
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(false)}
                                className={styles.cancelButton}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
