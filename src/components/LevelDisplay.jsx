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
  showActions = false,
  onEdit,
  onRemove,
}) {
  const { difficulty, gamemode, decorationStyle, extraTags = [] } = tags;

  return (
    <div className={styles.LevelContainer}>
      <div className={styles.VideoSection}>
        <div className={styles.VideoWrapper}>
          {youtubeVideoId ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}?rel=0&modestbranding=1&controls=1&showinfo=0&fs=1&iv_load_policy=3&disablekb=1`}
              title={`${levelName} - Geometry Dash Level`}
              frameBorder="0"
              allowFullScreen
              className={styles.Video}
              loading="lazy"
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
              <span className={styles.InfoLabel}>Points:</span>
              <span className={styles.PointsValue}>{points}</span>
            </div>
            <div className={styles.InfoItem}>
              <span className={styles.InfoLabel}>ID:</span>
              <span className={styles.InfoValue}>
                {id}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigator.clipboard.writeText(id);
                  }}
                  className={styles.CopyBtn}
                  title="Copy ID to clipboard"
                >
                  📋
                </button>
              </span>
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

        {showActions && (
          <div className={styles.LevelActions}>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(id);
              }}
              className={styles.EditLevelBtn}
            >
              Edit Level
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove(id);
              }}
              className={styles.RemoveLevelBtn}
            >
              Remove Level
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
