import levelsData from './levels.json';

export const metadata = {
  get totalLevels() {
    return levels.length;
  },
  ...levelsData.metadata,
};

export const difficulties = levelsData.difficulties;
export const gamemodes = levelsData.gamemodes;
export const decorationStyles = levelsData.decorationStyles;
export const extraTagTypes = levelsData.extraTagTypes;

const createLevel = (
  placement,
  levelName,
  creator,
  verifier,
  id,
  youtubeVideoId,
  tags,
  description = ""
) => ({
  placement,
  levelName,
  creator,
  verifier,
  id,
  youtubeVideoId,
  tags,
  get points() {
    if (metadata.totalLevels === 1) return 100;
    return Math.round(1 + (99 * (metadata.totalLevels - placement) / (metadata.totalLevels - 1)));
  },
  addedDate: "2025-08-26",
  description,
});

export const levels = levelsData.levels.map(level => ({
  ...level,
  get points() {
    if (metadata.totalLevels === 1) return 100;
    return Math.round(1 + (99 * (metadata.totalLevels - level.placement) / (metadata.totalLevels - 1)));
  },
}));

export const addLevel = (
  placement,
  levelName,
  creator,
  verifier,
  id,
  youtubeVideoId,
  tags,
  description = ""
) => {
  const newLevel = createLevel(
    placement,
    levelName,
    creator,
    verifier,
    id,
    youtubeVideoId,
    tags,
    description
  );
  levels.push(newLevel);
  levels.sort((a, b) => a.placement - b.placement);
  return newLevel;
};

export const getLevels = () => levels;

export const getLevelByPlacement = (placement) =>
  levels.find((level) => level.placement === placement);

export const getLevelsByDifficulty = (difficulty) =>
  levels.filter((level) => level.tags.difficulty === difficulty);

export const getLevelsByGamemode = (gamemode) =>
  levels.filter((level) => level.tags.gamemode === gamemode);

export const getLevelsByDecorationStyle = (decorationStyle) =>
  levels.filter((level) => level.tags.decorationStyle === decorationStyle);

export const getLevelsByExtraTag = (extraTag) =>
  levels.filter((level) => level.tags.extraTags?.includes(extraTag));

export const searchLevels = (query) => {
  const searchQuery = query.toLowerCase();
  return levels.filter(
    (level) =>
      level.levelName.toLowerCase().includes(searchQuery) ||
      level.creator.toLowerCase().includes(searchQuery) ||
      level.verifier.toLowerCase().includes(searchQuery)
  );
};

export const getLeaderboard = (limit = 50) => levels.slice(0, limit);

export default {
  metadata,
  levels,
  difficulties,
  gamemodes,
  decorationStyles,
  extraTagTypes,
  addLevel,
  getLevels,
  getLevelByPlacement,
  getLevelsByDifficulty,
  getLevelsByGamemode,
  getLevelsByDecorationStyle,
  getLevelsByExtraTag,
  searchLevels,
  getLeaderboard,
};
