import { useAuth } from '../hooks/useAuth';
import styles from './HomeRoute.module.css';

export default function HomeRoute() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className={styles.homeContainer}>
      <div className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>ECL Reborn</h1>
          <p className={styles.subtitle}>
            The Eclipse Challenge List - Reimagined for the Modern Era
          </p>
          <p className={styles.description}>
            A reimagined version of the Eclipse Challenge List. 
            A personal passion project to create a modern, sleek interface 
            for tracking and exploring challenging Geometry Dash levels.
          </p>
        </div>
      </div>

      <div className={styles.contentGrid}>
        <section className={styles.infoCard}>
          <h2 className={styles.cardTitle}>Features</h2>
          <ul className={styles.featureList}>
            <li>Modern, responsive design</li>
            <li>Discord authentication integration</li>
            <li>Challenge tracking and exploration</li>
            <li>Leaderboard system</li>
            <li>Clean, intuitive interface</li>
          </ul>
        </section>

        <section className={styles.infoCard}>
          <h2 className={styles.cardTitle}>Getting Started</h2>
          <div className={styles.cardContent}>
            {isAuthenticated ? (
              <div className={styles.welcomeMessage}>
                <p>Welcome back, <strong>{user?.username}</strong>!</p>
                <p>You're all set to start exploring challenges and tracking your progress.</p>
              </div>
            ) : (
              <div className={styles.signInPrompt}>
                <p>Sign in with Discord to start exploring challenges and tracking your progress.</p>
                <a href="/ecl-reborn/signin" className={styles.ctaButton}>
                  Sign In
                </a>
              </div>
            )}
          </div>
        </section>


        <section className={styles.adminCard}>
          <h2 className={styles.cardTitle}>Website Administration</h2>
          <div className={styles.adminInfo}>
            <p><strong>Current Editors:</strong></p>
            <ul className={styles.editorList}>
              <li className={styles.editorItem}>
                <span className={styles.editorName}>xenok1</span>
                <span className={styles.editorRole}>Primary Developer & Administrator</span>
              </li>
            </ul>
            <p className={styles.adminNote}>
              More editors will be added in the future as the platform grows.
            </p>
          </div>
        </section>

        <section className={styles.legacyCard}>
          <h2 className={styles.cardTitle}>Legacy ECL</h2>
          <p className={styles.cardContent}>
            This is a reimagined version of the original Eclipse Challenge List. 
            Built with modern web technologies to provide a better experience 
            while maintaining the essence of the original project.
          </p>
          <a 
            href="https://xenok69.github.io/ECL/MainList.html" 
            target="_blank" 
            rel="noopener noreferrer" 
            className={styles.legacyLink}
          >
            View Original ECL
          </a>
        </section>
      </div>
    </div>
  );
}