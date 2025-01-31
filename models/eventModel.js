const mongoose = require("mongoose");

const { Schema } = mongoose;

const OddsSchema = new Schema(
  {
    data: Schema.Types.Mixed,
  },
  {
    strict: false,
    timestamps: true,
  }
);

const VideosSchema = new Schema({
  PROPERTY_LINK: { type: String, default: null },
  PROPERTY_TIME: { type: Number, default: null },
  PROPERTY_INCIDENT_TYPE: { type: String, default: null },
  PROPERTY_TITLE: { type: String, default: null },
  PROPERTY_SUBTITLE1: { type: String, default: null },
  PROPERTY_SOURCE: { type: String, default: "YouTube" },
  PROPERTY_IS_TOP: { type: Number, default: 1 },
  PROPERTY_TITLE_SECONDARY: { type: String, default: "Match highlights" },
  PROPERTY_IS_OFFICIAL: { type: Number, default: 1 },
  IMAGES: [
    {
      HIGH: { type: String, required: true },
      PROPERTY_IMAGE_URL: { type: String, required: true },
    },
  ],
});

const NewsSchema = new Schema({
  ID: { type: String, required: true },
  TITLE: { type: String, required: true },
  LINK: { type: String, required: true },
  PUBLISHED: { type: Number, required: true },
  PROVIDER_NAME: { type: String, required: true },
  CATEGORY_NAME: { type: String, required: true },
  LINKS: [
    {
      IMAGE_VARIANT_ID: { type: Number, required: true },
      IMAGE_VARIANT_URL: { type: String, required: true },
    },
  ],
});

const eventSchema = new Schema({
  EVENT_ID: { type: String, required: true, unique: true },
  SPORT: { type: Number, required: true },

  // Tournament info
  NAME: { type: String, required: true },
  HEADER: { type: String, required: true },
  NAME_PART_1: { type: String, required: false },
  NAME_PART_2: { type: String, required: false },
  // TOURNAMENT_TEMPLATE_ID: { type: String, required: false },
  COUNTRY_ID: { type: Number, required: false },
  COUNTRY_NAME: { type: String, required: false },
  // TOURNAMENT_STAGE_ID: { type: String, required: false },
  // TOURNAMENT_TYPE: { type: String, required: false },
  TOURNAMENT_ID: { type: String, required: false },
  // SOURCE_TYPE: { type: Number, required: false },
  // HAS_LIVE_TABLE: { type: Number, required: false },
  // STANDING_INFO: { type: Number, required: false },
  TEMPLATE_ID: { type: String, required: false },
  TOURNAMENT_STAGE_TYPE: { type: Number, required: false },
  SHORT_NAME: { type: String, required: false },
  URL: { type: String, required: false },
  TOURNAMENT_IMAGE: { type: String, required: false },
  // SORT: { type: String, required: false },
  // STAGES_COUNT: { type: Number, required: false },
  // TSS: { type: String, required: false },
  // ZKL: { type: String, required: false },
  // ZKU: { type: String, required: false },
  // TOURNAMENT_SEASON_ID: { type: String, required: false },
  CATEGORY_NAME: { type: String, required: false },

  // Event timing
  START_TIME: { type: Number, required: false },
  START_UTIME: { type: Number, required: true },
  STAGE_TYPE: { type: String, required: false },
  MERGE_STAGE_TYPE: { type: String, required: false },
  STAGE: { type: String, required: false },
  ROUND: { type: String, required: false },
  // STAGE_START_TIME: { type: Number, required: false },

  // Game-specific fields
  // VISIBLE_RUN_RATE: { type: Number, required: false },
  // HAS_LINEPS: { type: Number, required: false },
  // GAME_TIME: { type: String, required: false },
  // PLAYING_ON_SETS: { type: Object, required: false },
  // RECENT_OVERS: { type: Object, required: false },

  // Home team
  SHORTNAME_HOME: { type: String, required: false },
  // HOME_PARTICIPANT_IDS: { type: Object, required: false },
  // HOME_PARTICIPANT_TYPES: { type: Object, required: false },
  HOME_NAME: { type: String, required: false },
  HOME_PARTICIPANT_NAME_ONE: { type: String, required: false },
  // HOME_EVENT_PARTICIPANT_ID: { type: String, required: false },
  HOME_GOAL_VAR: { type: Number, required: false },
  HOME_SCORE_CURRENT: { type: String, required: false },
  HOME_SCORE_FULL: { type: Number, required: false },
  HOME_SCORE_PART_1: { type: Number, required: false },
  HOME_SCORE_PART_2: { type: Number, required: false },
  HOME_SCORE_PART_3: { type: Number, required: false },
  HOME_SCORE_PART_4: { type: Number, required: false },
  HOME_IMAGES: { type: String, required: false },

  // Away team
  SHORTNAME_AWAY: { type: String, required: false },
  // AWAY_PARTICIPANT_IDS: { type: Object, required: false },
  // AWAY_PARTICIPANT_TYPES: { type: Object, required: false },
  AWAY_NAME: { type: String, required: false },
  AWAY_PARTICIPANT_NAME_ONE: { type: String, required: false },
  // AWAY_EVENT_PARTICIPANT_ID: { type: String, required: false },
  AWAY_GOAL_VAR: { type: Number, required: false },
  AWAY_SCORE_CURRENT: { type: String, required: false },
  AWAY_SCORE_FULL: { type: Number, required: false },
  AWAY_SCORE_PART_1: { type: Number, required: false },
  AWAY_SCORE_PART_2: { type: Number, required: false },
  AWAY_SCORE_PART_3: { type: Number, required: false },
  AWAY_SCORE_PART_4: { type: Number, required: false },
  AWAY_IMAGES: { type: String, required: false },

  // Match outcome
  WINNER: { type: Number, required: false },
  // ODDS_WINNER: { type: Number, required: false },
  // ODDS_WINNER_OUTCOME: { type: Number, required: false },

  // Other match metadata
  // IMM: { type: String, required: false },
  // IMW: { type: String, required: false },
  // IMP: { type: String, required: false },
  // IME: { type: String, required: false },
  // HAS_LIVE_CENTRE: { type: Number, required: false },
  // STATS_DATA: { type: Object, required: false },

  // Extras
  // INFO_NOTICE: { type: String, required: false },
  lastUpdated: { type: Number, required: false },

  // Nested schemas
  NEWS: [NewsSchema],
  VIDEOS: [VideosSchema],
  ODDS: [OddsSchema],
});

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;
