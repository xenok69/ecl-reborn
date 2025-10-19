import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase configuration missing. Using fallback to local JSON data.')
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Export supabase in operations for direct access
export { supabase as supabaseClient }

// Configuration: Enable automatic placement repair after operations
// Set to false if you have database triggers installed (see supabase_placement_fix.sql)
const AUTO_REPAIR_ENABLED = true

/**
 * Automatically repair placement sequence after database operations
 * This ensures placements are always sequential (1, 2, 3, ..., N)
 * Only runs if AUTO_REPAIR_ENABLED is true
 *
 * @returns {Object|null} - Repair summary { repaired: number, gaps: number[], duplicates: number[] } or null if disabled
 */
async function autoRepairPlacements() {
  if (!AUTO_REPAIR_ENABLED || !supabase) {
    return null
  }

  const startTime = Date.now()

  try {
    console.log('🔄 Auto-repairing placements...')

    // Fetch all levels ordered by current placement
    const { data: levels, error: fetchError } = await supabase
      .from('levels')
      .select('id, placement, levelName')
      .order('placement', { ascending: true })

    if (fetchError) {
      console.error('❌ Auto-repair fetch failed:', fetchError)
      console.error('Error details:', {
        message: fetchError.message,
        code: fetchError.code,
        details: fetchError.details
      })
      return null
    }

    if (!levels || levels.length === 0) {
      console.log('ℹ️  No levels found - nothing to repair')
      return { repaired: 0, gaps: [], duplicates: [] }
    }

    // Detect issues: gaps, duplicates, out-of-order placements
    const issues = {
      gaps: [],
      duplicates: [],
      outOfOrder: []
    }

    const seenPlacements = new Set()
    let expectedPlacement = 1

    for (let i = 0; i < levels.length; i++) {
      const level = levels[i]

      // Check for gaps
      if (level.placement !== expectedPlacement) {
        issues.gaps.push({
          expected: expectedPlacement,
          actual: level.placement,
          levelId: level.id,
          levelName: level.levelName
        })
      }

      // Check for duplicates
      if (seenPlacements.has(level.placement)) {
        issues.duplicates.push({
          placement: level.placement,
          levelId: level.id,
          levelName: level.levelName
        })
      }
      seenPlacements.add(level.placement)

      expectedPlacement++
    }

    // Log detected issues
    if (issues.gaps.length > 0 || issues.duplicates.length > 0) {
      console.log('📊 Placement issues detected:')
      if (issues.gaps.length > 0) {
        console.log(`  ⚠️  Gaps: ${issues.gaps.length}`)
        issues.gaps.forEach(gap => {
          console.log(`    - "${gap.levelName}" (ID: ${gap.levelId}): placement ${gap.actual}, expected ${gap.expected}`)
        })
      }
      if (issues.duplicates.length > 0) {
        console.log(`  ⚠️  Duplicates: ${issues.duplicates.length}`)
        issues.duplicates.forEach(dup => {
          console.log(`    - "${dup.levelName}" (ID: ${dup.levelId}): duplicate placement ${dup.placement}`)
        })
      }
    }

    // Repair all placements to be sequential
    let repairCount = 0
    const repairedLevels = []

    for (let i = 0; i < levels.length; i++) {
      const level = levels[i]
      const correctPlacement = i + 1

      if (level.placement !== correctPlacement) {
        console.log(`  🔧 Repairing "${level.levelName}": ${level.placement} → ${correctPlacement}`)

        const { error: updateError } = await supabase
          .from('levels')
          .update({ placement: correctPlacement })
          .eq('id', level.id)

        if (updateError) {
          console.error(`❌ Failed to repair level "${level.levelName}" (ID: ${level.id}):`, updateError)
          console.error('Error details:', {
            message: updateError.message,
            code: updateError.code,
            details: updateError.details
          })
          // Continue with other repairs even if one fails
        } else {
          repairCount++
          repairedLevels.push({
            id: level.id,
            name: level.levelName,
            oldPlacement: level.placement,
            newPlacement: correctPlacement
          })
        }
      }
    }

    const duration = Date.now() - startTime

    if (repairCount > 0) {
      console.log(`✅ Auto-repair completed: ${repairCount} level(s) fixed in ${duration}ms`)
      repairedLevels.forEach(level => {
        console.log(`   ✓ "${level.name}": ${level.oldPlacement} → ${level.newPlacement}`)
      })
    } else {
      console.log(`✅ Auto-repair completed: No repairs needed (${duration}ms)`)
    }

    return {
      repaired: repairCount,
      gaps: issues.gaps.map(g => g.expected),
      duplicates: issues.duplicates.map(d => d.placement),
      duration,
      repairedLevels
    }
  } catch (error) {
    console.error('💥 Auto-repair failed with exception:', error)
    console.error('Stack trace:', error.stack)
    return null
  }
}

