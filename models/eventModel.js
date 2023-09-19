const mongoose = require("mongoose");

const { Schema } = mongoose;
const VideosSchema = new Schema({
  PROPERTY_LINK: { type: String, default: null },
  PROPERTY_TIME: { type: Number, default: null }, // Using Number, assuming it's a timestamp. Adjust if needed.
  PROPERTY_INCIDENT_TYPE: { type: String, default: null },
  PROPERTY_TITLE: { type: String, default: null },
  PROPERTY_SUBTITLE1: { type: String, default: null },
  PROPERTY_SOURCE: { type: String, default: "YouTube" },
  PROPERTY_IS_TOP: { type: Number, default: 1 }, // Using Number for binary flag. Consider using Boolean if appropriate.
  PROPERTY_TITLE_SECONDARY: { type: String, default: "Match highlights" },
  PROPERTY_IS_OFFICIAL: { type: Number, default: 1 }, // Using Number for binary flag. Consider using Boolean if appropriate.
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
  //TOURNAMENT INFO
  NAME: { type: String, required: true },
  HEADER: { type: String, required: true },
  NAME_PART_1: { type: String, required: false },
  NAME_PART_2: { type: String, required: false },

  COUNTRY_ID: { type: Number, required: false },
  COUNTRY_NAME: { type: String, required: false },
  TOURNAMENT_ID: { type: String, required: false },
  SHORT_NAME: { type: String, required: false },
  URL: { type: String, required: false },
  TOURNAMENT_IMAGE: { type: String, required: false },
  SORT: { type: String, required: false },

  CATEGORY_NAME: { type: String, required: false },
  START_UTIME: { type: Number, required: true },

  STAGE_TYPE: { type: String, required: false },
  MERGE_STAGE_TYPE: { type: String, required: false },
  STAGE: { type: String, required: false },
  ROUND: { type: String, required: false },
  STAGE_START_TIME: { type: Number, required: false },

  // HOME TEAM
  SHORTNAME_HOME: { type: String, required: false },
  HOME_NAME: { type: String, required: false },
  HOME_PARTICIPANT_NAME_ONE: { type: String, required: false },
  HOME_EVENT_PARTICIPANT_ID: { type: String, required: false },
  HOME_GOAL_VAR: { type: Number, required: false },
  HOME_SCORE_CURRENT: { type: String, required: false },
  HOME_SCORE_FULL: { type: String, required: false },
  HOME_SCORE_PART_1: { type: Number, required: false },
  HOME_SCORE_PART_2: { type: Number, required: false },
  HOME_SCORE_PART_3: { type: Number, required: false },
  HOME_SCORE_PART_4: { type: Number, required: false },
  HOME_SCORE_PART_5: { type: Number, required: false },
  HOME_SCORE_PART_6: { type: Number, required: false },
  HOME_SCORE_PART_7: { type: Number, required: false },
  HOME_SCORE_PART_8: { type: Number, required: false },
  HOME_SCORE_PART_9: { type: Number, required: false },
  HOME_SCORE_PART_X: { type: String, required: false },
  HOME_IMAGES: { type: String, required: false },

  //AWAY TEAM
  SHORTNAME_AWAY: { type: String, required: false },
  AWAY_NAME: { type: String, required: false },
  AWAY_PARTICIPANT_NAME_ONE: { type: String, required: false },
  AWAY_EVENT_PARTICIPANT_ID: { type: String, required: false },
  AWAY_GOAL_VAR: { type: Number, required: false },
  AWAY_SCORE_CURRENT: { type: String, required: false },
  AWAY_SCORE_FULL: { type: Number, required: false },
  AWAY_SCORE_PART_1: { type: Number, required: false },
  AWAY_SCORE_PART_2: { type: Number, required: false },
  AWAY_SCORE_PART_3: { type: Number, required: false },
  AWAY_SCORE_PART_4: { type: Number, required: false },
  AWAY_SCORE_PART_5: { type: Number, required: false },
  AWAY_SCORE_PART_6: { type: Number, required: false },
  AWAY_SCORE_PART_7: { type: Number, required: false },
  AWAY_SCORE_PART_8: { type: Number, required: false },
  AWAY_SCORE_PART_9: { type: Number, required: false },
  AWAY_SCORE_PART_X: { type: String, required: false },
  AWAY_IMAGES: { type: String, required: false },

  // WINNER
  WINNER: { type: Number, required: false },
  // TIME
  lastUpdated: { type: Number, required: false },

  //EXTRAS
  INFO_NOTICE: { type: String, required: false },
  // Adding the NEWS array to the schema
  NEWS: [NewsSchema, (required = false)],
  VIDEOS: [VideosSchema, (required = false)],
});

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;
