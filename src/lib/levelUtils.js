import { supabaseOperations } from './supabase.js'

/**
 * Calculate points based on placement
 * Formula: points = 1 + (99 * (totalLevels - placement) / (totalLevels - 1))
 * Where placement 1 = 100 points, last placement = 1 point
 */
export function calculatePoints(placement, totalLevels = 100) {
    if (placement < 1 || placement > totalLevels) {
        throw new Error(`Placement must be between 1 and ${totalLevels}`)
    }
    
    if (totalLevels === 1) {
        return 100
    }
    
    return Math.round(1 + (99 * (totalLevels - placement) / (totalLevels - 1)))
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
        const transformedLevels = supabaseLevels.map(level => ({
            ...level,
            tags: {
                difficulty: level.difficulty,
                gamemode: level.gamemode,
                decorationStyle: level.decorationStyle,
                extraTags: level.extraTags || []
            },
            // Calculate points based on placement
            points: calculatePoints(level.placement, supabaseLevels.length)
        }))
        
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
 * Add a new level via Supabase
 */
export async function addLevel(levelData) {
    try {
        return await supabaseOperations.upsertLevel(levelData)
    } catch (error) {
        console.error('Failed to add level to Supabase:', error)
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
    addLevel
}