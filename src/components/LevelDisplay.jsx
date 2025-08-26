import styles from "./LevelDisplay.module.css";

export default function LevelDisplay({
  placement,
  levelName,
  creator,
  verifier,
  id,
  points,
  youtubeVideoId,
  tags = {},
}) {
  const { difficulty, gamemode, decorationStyle, extraTags = [] } = tags;

  return (
    <div className={styles.LevelContainer}>
      <div className={styles.VideoSection}>
        <div className={styles.VideoWrapper}>
          {youtubeVideoId ? (
            <iframe
              src={`https://www.youtube.com/embed/${youtubeVideoId}`}
              title={`${levelName} - Geometry Dash Level`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className={styles.Video}
            />
          ) : (
            <div className={styles.VideoPlaceholder}>
              <span>No video available</span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.InfoSection}>
        <div className={styles.LevelTitle}>
          <h2>
            #{placement} - {levelName}
          </h2>
        </div>

        <div className={styles.InfoBox}>
          <div className={styles.InfoGrid}>
            <div className={styles.InfoItem}>
              <span className={styles.InfoLabel}>Creator:</span>
              <span className={styles.InfoValue}>{creator}</span>
            </div>
            <div className={styles.InfoItem}>
              <span className={styles.InfoLabel}>Verifier:</span>
              <span className={styles.InfoValue}>{verifier}</span>
            </div>
            <div className={styles.InfoItem}>
              <span className={styles.InfoLabel}>ID:</span>
              <span className={styles.InfoValue}>{id}</span>
            </div>
            <div className={styles.InfoItem}>
              <span className={styles.InfoLabel}>Points:</span>
              <span className={styles.PointsValue}>{points}</span>
            </div>
          </div>
        </div>

        <div className={styles.TagsContainer}>
          {difficulty && (
            <span className={`${styles.Tag} ${styles.DifficultyTag}`}>
              {difficulty}
            </span>
          )}
          {gamemode && (
            <span className={`${styles.Tag} ${styles.GamemodeTag}`}>
              {gamemode}
            </span>
          )}
          {decorationStyle && (
            <span className={`${styles.Tag} ${styles.DecorationTag}`}>
              {decorationStyle}
            </span>
          )}
          {extraTags.map((tag, index) => (
            <span key={index} className={`${styles.Tag} ${styles.ExtraTag}`}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
