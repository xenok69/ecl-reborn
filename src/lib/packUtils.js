import { supabaseOperations } from './supabase.js'
import { getLevels } from './levelUtils.js'

/**
 * Get all packs with enriched data (includes full level objects)
 * Transforms level IDs to full level objects for easier display
 * @returns {Array} Array of packs with enriched level data
 */
export async function getPacks() {
    try {
        const [packs, allLevels] = await Promise.all([
            supabaseOperations.getPacks(),
            getLevels()
        ])

        if (!packs || packs.length === 0) {
            console.log('📭 No packs found in database')
            return []
        }

        console.log(`✅ Found ${packs.length} pack(s)`)

        // Create a lookup map for levels by ID for efficient searching
        const levelMap = new Map()
        allLevels.forEach(level => {
            levelMap.set(String(level.id), level)
        })

        // Enrich packs with full level objects
        const enrichedPacks = packs.map(pack => {
            const levelIds = pack.level_ids || []
            const levels = levelIds
                .map(id => levelMap.get(String(id)))
                .filter(level => level !== undefined) // Remove levels that don't exist

            return {
                ...pack,
                levels, // Add full level objects
                levelCount: levels.length
            }
        })

        return enrichedPacks
    } catch (error) {
        console.error('❌ Failed to fetch packs:', error.message)
        throw error
    }
}

/**
 * Get a specific pack by ID with enriched level data
 * @param {string} packId - Pack ID
 * @returns {Object|null} Pack object with full level data or null
 */
export async function getPackById(packId) {
    try {
        const [pack, allLevels] = await Promise.all([
            supabaseOperations.getPackById(packId),
            getLevels()
        ])

        if (!pack) {
            console.log(`📭 Pack not found: ${packId}`)
            return null
        }

        // Create a lookup map for levels
        const levelMap = new Map()
        allLevels.forEach(level => {
            levelMap.set(String(level.id), level)
        })

        // Enrich pack with full level objects
        const levelIds = pack.level_ids || []
        const levels = levelIds
            .map(id => levelMap.get(String(id)))
            .filter(level => level !== undefined)

        return {
            ...pack,
            levels,
            levelCount: levels.length
        }
    } catch (error) {
        console.error(`❌ Failed to fetch pack ${packId}:`, error.message)
        throw error
    }
}

/**
 * Get packs grouped by category
 * @returns {Object} Object with categories as keys and pack arrays as values
 */
export async function getPacksByCategory() {
    try {
        const packs = await getPacks()

        const grouped = {}
        packs.forEach(pack => {
            const category = pack.category || 'Uncategorized'
            if (!grouped[category]) {
                grouped[category] = []
            }
            grouped[category].push(pack)
        })

        return grouped
    } catch (error) {
        console.error('❌ Failed to group packs by category:', error.message)
        throw error
    }
}

/**
 * Calculate total pack bonus points for a user
 * @param {string} userId - User ID
 * @returns {number} Total bonus points from completed packs
 */
export async function calculateUserPackPoints(userId) {
    try {
        const userActivity = await supabaseOperations.getUserActivity(userId)
        if (!userActivity) {
            return 0
        }

        const completedPackIds = (userActivity.completed_packs || []).map(entry => entry.packId)

        if (completedPackIds.length === 0) {
            return 0
        }

        // Fetch all packs to get bonus points
        const allPacks = await supabaseOperations.getPacks()
        const completedPacks = allPacks.filter(pack => completedPackIds.includes(pack.id))

        const totalPackPoints = completedPacks.reduce((sum, pack) => sum + (pack.bonus_points || 0), 0)

        console.log(`📦 User ${userId} has ${totalPackPoints} bonus points from ${completedPacks.length} completed pack(s)`)
        return totalPackPoints
    } catch (error) {
        console.error('❌ Failed to calculate user pack points:', error.message)
        return 0 // Return 0 on error to not break leaderboard
    }
}

/**
 * Get user's completed packs with full pack details
 * @param {string} userId - User ID
 * @returns {Array} Array of completed packs with details
 */
export async function getUserCompletedPacks(userId) {
    try {
        const [userActivity, allPacks] = await Promise.all([
            supabaseOperations.getUserActivity(userId),
            getPacks()
        ])

        if (!userActivity) {
            return []
        }

        const completedPackEntries = userActivity.completed_packs || []

        // Match completed pack IDs with full pack data
        const completedPacks = completedPackEntries
            .map(entry => {
                const pack = allPacks.find(p => p.id === entry.packId)
                if (pack) {
                    return {
                        ...pack,
                        completedAt: entry.completedAt
                    }
                }
                return null
            })
            .filter(pack => pack !== null)

        return completedPacks
    } catch (error) {
        console.error('❌ Failed to get user completed packs:', error.message)
        return []
    }
}

/**
 * Calculate pack completion progress for a user
 * Shows how many levels completed out of total for each pack
 * @param {string} userId - User ID
 * @returns {Array} Array of packs with completion progress
 */
export async function getUserPackProgress(userId) {
    try {
        const [userActivity, allPacks] = await Promise.all([
            supabaseOperations.getUserActivity(userId),
            getPacks()
        ])

        if (!userActivity || !allPacks || allPacks.length === 0) {
            return []
        }

        const completedLevelIds = (userActivity.completed_levels || []).map(entry => String(entry.lvl))
        const completedPackIds = (userActivity.completed_packs || []).map(entry => entry.packId)

        // Calculate progress for each pack
        const packProgress = allPacks.map(pack => {
            const packLevelIds = (pack.level_ids || []).map(id => String(id))
            const completedInPack = packLevelIds.filter(levelId =>
                completedLevelIds.includes(levelId)
            ).length

            const isCompleted = completedPackIds.includes(pack.id)
            const progress = packLevelIds.length > 0 ? (completedInPack / packLevelIds.length) * 100 : 0

            return {
                ...pack,
                completedLevels: completedInPack,
                totalLevels: packLevelIds.length,
                progress: Math.round(progress),
                isCompleted
            }
        })

        return packProgress
    } catch (error) {
        console.error('❌ Failed to get user pack progress:', error.message)
        return []
    }
}

/**
 * Add a new pack
 * @param {Object} packData - Pack data
 * @returns {Object} Created pack
 */
export async function addPack(packData) {
    try {
        return await supabaseOperations.addPack(packData)
    } catch (error) {
        console.error('Failed to add pack:', error)
        throw error
    }
}

/**
 * Update an existing pack
 * @param {string} packId - Pack ID
 * @param {Object} packData - Updated pack data
 * @returns {Object} Updated pack
 */
export async function updatePack(packId, packData) {
    try {
        return await supabaseOperations.updatePack(packId, packData)
    } catch (error) {
        console.error('Failed to update pack:', error)
        throw error
    }
}

/**
 * Delete a pack
 * @param {string} packId - Pack ID
 * @returns {boolean} Success
 */
export async function deletePack(packId) {
    try {
        return await supabaseOperations.deletePack(packId)
    } catch (error) {
        console.error('Failed to delete pack:', error)
        throw error
    }
}

export default {
    getPacks,
    getPackById,
    getPacksByCategory,
    calculateUserPackPoints,
    getUserCompletedPacks,
    getUserPackProgress,
    addPack,
    updatePack,
    deletePack
}
