import styles from './AboutRoute.module.css'

export default function AboutRoute() {
  return (
    <div className={styles.aboutContainer}>
      <div className={styles.heroSection}>
        <h1 className={styles.title}>About ECL Reborn</h1>
        <p className={styles.subtitle}>
          A modern reimagining of the Eclipse Challenge List
        </p>
      </div>

      <div className={styles.contentGrid}>
        {/* What is ECL */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>What is ECL?</h2>
          <p className={styles.sectionContent}>
            The Eclipse Challenge List (ECL) is a curated collection of the most challenging levels
            in Geometry Dash. ECL Reborn is a complete modernization of the original list, bringing
            a sleek, responsive design and powerful features to help players track their progress and
            compete with others.
          </p>
        </section>

        {/* Features */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Features</h2>
          <ul className={styles.featureList}>
            <li>
              <div className={styles.featureIcon}>🎨</div>
              <div>
                <h3>Modern, Responsive Design</h3>
                <p>Beautiful interface that works seamlessly on all devices</p>
              </div>
            </li>
            <li>
              <div className={styles.featureIcon}>🔐</div>
              <div>
                <h3>Discord Authentication</h3>
                <p>Secure login using your Discord account</p>
              </div>
            </li>
            <li>
              <div className={styles.featureIcon}>📊</div>
              <div>
                <h3>Progress Tracking</h3>
                <p>Track your completed challenges and monitor your improvement</p>
              </div>
            </li>
            <li>
              <div className={styles.featureIcon}>🏆</div>
              <div>
                <h3>Global Leaderboard</h3>
                <p>Compete with players worldwide and climb the rankings</p>
              </div>
            </li>
            <li>
              <div className={styles.featureIcon}>⚡</div>
              <div>
                <h3>Real-time Updates</h3>
                <p>List updates and completions are reflected instantly</p>
              </div>
            </li>
            <li>
              <div className={styles.featureIcon}>🔍</div>
              <div>
                <h3>Search & Filter</h3>
                <p>Easily find levels and players with powerful search</p>
              </div>
            </li>
          </ul>
        </section>

        {/* Tech Stack */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Technology Stack</h2>
          <div className={styles.techStack}>
            <div className={styles.techCard}>
              <h3>Frontend</h3>
              <ul>
                <li><strong>React</strong> - Modern UI framework</li>
                <li><strong>React Router</strong> - Client-side routing</li>
                <li><strong>CSS Modules</strong> - Scoped styling</li>
              </ul>
            </div>
            <div className={styles.techCard}>
              <h3>Backend & Hosting</h3>
              <ul>
                <li><strong>Netlify</strong> - Hosting & deployment</li>
                <li><strong>Supabase</strong> - Database & authentication</li>
                <li><strong>GitHub</strong> - Version control & collaboration</li>
              </ul>
            </div>
            <div className={styles.techCard}>
              <h3>Authentication</h3>
              <ul>
                <li><strong>Discord OAuth</strong> - Secure user authentication</li>
                <li><strong>Supabase Auth</strong> - Session management</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Legacy ECL */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Legacy Versions</h2>
          <p className={styles.sectionContent}>
            ECL Reborn builds upon the foundation of the original Eclipse Challenge List.
            While we've completely redesigned the interface and modernized the technology,
            we maintain the same commitment to curating the most challenging levels in Geometry Dash.
          </p>
          <div className={styles.legacyLinks}>
            <a
              href="https://xenok69.github.io/ECL/MainList.html"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.legacyButton}
            >
              View Original ECL
            </a>
          </div>
        </section>

        {/* Open Source */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Open Source</h2>
          <p className={styles.sectionContent}>
            ECL Reborn is an open-source project. The code is publicly available on GitHub,
            allowing the community to contribute, suggest improvements, and track development progress.
          </p>
          <div className={styles.githubLinks}>
            <a
              href="https://github.com/xenok69/ecl-reborn"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.githubButton}
            >
              View on GitHub
            </a>
          </div>
        </section>

        {/* Credits */}
        <section className={styles.creditsSection}>
          <h2 className={styles.sectionTitle}>Credits</h2>
          <div className={styles.creditsGrid}>
            <div className={styles.creditCard}>
              <h3>Original ECL</h3>
              <p>Created and maintained by the original ECL team</p>
            </div>
            <div className={styles.creditCard}>
              <h3>ECL Reborn</h3>
              <p>Developed and maintained by the ECL Reborn team</p>
            </div>
            <div className={styles.creditCard}>
              <h3>Community</h3>
              <p>Thanks to all players and contributors</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
