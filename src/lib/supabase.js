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

  // Add or update a level
  async upsertLevel(levelData) {
    if (!supabase) {
      throw new Error('Supabase not configured')
    }

    try {
      const { data, error } = await supabase
        .from('levels')
        .upsert(levelData, { onConflict: 'id' })
        .select()

      if (error) {
        console.error('Error upserting level:', error)
        throw error
      }

      console.log('✅ Level upserted successfully:', data)
      return data
    } catch (error) {
      console.error('Supabase upsert error:', error)
      throw error
    }
  },

  // Delete a level
  async deleteLevel(levelId) {
    if (!supabase) {
      throw new Error('Supabase not configured')
    }

    try {
      const { error } = await supabase
        .from('levels')
        .delete()
        .eq('id', levelId)

      if (error) {
        console.error('Error deleting level:', error)
        throw error
      }

      console.log('✅ Level deleted successfully:', levelId)
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