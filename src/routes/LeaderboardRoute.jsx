import { useLoaderData, Link } from 'react-router'
import { supabaseOperations } from '../lib/supabase'
import { getLevels } from '../lib/levelUtils'
import { calculateUserPackPoints } from '../lib/packUtils'
import styles from './LeaderboardRoute.module.css'

export const leaderboardLoader = async ({ request }) => {
  try {
    // Check if request was aborted before starting
    if (request.signal.aborted) {
      return {
        leaderboard: [],
        error: null
      }
    }

    // Fetch users and levels in parallel to avoid race conditions
    const [usersResult, allLevels] = await Promise.all([
      supabaseOperations.supabase
        .from('user_activity')
        .select('*'),
      getLevels()
    ])

    // Check if request was aborted after data fetch
    if (request.signal.aborted) {
      return {
        leaderboard: [],
        error: null
      }
    }

    const { data: allUsers, error } = usersResult

    if (error) {
      throw error
    }

    // Calculate points for each user (including pack bonuses)
    const leaderboardPromises = allUsers.map(async (user) => {
      const completedLevelData = user.completed_levels || []
      const userCompletedLevels = allLevels.filter(level =>
        completedLevelData.some(entry => String(entry.lvl) === String(level.id))
      )
      const levelPoints = userCompletedLevels.reduce((sum, level) => sum + (level.points || 0), 0)

      // Get pack bonus points
      let packPoints = 0
      try {
        packPoints = await calculateUserPackPoints(user.user_id)
      } catch (error) {
        console.warn(`Failed to calculate pack points for user ${user.user_id}:`, error)
      }

      const totalPoints = levelPoints + packPoints

      return {
        userId: user.user_id,
        username: user.username || 'Unknown User',
        avatar: user.avatar,
        completedLevels: userCompletedLevels.length,
        levelPoints,
        packPoints,
        points: totalPoints,
        online: user.online
      }
    })

    // Wait for all pack points calculations
    const leaderboard = await Promise.all(leaderboardPromises)

    // Sort by total points descending
    leaderboard.sort((a, b) => b.points - a.points)

    return {
      leaderboard,
      error: null
    }
  } catch (error) {
    // Don't log errors if the request was aborted
    if (!request.signal.aborted) {
      console.error('Failed to load leaderboard:', error)
    }
    return {
      leaderboard: [],
      error: request.signal.aborted ? null : error.message
    }
  }
}

export default function LeaderboardRoute() {
  const { leaderboard, error } = useLoaderData()

  return (
    <div className={styles.leaderboardContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Global Leaderboard</h1>
        <p className={styles.subtitle}>
          Top players ranked by total points earned
        </p>
      </div>

      {error ? (
        <div className={styles.errorCard}>
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      ) : (
        <div className={styles.leaderboardCard}>
          {leaderboard.length > 0 ? (
            <div className={styles.tableWrapper}>
              <table className={styles.leaderboardTable}>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Completed</th>
                    <th>Points</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((player, index) => {
                    const rank = index + 1
                    const avatarUrl = player.avatar
                      ? `https://cdn.discordapp.com/avatars/${player.userId}/${player.avatar}.png?size=64`
                      : null

                    return (
                      <tr key={player.userId} className={styles.leaderboardRow}>
                        <td>
                          <span className={`${styles.rank} ${rank <= 3 ? styles[`rank${rank}`] : ''}`}>
                            {rank === 1 && '🥇'}
                            {rank === 2 && '🥈'}
                            {rank === 3 && '🥉'}
                            {rank > 3 && `#${rank}`}
                          </span>
                        </td>
                        <td>
                          <Link to={`/profile/${player.userId}`} className={styles.playerLink}>
                            <div className={styles.playerCell}>
                              {avatarUrl ? (
                                <img
                                  src={avatarUrl}
                                  alt={player.username}
                                  className={styles.playerAvatar}
                                />
                              ) : (
                                <div className={styles.playerAvatarPlaceholder}>
                                  {player.username.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span className={styles.playerName}>{player.username}</span>
                            </div>
                          </Link>
                        </td>
                        <td>{player.completedLevels}</td>
                        <td>
                          <span className={styles.pointsValue}>{player.points}</span>
                        </td>
                        <td>
                          <span className={player.online ? styles.statusOnline : styles.statusOffline}>
                            {player.online ? '🟢' : '🔴'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.noPlayers}>
              <p>No players yet. Be the first to complete a level!</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}