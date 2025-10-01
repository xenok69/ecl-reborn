import { useAuth } from '../hooks/useAuth';
import { useState, useEffect } from 'react';
import styles from './HomeRoute.module.css';

export default function HomeRoute() {
  const { user, isAuthenticated } = useAuth();
  const [moderators, setModerators] = useState([]);

  useEffect(() => {
    const loadModerators = async () => {
      try {
        const response = await fetch('/moderators.json');
        if (response.ok) {
          const data = await response.json();
          setModerators(data);
        } else {
          // Fallback to importing from src
          const { default: moderatorsData } = await import('../data/moderators.json');
          setModerators(moderatorsData);
        }
      } catch (error) {
        console.error('Error loading moderators:', error);
      }
    };
    
    loadModerators();
  }, []);

  return (
    <div className={styles.homeContainer}>
      <div className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>ECL Reborn</h1>
          <p className={styles.subtitle}>
            The Eclipse Challenge List - Reimagined for the Modern Era
          </p>
          <p className={styles.description}>
            Welcome to the Eclipse Challenge List! Track your progress through the most challenging Geometry Dash levels,
            compete on the leaderboard, and join a community of skilled players.
          </p>
        </div>
      </div>

      <div className={styles.contentGrid}>
        <section className={styles.infoCard}>
          <h2 className={styles.cardTitle}>Getting Started</h2>
          <div className={styles.cardContent}>
            {isAuthenticated ? (
              <div className={styles.welcomeMessage}>
                <p>
                  Welcome back, <strong>{user?.username}</strong>!
                </p>
                <p>
                  You're all set to start exploring challenges and tracking your progress.
                </p>
              </div>
            ) : (
              <div className={styles.signInPrompt}>
                <p>
                  Sign in with Discord to start exploring challenges and tracking your progress.
                </p>
                <a href="/signin" className={styles.ctaButton}>
                  Sign In with Discord
                </a>
              </div>
            )}
            <div className={styles.steps}>
              <h3 className={styles.stepsTitle}>How it Works:</h3>
              <ol className={styles.stepsList}>
                <li>Sign in with your Discord account</li>
                <li>Browse the challenge list and explore levels</li>
                <li>Track your completed challenges</li>
                <li>Climb the leaderboard and compete with others</li>
              </ol>
            </div>
          </div>
        </section>

        <section className={styles.adminCard}>
          <h2 className={styles.cardTitle}>List Moderators</h2>
          <div className={styles.adminInfo}>
            <p className={styles.moderatorDescription}>
              Our dedicated team of moderators maintains the challenge list and reviews submissions.
            </p>
            <ul className={styles.editorList}>
              {moderators.map((moderator, index) => (
                <li key={index} className={styles.editorItem}>
                  <span className={styles.editorName}>
                    {moderator.username}
                  </span>
                  <span className={styles.editorRole}>{moderator.role}</span>
                </li>
              ))}
            </ul>
            {moderators.length === 0 && (
              <p className={styles.adminNote}>Loading moderators...</p>
            )}
          </div>
        </section>

        <section className={styles.quickLinks}>
          <h2 className={styles.cardTitle}>Quick Links</h2>
          <div className={styles.linkGrid}>
            <a href="/challenges/" className={styles.quickLinkCard}>
              <div className={styles.quickLinkIcon}>⚡</div>
              <h3>Challenges</h3>
              <p>Browse the challenge list</p>
            </a>
            <a href="/leaderboard/" className={styles.quickLinkCard}>
              <div className={styles.quickLinkIcon}>🏆</div>
              <h3>Leaderboard</h3>
              <p>View top players</p>
            </a>
            <a href="/about/" className={styles.quickLinkCard}>
              <div className={styles.quickLinkIcon}>✨</div>
              <h3>About</h3>
              <p>Learn more about ECL</p>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}