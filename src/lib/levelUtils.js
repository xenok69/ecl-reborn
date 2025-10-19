import { supabaseOperations } from './supabase.js'

/**
 * Calculate points based on placement
 * Linear formula: placement 1 = 150 points, placement 150 = 1 point, placement > 150 = 0 points
 * Scales automatically if fewer than 150 levels exist
 */
export function calculatePoints(placement, totalLevels = 150) {
    if (placement < 1) {
        throw new Error(`Placement must be at least 1`)
    }

    // Legacy levels (placement > 150) get 0 points
    if (placement > 150) {
        return 0
    }

    // If there's only one level in the scoring range, it gets max points
    const maxScoringPlacement = Math.min(totalLevels, 150)
    if (maxScoringPlacement === 1) {
        return 150
    }

    // Linear scaling: 150 points at rank 1, 1 point at rank 150 (or max available)
    // Formula: points = 150 - (placement - 1) * (149 / (maxScoringPlacement - 1))
    const points = 150 - ((placement - 1) * (149 / (maxScoringPlacement - 1)))
    return Math.round(points)
}

/**
 * Get all levels with calculated points from Supabase
 * Returns empty array if no levels found
 */
export async function getLevels() {
    try {
        const supabaseLevels = await supabaseOperations.getLevels()

        if (!supabaseLevels) {
            console.log('📭 No levels found in database')
            return []
        }

        if (supabaseLevels.length === 0) {
            console.log('📭 Database is empty - no levels yet')
            return []
        }

        console.log(`✅ Using Supabase data - ${supabaseLevels.length} levels found`)

        // Transform Supabase flat data to match expected nested structure
        const transformedLevels = []
        const invalidLevels = []

        for (const level of supabaseLevels) {
            try {
                transformedLevels.push({
                    ...level,
                    tags: {
                        difficulty: level.difficulty,
                        gamemode: level.gamemode,
                        decorationStyle: level.decorationStyle,
                        extraTags: level.extraTags || []
                    },
                    // Calculate points based on placement
                    points: calculatePoints(level.placement, supabaseLevels.length)
                })
            } catch (pointsError) {
                // Log the problematic level but don't crash the entire app
                console.error(`⚠️ Invalid placement for level "${level.levelName}" (ID: ${level.id}): placement=${level.placement}, totalLevels=${supabaseLevels.length}`)
                invalidLevels.push({
                    id: level.id,
                    name: level.levelName,
                    placement: level.placement,
                    error: pointsError.message
                })
            }
        }

        // If there are invalid levels, provide detailed error information
        if (invalidLevels.length > 0) {
            console.error(`\n🚨 DATABASE CORRUPTION DETECTED 🚨`)
            console.error(`Found ${invalidLevels.length} level(s) with invalid placement values:`)
            invalidLevels.forEach(level => {
                console.error(`  - "${level.name}" (ID: ${level.id}): ${level.error}`)
            })
            console.error(`\n💡 To fix this, run the repair script:`)
            console.error(`   import { repairPlacements } from './utils/repairPlacements.js'`)
            console.error(`   await repairPlacements(false) // false = actually fix, true = dry run`)

            // Throw a more helpful error
            throw new Error(`Placement must be between 1 and ${supabaseLevels.length}`)
        }

        return transformedLevels

    } catch (error) {
        console.error('❌ Failed to fetch levels from Supabase:', error.message)
        throw new Error(`Database error: ${error.message}`)
    }
}

/**
 * Get a specific level by placement
 */
export async function getLevelByPlacement(placement) {
    const levels = await getLevels()
    return levels.find(level => level.placement === placement)
}

/**
 * Get levels by difficulty
 */
export async function getLevelsByDifficulty(difficulty) {
    const levels = await getLevels()
    return levels.filter(level => level.difficulty === difficulty)
}

/**
 * Get levels by tag
 */
export async function getLevelsByTag(tagType, tagValue) {
    const levels = await getLevels()
    
    switch (tagType) {
        case 'difficulty':
            return levels.filter(level => level.difficulty === tagValue)
        case 'gamemode':
            return levels.filter(level => level.gamemode === tagValue)
        case 'decorationStyle':
            return levels.filter(level => level.decorationStyle === tagValue)
        case 'extraTags':
            return levels.filter(level => level.extraTags && level.extraTags.includes(tagValue))
        default:
            return []
    }
}

/**
 * Search levels by name or creator
 */
export async function searchLevels(query) {
    const levels = await getLevels()
    const searchTerm = query.toLowerCase()
    
    return levels.filter(level => 
        level.levelName.toLowerCase().includes(searchTerm) ||
        level.creator.toLowerCase().includes(searchTerm) ||
        (level.verifier && level.verifier.toLowerCase().includes(searchTerm))
    )
}

/**
 * Get leaderboard data (top N levels)
 */
export async function getLeaderboard(limit = 50) {
    const levels = await getLevels()
    return levels.slice(0, limit)
}

/**
 * Add a new level via Supabase with placement shifting
 */
export async function addLevel(levelData) {
    try {
        return await supabaseOperations.addLevel(levelData)
    } catch (error) {
        console.error('Failed to add level to Supabase:', error)
        throw error
    }
}

/**
 * Update an existing level via Supabase with placement shifting
 * @param {string} oldLevelId - The current level ID
 * @param {object} levelData - The level data to update (excluding id)
 * @param {number} originalPlacement - The original placement
 * @param {string} newLevelId - Optional new level ID (if changing the ID)
 */
export async function updateLevel(oldLevelId, levelData, originalPlacement, newLevelId = null) {
    try {
        return await supabaseOperations.updateLevel(oldLevelId, levelData, originalPlacement, newLevelId)
    } catch (error) {
        console.error('Failed to update level in Supabase:', error)
        throw error
    }
}

/**
 * Delete a level via Supabase
 */
export async function deleteLevel(levelId) {
    try {
        return await supabaseOperations.deleteLevel(levelId)
    } catch (error) {
        console.error('Failed to delete level from Supabase:', error)
        throw error
    }
}

export default {
    calculatePoints,
    getLevels,
    getLevelByPlacement,
    getLevelsByDifficulty,
    getLevelsByTag,
    searchLevels,
    getLeaderboard,
    addLevel,
    updateLevel,
    deleteLevel
}