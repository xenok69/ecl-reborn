import { supabase } from '../lib/supabase.js'

/**
 * Database Repair Utility - Fix Invalid Placement Values
 *
 * This script repairs placement values in the levels table when they become
 * inconsistent (e.g., after failed deletions or manual edits).
 *
 * It will:
 * 1. Fetch all levels directly from Supabase (bypassing validation)
 * 2. Sort by current placement
 * 3. Renumber sequentially from 1 to N
 * 4. Update each level with correct placement
 */

/**
 * Check current placement issues
 */
export async function diagnosePlacements() {
    if (!supabase) {
        throw new Error('Supabase not configured')
    }

    console.log('🔍 Diagnosing placement issues...')

    try {
        // Fetch all levels directly, ordered by placement
        const { data: levels, error } = await supabase
            .from('levels')
            .select('id, placement, levelName')
            .order('placement', { ascending: true })

        if (error) {
            console.error('❌ Error fetching levels:', error)
            throw error
        }

        console.log(`\n📊 Found ${levels.length} levels in database`)
        console.log('Current placement values:')

        const issues = []
        let expectedPlacement = 1

        levels.forEach((level, index) => {
            const status = level.placement === expectedPlacement ? '✅' : '❌'
            console.log(`  ${status} ID: ${level.id} | Placement: ${level.placement} (expected: ${expectedPlacement}) | Name: ${level.levelName}`)

            if (level.placement !== expectedPlacement) {
                issues.push({
                    id: level.id,
                    name: level.levelName,
                    currentPlacement: level.placement,
                    expectedPlacement: expectedPlacement
                })
            }

            expectedPlacement++
        })

        console.log(`\n📈 Summary:`)
        console.log(`  Total levels: ${levels.length}`)
        console.log(`  Issues found: ${issues.length}`)

        if (issues.length > 0) {
            console.log(`\n⚠️ Levels with incorrect placement:`)
            issues.forEach(issue => {
                console.log(`    - "${issue.name}": currently ${issue.currentPlacement}, should be ${issue.expectedPlacement}`)
            })
        } else {
            console.log(`\n✅ All placements are correct!`)
        }

        return {
            totalLevels: levels.length,
            issues,
            levels
        }

    } catch (error) {
        console.error('💥 Diagnosis failed:', error)
        throw error
    }
}

/**
 * Repair placement values
 * @param {boolean} dryRun - If true, only shows what would be changed without applying
 */
export async function repairPlacements(dryRun = true) {
    if (!supabase) {
        throw new Error('Supabase not configured')
    }

    const mode = dryRun ? '🧪 DRY RUN MODE' : '🔧 REPAIR MODE'
    console.log(`\n${mode} - Starting placement repair...`)

    try {
        // First, diagnose the current state
        const diagnosis = await diagnosePlacements()

        if (diagnosis.issues.length === 0) {
            console.log('\n✅ No repairs needed - all placements are correct!')
            return {
                success: true,
                repaired: 0,
                message: 'No repairs needed'
            }
        }

        console.log(`\n${dryRun ? '📋 Would repair' : '🔧 Repairing'} ${diagnosis.issues.length} level(s)...`)

        const repairs = []
        let repairCount = 0

        // Renumber all levels sequentially
        for (let i = 0; i < diagnosis.levels.length; i++) {
            const level = diagnosis.levels[i]
            const correctPlacement = i + 1

            if (level.placement !== correctPlacement) {
                console.log(`  ${dryRun ? '📝 Would update' : '🔄 Updating'} "${level.levelName}": ${level.placement} → ${correctPlacement}`)

                if (!dryRun) {
                    // Actually update the database
                    const { error } = await supabase
                        .from('levels')
                        .update({ placement: correctPlacement })
                        .eq('id', level.id)

                    if (error) {
                        console.error(`❌ Failed to update ${level.levelName}:`, error)
                        throw error
                    }

                    console.log(`  ✅ Updated successfully`)
                }

                repairs.push({
                    id: level.id,
                    name: level.levelName,
                    oldPlacement: level.placement,
                    newPlacement: correctPlacement
                })

                repairCount++
            }
        }

        if (dryRun) {
            console.log(`\n📋 Dry run complete - ${repairCount} level(s) would be repaired`)
            console.log(`\n💡 To apply these changes, run: repairPlacements(false)`)
        } else {
            console.log(`\n✅ Repair complete - ${repairCount} level(s) fixed!`)
            console.log(`\n🎉 All placements are now sequential from 1 to ${diagnosis.levels.length}`)
        }

        return {
            success: true,
            repaired: repairCount,
            repairs,
            dryRun
        }

    } catch (error) {
        console.error('💥 Repair failed:', error)
        throw error
    }
}

/**
 * Verify that all placements are valid
 */
export async function verifyPlacements() {
    console.log('\n✅ Verifying placements...')

    const diagnosis = await diagnosePlacements()

    if (diagnosis.issues.length === 0) {
        console.log('\n🎉 Verification passed - all placements are valid!')
        return true
    } else {
        console.log(`\n⚠️ Verification failed - ${diagnosis.issues.length} issue(s) found`)
        return false
    }
}

// Export for easy import and use
export default {
    diagnosePlacements,
    repairPlacements,
    verifyPlacements
}
