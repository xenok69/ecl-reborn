export const metadata = {
  get totalLevels() {
    return levels.length;
  },
  pointsCalculation: {
    description:
      "Points are calculated based on placement where #1 gives 100 points and the last placement gives 1 point. Formula: points = 1 + (99 * (totalLevels - placement) / (totalLevels - 1))",
    maxPoints: 100,
    minPoints: 1,
  },
  lastUpdated: "2025-08-26",
};

export const difficulties = {
  INSANE: "Insane",
  EXTREME: "Extreme",
  LEGACY: "Legacy",
};

export const gamemodes = {
  MIXED: "Mixed",
  CUBE: "Cube",
  SHIP: "Ship",
  BALL: "Ball",
  UFO: "UFO",
  WAVE: "Wave",
  ROBOT: "Robot",
  SPIDER: "Spider",
};

export const decorationStyles = {
  EFFECT: "Effect",
  MODERN: "Modern",
  CLASSIC: "Classic",
  THEMED: "Themed",
  MINIMALIST: "Minimalist",
};

export const extraTagTypes = {
  EPILEPSY: "Epilepsy",
  FLASHING: "Flashing",
  DUAL: "Dual",
  TRIPLE: "Triple",
  MEMORY: "Memory",
  TIMING: "Timing",
  LDMOD: "LDMod",
};

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

export const levels = [
  createLevel(
    1,
    "so CRACKED",
    "MentosTeeGD",
    "xenok1",
    "103463023",
    "YP06jhz3Jqo",
    {
      difficulty: difficulties.INSANE,
      gamemode: gamemodes.MIXED,
      decorationStyle: decorationStyles.EFFECT,
      extraTags: [extraTagTypes.EPILEPSY],
    },
    "An incredibly challenging level with intense mixed gameplay and stunning effects."
  ),
  createLevel(
    2,
    "so CRACKED",
    "MentosTeeGD",
    "xenok1",
    "103463023",
    "YP06jhz3Jqo",
    {
      difficulty: difficulties.INSANE,
      gamemode: gamemodes.MIXED,
      decorationStyle: decorationStyles.EFFECT,
      extraTags: [extraTagTypes.EPILEPSY],
    },
    "An incredibly challenging level with intense mixed gameplay and stunning effects."
  ),
  createLevel(
    3,
    "so CRACKED",
    "MentosTeeGD",
    "xenok1",
    "103463023",
    "YP06jhz3Jqo",
    {
      difficulty: difficulties.INSANE,
      gamemode: gamemodes.MIXED,
      decorationStyle: decorationStyles.EFFECT,
      extraTags: [extraTagTypes.EPILEPSY],
    },
    "An incredibly challenging level with intense mixed gameplay and stunning effects."
  ),
  createLevel(
    4,
    "so CRACKED",
    "MentosTeeGD",
    "xenok1",
    "103463023",
    "YP06jhz3Jqo",
    {
      difficulty: difficulties.INSANE,
      gamemode: gamemodes.MIXED,
      decorationStyle: decorationStyles.EFFECT,
      extraTags: [extraTagTypes.EPILEPSY],
    },
    "An incredibly challenging level with intense mixed gameplay and stunning effects."
  ),
  createLevel(
    5,
    "so CRACKED",
    "MentosTeeGD",
    "xenok1",
    "103463023",
    "YP06jhz3Jqo",
    {
      difficulty: difficulties.INSANE,
      gamemode: gamemodes.MIXED,
      decorationStyle: decorationStyles.EFFECT,
      extraTags: [extraTagTypes.EPILEPSY],
    },
    "An incredibly challenging level with intense mixed gameplay and stunning effects."
  ),
];

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