// Database operations
export const supabaseOperations = {
  // Expose supabase client
  supabase,
  // Get all levels with metadata
  async getLevels() {
    if (!supabase) {
      console.warn('Supabase not configured, using fallback')
      return null
    }

    try {
      const { data, error } = await supabase
        .from('levels')
        .select('*')
        .order('placement', { ascending: true })

      if (error) {
        console.error('Error fetching levels from Supabase:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Supabase connection error:', error)
      return null
    }
  },

  // Get metadata (difficulties, gamemodes, etc.) - OPTIONAL
  async getMetadata() {
    if (!supabase) {
      console.warn('Supabase not configured, using fallback')
      return null
    }

    try {
      const { data, error } = await supabase
        .from('metadata')
        .select('*')
        .single()

      if (error) {
        console.warn('Metadata table not found, using local data:', error.message)
        return null
      }

      return data
    } catch (error) {
      console.warn('Supabase metadata not available, using local data:', error.message)
      return null
    }
  },

  // Add a new level with placement shifting
  async addLevel(levelData) {
    if (!supabase) {
      throw new Error('Supabase not configured')
    }

    try {
      const newPlacement = levelData.placement

      // First, get all levels that need to be shifted down
      const { data: levelsToShift, error: fetchError } = await supabase
        .from('levels')
        .select('id, placement')
        .gte('placement', newPlacement)

      if (fetchError) {
        console.error('Error fetching levels to shift:', fetchError)
        throw fetchError
      }

      // Shift existing levels down one by one
      if (levelsToShift && levelsToShift.length > 0) {
        console.log(`🔄 Shifting ${levelsToShift.length} levels at placement ${newPlacement}+ down by 1`)
        for (const level of levelsToShift) {
          const { error: shiftError } = await supabase
            .from('levels')
            .update({ placement: level.placement + 1 })
            .eq('id', level.id)

          if (shiftError) {
            console.error('Error shifting level:', level.id, shiftError)
            throw shiftError
          }
        }
      }

      // Ensure enjoyment_ratings is initialized as empty array if not provided
      const levelDataWithDefaults = {
        ...levelData,
        enjoyment_ratings: levelData.enjoyment_ratings || []
      }

      // Then insert the new level
      const { data, error } = await supabase
        .from('levels')
        .insert(levelDataWithDefaults)
        .select()

      if (error) {
        console.error('Error adding level:', error)
        throw error
      }

      console.log('✅ Level added successfully with placement shifting:', data)

      // Auto-repair placements after operation to ensure consistency
      await autoRepairPlacements()

      return data
    } catch (error) {
      console.error('Supabase add level error:', error)
      throw error
    }
  },

  // Update an existing level with placement shifting
  async updateLevel(levelId, levelData, originalPlacement) {
    if (!supabase) {
      throw new Error('Supabase not configured')
    }

    try {
      const newPlacement = levelData.placement
      
      if (originalPlacement !== newPlacement) {
        console.log(`🔄 Moving level from placement ${originalPlacement} to ${newPlacement}`)
        
        if (newPlacement < originalPlacement) {
          // Moving up: shift levels down that are between new and old position
          console.log(`🔼 Moving up: shifting levels ${newPlacement}-${originalPlacement-1} down by 1`)
          
          const { data: levelsToShift, error: fetchError } = await supabase
            .from('levels')
            .select('id, placement')
            .gte('placement', newPlacement)
            .lt('placement', originalPlacement)
            .neq('id', levelId)

          if (fetchError) {
            console.error('Error fetching levels to shift up:', fetchError)
            throw fetchError
          }

          if (levelsToShift && levelsToShift.length > 0) {
            for (const level of levelsToShift) {
              const { error: shiftError } = await supabase
                .from('levels')
                .update({ placement: level.placement + 1 })
                .eq('id', level.id)

              if (shiftError) {
                console.error('Error shifting level up:', level.id, shiftError)
                throw shiftError
              }
            }
          }
        } else {
          // Moving down: shift levels up that are between old and new position
          console.log(`🔽 Moving down: shifting levels ${originalPlacement+1}-${newPlacement} up by 1`)
          
          const { data: levelsToShift, error: fetchError } = await supabase
            .from('levels')
            .select('id, placement')
            .gt('placement', originalPlacement)
            .lte('placement', newPlacement)
            .neq('id', levelId)

          if (fetchError) {
            console.error('Error fetching levels to shift down:', fetchError)
            throw fetchError
          }

          if (levelsToShift && levelsToShift.length > 0) {
            for (const level of levelsToShift) {
              const { error: shiftError } = await supabase
                .from('levels')
                .update({ placement: level.placement - 1 })
                .eq('id', level.id)

              if (shiftError) {
                console.error('Error shifting level down:', level.id, shiftError)
                throw shiftError
              }
            }
          }
        }
      }

      // Update the level itself
      const { data, error } = await supabase
        .from('levels')
        .update(levelData)
        .eq('id', levelId)
        .select()

      if (error) {
        console.error('Error updating level:', error)
        throw error
      }

      console.log('✅ Level updated successfully with placement shifting:', data)

      // Auto-repair placements after operation to ensure consistency
      await autoRepairPlacements()

      return data
    } catch (error) {
      console.error('Supabase update level error:', error)
      throw error
    }
  },

  // Legacy upsert function - use addLevel or updateLevel instead
  async upsertLevel(levelData) {
    console.warn('⚠️  upsertLevel is deprecated. Use addLevel or updateLevel instead.')
    return this.addLevel(levelData)
  },

  // Delete a level and fill placement gap
  async deleteLevel(levelId) {
    if (!supabase) {
      throw new Error('Supabase not configured')
    }

    try {
      console.log(`🗑️  Starting deletion process for level ID: ${levelId}`)

      // First get the level's details to know which gap to fill
      const { data: levelToDelete, error: fetchError } = await supabase
        .from('levels')
        .select('placement, levelName')
        .eq('id', levelId)
        .single()

      if (fetchError) {
        console.error('❌ Error finding level to delete:', fetchError)
        throw fetchError
      }

      const deletedPlacement = levelToDelete.placement
      const deletedName = levelToDelete.levelName
      console.log(`📍 Deleting level "${deletedName}" at placement ${deletedPlacement}`)

      // Delete the level
      const { error: deleteError } = await supabase
        .from('levels')
        .delete()
        .eq('id', levelId)

      if (deleteError) {
        console.error('❌ Error deleting level:', deleteError)
        throw deleteError
      }

      console.log(`✅ Level deleted from database`)

      // Get levels that need to be shifted up to fill the gap
      // IMPORTANT: Order by placement to ensure sequential processing
      const { data: levelsToShift, error: fetchShiftError } = await supabase
        .from('levels')
        .select('id, placement, levelName')
        .gt('placement', deletedPlacement)
        .order('placement', { ascending: true })

      if (fetchShiftError) {
        console.error('❌ Error fetching levels to shift after deletion:', fetchShiftError)
        throw fetchShiftError
      }

      // Shift levels up to fill the gap
      if (levelsToShift && levelsToShift.length > 0) {
        console.log(`🔄 Filling placement gap at ${deletedPlacement}`)
        console.log(`📊 Shifting ${levelsToShift.length} level(s) up by 1 position`)

        for (const level of levelsToShift) {
          const oldPlacement = level.placement
          const newPlacement = level.placement - 1

          console.log(`  ↑ "${level.levelName}": ${oldPlacement} → ${newPlacement}`)

          const { error: shiftError } = await supabase
            .from('levels')
            .update({ placement: newPlacement })
            .eq('id', level.id)

          if (shiftError) {
            console.error(`❌ Error shifting level "${level.levelName}" (${level.id}):`, shiftError)
            throw shiftError
          }
        }

        console.log(`✅ All ${levelsToShift.length} level(s) shifted successfully`)
      } else {
        console.log(`ℹ️  No levels to shift (deleted level was at the end)`)
      }

      console.log(`✅ Level "${deletedName}" deleted successfully - placement sequence maintained`)

      // Auto-repair placements to catch any edge cases
      await autoRepairPlacements()

      return true
    } catch (error) {
      console.error('💥 Supabase delete error:', error)
      throw error
    }
  },

  // Update metadata
  async updateMetadata(metadataUpdate) {
    if (!supabase) {
      throw new Error('Supabase not configured')
    }

    try {
      const { data, error } = await supabase
        .from('metadata')
        .update(metadataUpdate)
        .select()

      if (error) {
        console.error('Error updating metadata:', error)
        throw error
      }

      console.log('✅ Metadata updated successfully:', data)
      return data
    } catch (error) {
      console.error('Supabase metadata update error:', error)
      throw error
    }
  },

  // User Activity Operations
  async updateUserActivity(userId, activityData = {}) {
    console.log('🔄 updateUserActivity called with userId:', userId, 'activityData:', activityData)

    if (!supabase) {
      console.warn('⚠️ Supabase not configured, skipping user activity update')
      return null
    }

    if (!userId) {
      console.error('❌ No userId provided to updateUserActivity')
      return null
    }

    try {
      // Only include valid columns for the user_activity table
      const validColumns = ['user_id', 'username', 'avatar', 'last_online', 'online', 'completed_levels'];
      const baseData = {
        user_id: String(userId), // Ensure string format for Discord ID
        last_online: new Date().toISOString(),
        online: true
      };

      // Filter activityData to only include valid columns
      const filteredActivityData = {};
      Object.keys(activityData).forEach(key => {
        if (validColumns.includes(key)) {
          filteredActivityData[key] = activityData[key];
        }
      });

      const updateData = {
        ...baseData,
        ...filteredActivityData
      }

      console.log('📊 Attempting to upsert user activity data:', updateData)

      const { data, error } = await supabase
        .from('user_activity')
        .upsert(updateData, {
          ignoreDuplicates: false
        })
        .select()

      if (error) {
        console.error('❌ Error updating user activity:', error)
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      console.log('✅ User activity updated successfully:', data)
      return data
    } catch (error) {
      console.error('❌ Supabase user activity update error:', error)
      throw error
    }
  },

  async setUserOffline(userId) {
    console.log('🔄 setUserOffline called with userId:', userId)

    if (!supabase) {
      console.warn('⚠️ Supabase not configured, skipping offline status update')
      return null
    }

    if (!userId) {
      console.error('❌ No userId provided to setUserOffline')
      return null
    }

    try {
      const updateData = {
        online: false,
        last_online: new Date().toISOString()
      }

      console.log('📊 Attempting to set user offline:', { userId: String(userId), ...updateData })

      const { data, error } = await supabase
        .from('user_activity')
        .update(updateData)
        .eq('user_id', String(userId))
        .select()

      if (error) {
        console.error('❌ Error setting user offline:', error)
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      console.log('✅ User set offline successfully:', data)
      return data
    } catch (error) {
      console.error('❌ Supabase set offline error:', error)
      throw error
    }
  },

  async addCompletedLevel(userId, levelId, youtubeLink = null, completedAt = null, isVerifier = false) {
    if (!supabase) {
      console.warn('Supabase not configured, skipping completed level update')
      return null
    }

    try {
      // First get current user activity
      const { data: currentActivity, error: fetchError } = await supabase
        .from('user_activity')
        .select('completed_levels')
        .eq('user_id', userId)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching current activity:', fetchError)
        throw fetchError
      }

      const currentLevels = currentActivity?.completed_levels || []

      // Check if level already completed
      const levelExists = currentLevels.some(entry => entry.lvl === levelId)

      if (!levelExists) {
        const newEntry = {
          lvl: levelId,
          yt: youtubeLink,
          completedAt: completedAt || new Date().toISOString(),
          verifier: isVerifier
        }
        const updatedLevels = [...currentLevels, newEntry]

        const { data, error } = await supabase
          .from('user_activity')
          .upsert({
            user_id: String(userId),
            completed_levels: updatedLevels,
            last_online: new Date().toISOString(),
            online: true
          }, {
            ignoreDuplicates: false
          })
          .select()

        if (error) {
          console.error('Error adding completed level:', error)
          throw error
        }

        console.log('✅ Completed level added successfully:', data)
        return data
      } else {
        console.log('Level already completed:', levelId)
        return currentActivity
      }
    } catch (error) {
      console.error('Supabase add completed level error:', error)
      throw error
    }
  },

  async removeCompletedLevel(userId, levelId) {
    if (!supabase) {
      console.warn('Supabase not configured, skipping completed level removal')
      return null
    }

    try {
      // First get current user activity
      const { data: currentActivity, error: fetchError } = await supabase
        .from('user_activity')
        .select('completed_levels')
        .eq('user_id', userId)
        .single()

      if (fetchError) {
        console.error('Error fetching current activity:', fetchError)
        throw fetchError
      }

      const currentLevels = currentActivity?.completed_levels || []

      // Filter out the level to remove
      const updatedLevels = currentLevels.filter(entry => String(entry.lvl) !== String(levelId))

      const { data, error } = await supabase
        .from('user_activity')
        .update({
          completed_levels: updatedLevels,
          last_online: new Date().toISOString()
        })
        .eq('user_id', String(userId))
        .select()

      if (error) {
        console.error('Error removing completed level:', error)
        throw error
      }

      console.log('✅ Completed level removed successfully:', data)
      return data
    } catch (error) {
      console.error('Supabase remove completed level error:', error)
      throw error
    }
  },

  async updateCompletedLevel(userId, levelId, youtubeLink = null, completedAt = null, isVerifier = false) {
    if (!supabase) {
      console.warn('Supabase not configured, skipping completed level update')
      return null
    }

    try {
      // First get current user activity
      const { data: currentActivity, error: fetchError } = await supabase
        .from('user_activity')
        .select('completed_levels')
        .eq('user_id', userId)
        .single()

      if (fetchError) {
        console.error('Error fetching current activity:', fetchError)
        throw fetchError
      }

      const currentLevels = currentActivity?.completed_levels || []

      // Find and update the level
      const updatedLevels = currentLevels.map(entry => {
        if (String(entry.lvl) === String(levelId)) {
          return {
            lvl: levelId,
            yt: youtubeLink,
            completedAt: completedAt || entry.completedAt || new Date().toISOString(),
            verifier: isVerifier
          }
        }
        return entry
      })

      const { data, error } = await supabase
        .from('user_activity')
        .update({
          completed_levels: updatedLevels,
          last_online: new Date().toISOString()
        })
        .eq('user_id', String(userId))
        .select()

      if (error) {
        console.error('Error updating completed level:', error)
        throw error
      }

      console.log('✅ Completed level updated successfully:', data)
      return data
    } catch (error) {
      console.error('Supabase update completed level error:', error)
      throw error
    }
  },

  async getUserActivity(userId) {
    if (!supabase) {
      console.warn('Supabase not configured, cannot fetch user activity')
      return null
    }

    try {
      const { data, error } = await supabase
        .from('user_activity')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching user activity:', error)
        throw error
      }

      return data || null
    } catch (error) {
      console.error('Supabase get user activity error:', error)
      throw error
    }
  },

  async getUsersWhoCompletedLevel(levelId) {
    if (!supabase) {
      console.warn('Supabase not configured, cannot fetch users')
      return []
    }

    try {
      console.log('🔍 Searching for users who completed level ID:', levelId)

      // Get all users and filter in JavaScript since JSONB querying is complex
      const { data, error } = await supabase
        .from('user_activity')
        .select('*')

      if (error) {
        console.error('Error fetching users who completed level:', error)
        throw error
      }

      // Filter users who have completed this level
      const usersWithLevel = data?.filter(user =>
        user.completed_levels?.some(entry => entry.lvl === levelId)
      ) || []

      console.log('✅ Found users who completed this level:', usersWithLevel.length)
      return usersWithLevel
    } catch (error) {
      console.error('Supabase get users who completed level error:', error)
      throw error
    }
  },

  // Test function for debugging
  async testUserActivityTable() {
    if (!supabase) {
      console.warn('⚠️ Supabase not configured')
      return false
    }

    try {
      console.log('🧪 Testing user_activity table connection...')

      // Try to select from the table to see if it exists
      const { data, error } = await supabase
        .from('user_activity')
        .select('*')
        .limit(1)

      if (error) {
        console.error('❌ Table test failed:', error)
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        return false
      }

      console.log('✅ Table connection successful, sample data:', data)
      return true
    } catch (error) {
      console.error('❌ Table test error:', error)
      return false
    }
  },

  // Level Submissions Operations
  async getSubmissions(filters = {}) {
    if (!supabase) {
      console.warn('Supabase not configured, cannot fetch submissions')
      return []
    }

    try {
      let query = supabase
        .from('level_submissions')
        .select('*')
        .order('submitted_at', { ascending: false })

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.userId) {
        query = query.eq('submitted_by_user_id', filters.userId)
      }
      if (filters.submissionType) {
        query = query.eq('submission_type', filters.submissionType)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching submissions:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Supabase get submissions error:', error)
      throw error
    }
  },

  async addSubmission(submissionData) {
    if (!supabase) {
      throw new Error('Supabase not configured')
    }

    try {
      const { data, error } = await supabase
        .from('level_submissions')
        .insert({
          ...submissionData,
          submitted_at: new Date().toISOString(),
          status: 'pending'
        })
        .select()

      if (error) {
        console.error('Error adding submission:', error)
        throw error
      }

      console.log('✅ Submission added successfully:', data)
      return data
    } catch (error) {
      console.error('Supabase add submission error:', error)
      throw error
    }
  },

  /**
   * Calculate Levenshtein distance between two strings for fuzzy matching
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} - Distance between strings
   */
  levenshteinDistance(str1, str2) {
    const s1 = str1.toLowerCase()
    const s2 = str2.toLowerCase()
    const matrix = []

    for (let i = 0; i <= s2.length; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= s1.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= s2.length; i++) {
      for (let j = 1; j <= s1.length; j++) {
        if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          )
        }
      }
    }

    return matrix[s2.length][s1.length]
  },

  /**
   * Find user by fuzzy username matching in user_activity table
   * @param {string} verifierName - The verifier name to search for
   * @returns {string|null} - User ID if found, null otherwise
   */
  async findUserByFuzzyUsername(verifierName) {
    if (!supabase || !verifierName) {
      return null
    }

    try {
      // Fetch all users
      const { data: users, error } = await supabase
        .from('user_activity')
        .select('user_id, username')

      if (error) {
        console.error('Error fetching users for fuzzy match:', error)
        return null
      }

      if (!users || users.length === 0) {
        return null
      }

      // Calculate similarity for each user
      const matches = users.map(user => {
        const distance = this.levenshteinDistance(verifierName, user.username || '')
        const maxLength = Math.max(verifierName.length, (user.username || '').length)
        const similarity = maxLength === 0 ? 0 : ((maxLength - distance) / maxLength) * 100

        return {
          userId: user.user_id,
          username: user.username,
          similarity
        }
      })

      // Sort by similarity (highest first)
      matches.sort((a, b) => b.similarity - a.similarity)

      // Return best match if similarity > 80%
      const bestMatch = matches[0]
      if (bestMatch.similarity >= 80) {
        console.log(`✅ Found fuzzy match for verifier "${verifierName}": ${bestMatch.username} (${bestMatch.similarity.toFixed(1)}% similarity)`)
        return bestMatch.userId
      }

      console.log(`⚠️ No good fuzzy match found for verifier "${verifierName}" (best: ${bestMatch.username} at ${bestMatch.similarity.toFixed(1)}%)`)
      return null
    } catch (error) {
      console.error('Error in fuzzy username matching:', error)
      return null
    }
  },

  /**
   * Add an enjoyment rating to a level's enjoyment_ratings array
   * @param {string} levelId - The level ID
   * @param {number} rating - The enjoyment rating (0-10)
   * @returns {object} - Updated level data
   */
  async addEnjoymentRating(levelId, rating) {
    if (!supabase) {
      throw new Error('Supabase not configured')
    }

    try {
      // First get current enjoyment_ratings
      const { data: level, error: fetchError } = await supabase
        .from('levels')
        .select('enjoyment_ratings')
        .eq('id', levelId)
        .single()

      if (fetchError) {
        console.error('Error fetching level for enjoyment rating:', fetchError)
        throw fetchError
      }

      const currentRatings = level?.enjoyment_ratings || []
      const updatedRatings = [...currentRatings, rating]

      // Update the level with new ratings array
      const { data, error } = await supabase
        .from('levels')
        .update({ enjoyment_ratings: updatedRatings })
        .eq('id', levelId)
        .select()

      if (error) {
        console.error('Error adding enjoyment rating:', error)
        throw error
      }

      console.log(`✅ Added enjoyment rating ${rating} to level ${levelId}`)
      return data
    } catch (error) {
      console.error('Supabase add enjoyment rating error:', error)
      throw error
    }
  },

  async approveSubmission(submissionId) {
    if (!supabase) {
      throw new Error('Supabase not configured')
    }

    try {
      // First get the submission details
      const { data: submission, error: fetchError } = await supabase
        .from('level_submissions')
        .select('*')
        .eq('id', submissionId)
        .single()

      if (fetchError) {
        console.error('Error fetching submission to approve:', fetchError)
        throw fetchError
      }

      if (!submission) {
        throw new Error('Submission not found')
      }

      // Handle based on submission type
      if (submission.submission_type === 'level') {
        // Add to main levels table
        const levelData = {
          id: submission.level_id,
          placement: submission.suggested_placement || 1,
          levelName: submission.level_name,
          creator: submission.creator,
          verifier: submission.verifier,
          youtubeVideoId: submission.youtube_video_id,
          difficulty: submission.difficulty,
          gamemode: submission.gamemode,
          decorationStyle: submission.decoration_style,
          extraTags: submission.extra_tags || []
        }

        await this.addLevel(levelData)

        // Auto-add verifier completion if verifier found in user_activity
        if (submission.verifier) {
          const verifierUserId = await this.findUserByFuzzyUsername(submission.verifier)
          if (verifierUserId) {
            try {
              await this.addCompletedLevel(
                verifierUserId,
                submission.level_id,
                submission.youtube_video_id ? `https://www.youtube.com/watch?v=${submission.youtube_video_id}` : null,
                null, // Use current timestamp
                true  // Mark as verifier
              )
              console.log(`✅ Auto-added verifier completion for ${submission.verifier}`)
            } catch (error) {
              console.error('⚠️ Failed to auto-add verifier completion:', error)
              // Don't throw - this is optional
            }
          }
        }

        // Add enjoyment rating if provided
        if (submission.enjoyment_rating != null) {
          try {
            await this.addEnjoymentRating(submission.level_id, submission.enjoyment_rating)
          } catch (error) {
            console.error('⚠️ Failed to add enjoyment rating to level:', error)
            // Don't throw - this is optional
          }
        }
      } else if (submission.submission_type === 'completion') {
        // Add to user's completed levels
        await this.addCompletedLevel(
          submission.submitted_by_user_id,
          submission.target_level_id,
          submission.youtube_link,
          submission.completed_at,
          submission.is_verifier
        )

        // Add enjoyment rating if provided
        if (submission.enjoyment_rating != null) {
          try {
            await this.addEnjoymentRating(submission.target_level_id, submission.enjoyment_rating)
          } catch (error) {
            console.error('⚠️ Failed to add enjoyment rating to level:', error)
            // Don't throw - this is optional
          }
        }
      }

      // Update submission status to approved
      const { data, error: updateError } = await supabase
        .from('level_submissions')
        .update({ status: 'approved' })
        .eq('id', submissionId)
        .select()

      if (updateError) {
        console.error('Error updating submission status:', updateError)
        throw updateError
      }

      console.log('✅ Submission approved successfully:', data)
      return data
    } catch (error) {
      console.error('Supabase approve submission error:', error)
      throw error
    }
  },

  async declineSubmission(submissionId) {
    if (!supabase) {
      throw new Error('Supabase not configured')
    }

    try {
      // Delete the submission
      const { error } = await supabase
        .from('level_submissions')
        .delete()
        .eq('id', submissionId)

      if (error) {
        console.error('Error declining submission:', error)
        throw error
      }

      console.log('✅ Submission declined and deleted:', submissionId)
      return true
    } catch (error) {
      console.error('Supabase decline submission error:', error)
      throw error
    }
  },

  async getUserSubmissions(userId) {
    if (!supabase) {
      console.warn('Supabase not configured, cannot fetch user submissions')
      return []
    }

    try {
      const { data, error } = await supabase
        .from('level_submissions')
        .select('*')
        .eq('submitted_by_user_id', userId)
        .order('submitted_at', { ascending: false })

      if (error) {
        console.error('Error fetching user submissions:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Supabase get user submissions error:', error)
      throw error
    }
  }
}