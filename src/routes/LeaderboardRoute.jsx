import styles from './HomeRoute.module.css';

export default function LeaderboardRoute() {
  return (
    <div className={styles.homeContainer}>
      <div className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>Leaderboard</h1>
          <p className={styles.subtitle}>
            Track progress and compete with other players
          </p>
        </div>
      </div>

      <div className={styles.contentGrid}>
        <section className={styles.infoCard}>
          <h2 className={styles.cardTitle}>Coming Soon</h2>
          <p className={styles.cardContent}>
            The leaderboard system is currently under development. 
            Check back soon to see rankings and player statistics!
          </p>
        </section>
      </div>
    </div>
  );
}