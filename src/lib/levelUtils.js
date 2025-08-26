import levelsData from '../data/levels.js'

/**
 * Calculate points based on placement
 * Formula: points = totalLevels - (placement - 1)
 * Where placement 1 = 100 points, placement 100 = 1 point
 */
export function calculatePoints(placement, totalLevels = 100) {
    if (placement < 1 || placement > totalLevels) {
        throw new Error(`Placement must be between 1 and ${totalLevels}`)
    }
    return totalLevels - (placement - 1)
}

/**
 * Get all levels with calculated points
 */
export function getLevels() {
    return levelsData.getLevels()
}

/**
 * Get a specific level by placement
 */
export function getLevelByPlacement(placement) {
    return levelsData.getLevelByPlacement(placement)
}

/**
 * Get levels by difficulty
 */
export function getLevelsByDifficulty(difficulty) {
    return levelsData.getLevelsByDifficulty(difficulty)
}

/**
 * Get levels by tag
 */
export function getLevelsByTag(tagType, tagValue) {
    switch (tagType) {
        case 'difficulty':
            return levelsData.getLevelsByDifficulty(tagValue)
        case 'gamemode':
            return levelsData.getLevelsByGamemode(tagValue)
        case 'decorationStyle':
            return levelsData.getLevelsByDecorationStyle(tagValue)
        case 'extraTags':
            return levelsData.getLevelsByExtraTag(tagValue)
        default:
            return []
    }
}

/**
 * Search levels by name or creator
 */
export function searchLevels(query) {
    return levelsData.searchLevels(query)
}

/**
 * Get leaderboard data (top N levels)
 */
export function getLeaderboard(limit = 50) {
    return levelsData.getLeaderboard(limit)
}

/**
 * Add a new level (for future use)
 */
export function addLevel(placement, levelName, creator, verifier, id, youtubeVideoId, tags, description = "") {
    return levelsData.addLevel(placement, levelName, creator, verifier, id, youtubeVideoId, tags, description)
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