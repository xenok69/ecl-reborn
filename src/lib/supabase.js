import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase configuration missing. Using fallback to local JSON data.')
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Database operations
export const supabaseOperations = {
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

      // Then insert the new level
      const { data, error } = await supabase
        .from('levels')
        .insert(levelData)
        .select()

      if (error) {
        console.error('Error adding level:', error)
        throw error
      }

      console.log('✅ Level added successfully with placement shifting:', data)
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
      // First get the level's placement to know which gap to fill
      const { data: levelToDelete, error: fetchError } = await supabase
        .from('levels')
        .select('placement')
        .eq('id', levelId)
        .single()

      if (fetchError) {
        console.error('Error finding level to delete:', fetchError)
        throw fetchError
      }

      const deletedPlacement = levelToDelete.placement

      // Delete the level
      const { error: deleteError } = await supabase
        .from('levels')
        .delete()
        .eq('id', levelId)

      if (deleteError) {
        console.error('Error deleting level:', deleteError)
        throw deleteError
      }

      // Get levels that need to be shifted up to fill the gap
      const { data: levelsToShift, error: fetchShiftError } = await supabase
        .from('levels')
        .select('id, placement')
        .gt('placement', deletedPlacement)

      if (fetchShiftError) {
        console.error('Error fetching levels to shift after deletion:', fetchShiftError)
        throw fetchShiftError
      }

      // Shift levels up to fill the gap
      if (levelsToShift && levelsToShift.length > 0) {
        console.log(`🔄 Filling placement gap at ${deletedPlacement} - shifting ${levelsToShift.length} levels up by 1`)
        for (const level of levelsToShift) {
          const { error: shiftError } = await supabase
            .from('levels')
            .update({ placement: level.placement - 1 })
            .eq('id', level.id)

          if (shiftError) {
            console.error('Error shifting level up after deletion:', level.id, shiftError)
            throw shiftError
          }
        }
      }

      console.log('✅ Level deleted successfully with placement gap filled:', levelId)
      return true
    } catch (error) {
      console.error('Supabase delete error:', error)
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
  }
}