import { supabaseOperations } from '../lib/supabase.js'
import levelsData from '../data/levels.js'

/**
 * Migration utility to transfer data from local JSON to Supabase
 * Run this once after setting up your Supabase database
 */
export async function migrateToSupabase() {
    console.log('🚀 Starting migration to Supabase...')
    
    try {
        // Get local data
        const localLevels = levelsData.getLevels()
        const { metadata, difficulties, gamemodes, decorationStyles, extraTagTypes } = levelsData
        
        console.log(`📊 Found ${localLevels.length} levels to migrate`)
        
        // 1. Skip metadata setup - using local data instead
        console.log('📝 Skipping metadata setup (using local data)')
        
        // 2. Migrate levels in batches to avoid overwhelming the database
        const batchSize = 10
        let migratedCount = 0
        let errors = []
        
        for (let i = 0; i < localLevels.length; i += batchSize) {
            const batch = localLevels.slice(i, i + batchSize)
            console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(localLevels.length / batchSize)}...`)
            
            for (const level of batch) {
                try {
                    // Transform the level data to match Supabase table structure
                    const supabaseLevel = {
                        id: level.id,
                        placement: level.placement,
                        levelName: level.levelName,
                        creator: level.creator,
                        verifier: level.verifier,
                        youtubeVideoId: level.youtubeVideoId,
                        difficulty: level.tags?.difficulty || level.difficulty,
                        gamemode: level.tags?.gamemode || level.gamemode,
                        decorationStyle: level.tags?.decorationStyle || level.decorationStyle,
                        extraTags: level.tags?.extraTags || level.extraTags || []
                    }
                    
                    console.log('📝 Transformed level data:', supabaseLevel)
                    
                    await supabaseOperations.upsertLevel(supabaseLevel)
                    migratedCount++
                    console.log(`✅ Migrated: ${level.levelName} (#${level.placement})`)
                } catch (levelError) {
                    console.error(`❌ Failed to migrate ${level.levelName}:`, levelError.message)
                    errors.push({ level: level.levelName, error: levelError.message })
                }
            }
            
            // Small delay between batches to be nice to the database
            await new Promise(resolve => setTimeout(resolve, 100))
        }
        
        console.log('🎉 Migration complete!')
        console.log(`📊 Successfully migrated: ${migratedCount}/${localLevels.length} levels`)
        
        if (errors.length > 0) {
            console.log(`⚠️ Errors encountered: ${errors.length}`)
            errors.forEach(({ level, error }) => {
                console.log(`  - ${level}: ${error}`)
            })
        }
        
        return {
            success: true,
            migratedCount,
            totalCount: localLevels.length,
            errors
        }
        
    } catch (error) {
        console.error('💥 Migration failed:', error)
        return {
            success: false,
            error: error.message
        }
    }
}

/**
 * Verify that Supabase data matches local data
 */
export async function verifyMigration() {
    console.log('🔍 Verifying migration...')
    
    try {
        const localLevels = levelsData.getLevels()
        const supabaseLevels = await supabaseOperations.getLevels()
        
        if (!supabaseLevels) {
            console.error('❌ Could not fetch Supabase data')
            return { success: false, error: 'Could not fetch Supabase data' }
        }
        
        console.log(`📊 Local levels: ${localLevels.length}`)
        console.log(`📊 Supabase levels: ${supabaseLevels.length}`)
        
        if (localLevels.length !== supabaseLevels.length) {
            console.warn('⚠️ Level count mismatch!')
        }
        
        // Check a few specific levels
        const sampleChecks = [1, 5, 10].filter(placement => placement <= localLevels.length)
        
        for (const placement of sampleChecks) {
            const localLevel = localLevels.find(l => l.placement === placement)
            const supabaseLevel = supabaseLevels.find(l => l.placement === placement)
            
            if (!localLevel || !supabaseLevel) {
                console.warn(`⚠️ Missing level at placement ${placement}`)
                continue
            }
            
            if (localLevel.levelName === supabaseLevel.levelName) {
                console.log(`✅ Placement ${placement}: ${localLevel.levelName} matches`)
            } else {
                console.warn(`⚠️ Placement ${placement}: Mismatch - Local: ${localLevel.levelName}, Supabase: ${supabaseLevel.levelName}`)
            }
        }
        
        return {
            success: true,
            localCount: localLevels.length,
            supabaseCount: supabaseLevels.length,
            matches: localLevels.length === supabaseLevels.length
        }
        
    } catch (error) {
        console.error('💥 Verification failed:', error)
        return { success: false, error: error.message }
    }
}