import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router'
import { supabaseOperations } from '../lib/supabase'
import { getLevels } from '../lib/levelUtils'
import styles from './SearchRoute.module.css'

export const searchLoader = async ({ request }) => {
  const url = new URL(request.url)
  const query = url.searchParams.get('q') || ''

  if (!query.trim()) {
    return {
      query: '',
      users: [],
      levels: [],
      error: null
    }
  }

  try {
    // Search users
    const { data: allUsers, error: usersError } = await supabaseOperations.supabase
      .from('user_activity')
      .select('*')

    if (usersError) throw usersError

    const searchQuery = query.toLowerCase().trim()
    const matchedUsers = allUsers.filter(user =>
      user.username?.toLowerCase().includes(searchQuery)
    )

    // Calculate points for matched users
    const allLevels = await getLevels()
    const usersWithPoints = matchedUsers.map(user => {
      const completedLevelData = user.completed_levels || []
      const userCompletedLevels = allLevels.filter(level =>
        completedLevelData.some(entry => String(entry.lvl) === String(level.id))
      )
      const points = userCompletedLevels.reduce((sum, level) => sum + (level.points || 0), 0)

      return {
        userId: user.user_id,
        username: user.username || 'Unknown User',
        avatar: user.avatar,
        completedLevels: completedLevelData.length || 0,
        points,
        online: user.online
      }
    })

    // Search levels
    const matchedLevels = allLevels.filter(level =>
      level.levelName?.toLowerCase().includes(searchQuery) ||
      level.creator?.toLowerCase().includes(searchQuery) ||
      level.verifier?.toLowerCase().includes(searchQuery)
    )

    return {
      query,
      users: usersWithPoints,
      levels: matchedLevels,
      error: null
    }
  } catch (error) {
    console.error('Search failed:', error)
    return {
      query,
      users: [],
      levels: [],
      error: error.message
    }
  }
}

export default function SearchRoute() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [results, setResults] = useState({ users: [], levels: [], error: null })
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const performSearch = async () => {
      const searchQuery = searchParams.get('q') || ''
      if (!searchQuery.trim()) {
        setResults({ users: [], levels: [], error: null })
        return
      }

      setIsSearching(true)
      try {
        const { data: allUsers } = await supabaseOperations.supabase
          .from('user_activity')
          .select('*')

        const searchQueryLower = searchQuery.toLowerCase().trim()
        const matchedUsers = (allUsers || []).filter(user =>
          user.username?.toLowerCase().includes(searchQueryLower)
        )

        const allLevels = await getLevels()
        const usersWithPoints = matchedUsers.map(user => {
          const completedLevelData = user.completed_levels || []
          const userCompletedLevels = allLevels.filter(level =>
            completedLevelData.some(entry => String(entry.lvl) === String(level.id))
          )
          const points = userCompletedLevels.reduce((sum, level) => sum + (level.points || 0), 0)

          return {
            userId: user.user_id,
            username: user.username || 'Unknown User',
            avatar: user.avatar,
            completedLevels: completedLevelData.length || 0,
            points,
            online: user.online
          }
        })

        const matchedLevels = allLevels.filter(level =>
          level.levelName?.toLowerCase().includes(searchQueryLower) ||
          level.creator?.toLowerCase().includes(searchQueryLower) ||
          level.verifier?.toLowerCase().includes(searchQueryLower)
        )

        setResults({ users: usersWithPoints, levels: matchedLevels, error: null })
      } catch (error) {
        console.error('Search failed:', error)
        setResults({ users: [], levels: [], error: error.message })
      } finally {
        setIsSearching(false)
      }
    }

    performSearch()
  }, [searchParams])

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) {
      setSearchParams({ q: query.trim() })
    } else {
      setSearchParams({})
    }
  }

  const handleClear = () => {
    setQuery('')
    setSearchParams({})
    setResults({ users: [], levels: [], error: null })
  }

  const currentQuery = searchParams.get('q') || ''

  return (
    <div className={styles.searchContainer}>
      <div className={styles.searchHeader}>
        <h1 className={styles.title}>Search</h1>
        <p className={styles.subtitle}>Find users and levels</p>
      </div>

      <form onSubmit={handleSearch} className={styles.searchForm}>
        <div className={styles.searchInputWrapper}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for users or levels..."
            className={styles.searchInput}
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className={styles.clearBtn}
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>
        <button type="submit" className={styles.searchBtn} disabled={isSearching}>
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </form>

      {results.error && (
        <div className={styles.errorCard}>
          <h2>Error</h2>
          <p>{results.error}</p>
        </div>
      )}

      {currentQuery && !isSearching && (
        <div className={styles.resultsContainer}>
          {/* Users Results */}
          {results.users.length > 0 && (
            <div className={styles.resultsSection}>
              <h2 className={styles.sectionTitle}>
                Users ({results.users.length})
              </h2>
              <div className={styles.userResults}>
                {results.users.map(user => (
                  <Link
                    key={user.userId}
                    to={`/profile/${user.userId}`}
                    className={styles.userCard}
                  >
                    <div className={styles.userInfo}>
                      {user.avatar ? (
                        <img
                          src={`https://cdn.discordapp.com/avatars/${user.userId}/${user.avatar}.png?size=64`}
                          alt={user.username}
                          className={styles.userAvatar}
                        />
                      ) : (
                        <div className={styles.userAvatarPlaceholder}>
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className={styles.userDetails}>
                        <div className={styles.userName}>{user.username}</div>
                        <div className={styles.userStats}>
                          {user.completedLevels} levels · {user.points} points
                        </div>
                      </div>
                    </div>
                    <div className={styles.userStatus}>
                      <span className={user.online ? styles.statusOnline : styles.statusOffline}>
                        {user.online ? '🟢' : '🔴'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Levels Results */}
          {results.levels.length > 0 && (
            <div className={styles.resultsSection}>
              <h2 className={styles.sectionTitle}>
                Levels ({results.levels.length})
              </h2>
              <div className={styles.levelResults}>
                {results.levels.map(level => (
                  <Link
                    key={level.id}
                    to={`/level/${level.placement}`}
                    className={styles.levelCard}
                  >
                    <div className={styles.levelPlacement}>#{level.placement}</div>
                    <div className={styles.levelInfo}>
                      <div className={styles.levelName}>{level.levelName}</div>
                      <div className={styles.levelMeta}>
                        by {level.creator}
                        {level.verifier && ` · verified by ${level.verifier}`}
                      </div>
                    </div>
                    <div className={styles.levelPoints}>{level.points} pts</div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {results.users.length === 0 && results.levels.length === 0 && (
            <div className={styles.noResults}>
              <p>No results found for "{currentQuery}"</p>
              <p className={styles.noResultsHint}>Try searching for a different term</p>
            </div>
          )}
        </div>
      )}

      {!currentQuery && !isSearching && (
        <div className={styles.emptyState}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" className={styles.emptyIcon}>
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p>Enter a search term to find users or levels</p>
        </div>
      )}
    </div>
  )
}
