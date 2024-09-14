/* eslint-disable no-console */
/* eslint-disable no-restricted-syntax */
const Sport = require("../models/sportModel");
const Event = require("../models/eventModel");
const { getWeekEventsBySport } = require("./getWeekEventsBySport");
const { scorePartValidation } = require("./scorePartValidation");

async function getEvents() {
  try {
    const sportsList = [
      { id: 1, name: "Football" },
      { id: 2, name: "Tennis" },
      { id: 3, name: "Basketball" },
      { id: 4, name: "Hockey" },
      { id: 5, name: "American Football" },
      { id: 6, name: "Baseball" },
      { id: 7, name: "Handball" },
      { id: 8, name: "Rugby Union" },
      { id: 9, name: "Floorball" },
      { id: 10, name: "Bandy" },
      { id: 11, name: "Futsal" },
      { id: 12, name: "Volleyball" },
      { id: 13, name: "Cricket" },
      { id: 14, name: "Darts" },
      { id: 15, name: "Snooker" },
      { id: 16, name: "Boxing" },
      { id: 17, name: "Beach Volleyball" },
      { id: 18, name: "Aussie Rules" },
      { id: 19, name: "Rugby League" },
      { id: 21, name: "Badminton" },
      { id: 22, name: "Water Polo" },
      { id: 23, name: "Golf" },
      { id: 24, name: "Field Hockey" },
      { id: 25, name: "Table Tennis" },
      { id: 26, name: "Beach Football" },
      { id: 28, name: "MMA" },
      { id: 29, name: "Netball" },
      { id: 30, name: "Pesapallo" },
      { id: 36, name: "Esports" },
      { id: 42, name: "Kabadi" },
    ];

    for (const sportItem of sportsList) {
      console.log(sportItem);

      // eslint-disable-next-line no-await-in-loop
      const events = await getWeekEventsBySport(sportItem.id);
      for (let event of events) {
        event = scorePartValidation(event);

        try {
          // eslint-disable-next-line no-await-in-loop
          const updatedEvent = await Event.findOneAndUpdate(
            { EVENT_ID: event.EVENT_ID },
            event,
            {
              upsert: true,
              new: true,
              setDefaultsOnInsert: true,
            }
          );
          console.log("Updated or created event:", updatedEvent);
        } catch (error) {
          console.error("Error updating event:", error, event);
        }
      }
    }
  } catch (error) {
    console.error("Error fetching sports events:", error);
  } finally {
    // Optional: mongoose.connection.close();
  }
}

module.exports = { getEvents };



// // vent Keys for Football:
// // Key: NAME, Type: string
// // Key: HEADER, Type: string
// // Key: NAME_PART_1, Type: string
// // Key: NAME_PART_2, Type: string
// // Key: TOURNAMENT_TEMPLATE_ID, Type: string
// // Key: COUNTRY_ID, Type: number
// // Key: COUNTRY_NAME, Type: string
// // Key: TOURNAMENT_STAGE_ID, Type: string
// // Key: TOURNAMENT_TYPE, Type: string
// // Key: TOURNAMENT_ID, Type: string
// // Key: SOURCE_TYPE, Type: number
// // Key: HAS_LIVE_TABLE, Type: number
// // Key: STANDING_INFO, Type: number
// // Key: TEMPLATE_ID, Type: string
// // Key: TOURNAMENT_STAGE_TYPE, Type: number
// // Key: SHORT_NAME, Type: string
// // Key: URL, Type: string
// // Key: TOURNAMENT_IMAGE, Type: string
// // Key: SORT, Type: string
// // Key: STAGES_COUNT, Type: number
// // Key: TSS, Type: string
// // Key: ZKL, Type: string
// // Key: ZKU, Type: string
// // Key: TOURNAMENT_SEASON_ID, Type: string
// // Key: CATEGORY_NAME, Type: string
// // Key: EVENT_ID, Type: string
// // Key: START_TIME, Type: number
// // Key: START_UTIME, Type: number
// // Key: STAGE_TYPE, Type: string
// // Key: MERGE_STAGE_TYPE, Type: string
// // Key: STAGE, Type: string
// // Key: ROUND, Type: string
// // Key: VISIBLE_RUN_RATE, Type: number
// // Key: HAS_LINEPS, Type: number
// // Key: STAGE_START_TIME, Type: number
// // Key: GAME_TIME, Type: string
// // Key: PLAYING_ON_SETS, Type: object
// // Key: RECENT_OVERS, Type: object
// // Key: SHORTNAME_HOME, Type: string
// // Key: HOME_PARTICIPANT_IDS, Type: object
// // Key: HOME_PARTICIPANT_TYPES, Type: object
// // Key: HOME_NAME, Type: string
// // Key: HOME_PARTICIPANT_NAME_ONE, Type: string
// // Key: HOME_EVENT_PARTICIPANT_ID, Type: string
// // Key: HOME_GOAL_VAR, Type: number
// // Key: HOME_SCORE_CURRENT, Type: string
// // Key: HOME_SCORE_PART_2, Type: number
// // Key: HOME_IMAGES, Type: string
// // Key: IMM, Type: string
// // Key: IMW, Type: string
// // Key: IMP, Type: string
// // Key: IME, Type: string
// // Key: SHORTNAME_AWAY, Type: string
// // Key: AWAY_PARTICIPANT_IDS, Type: object
// // Key: AWAY_PARTICIPANT_TYPES, Type: object
// // Key: AWAY_NAME, Type: string
// // Key: AWAY_PARTICIPANT_NAME_ONE, Type: string
// // Key: AWAY_EVENT_PARTICIPANT_ID, Type: string
// // Key: WINNER, Type: number
// // Key: ODDS_WINNER, Type: number
// // Key: ODDS_WINNER_OUTCOME, Type: number
// // Key: AWAY_GOAL_VAR, Type: number
// // Key: AWAY_SCORE_CURRENT, Type: string
// // Key: AWAY_SCORE_FULL, Type: number
// // Key: AWAY_SCORE_PART_2, Type: number
// // Key: AWAY_IMAGES, Type: string
// // Key: HAS_LIVE_CENTRE, Type: number
// // Key: STATS_DATA, Type: object
// // Key: lastUpdated, Type: number
// // Key: SPORT, Type: number
// // Failed to fetch event v1XBMDPP: 404
// // EVENT_ID CW2FVj2t STAGE_TYPE SCHEDULED STAGE SCH


// export interface EventFlash {
//   EVENT_ID: string;
//   AWAY_EVENT_PARTICIPANT_ID: string;
//   AWAY_GOAL_VAR?: number;
//   AWAY_IMAGES?: string;
//   AWAY_NAME: string;
//   AWAY_PARTICIPANT_NAME_ONE: string;
//   CATEGORY_NAME: string;
//   COUNTRY_ID: number;
//   COUNTRY_NAME: string;
//   HEADER: string;
//   HOME_EVENT_PARTICIPANT_ID: string;
//   HOME_GOAL_VAR: number;
//   HOME_IMAGES: string;
//   HOME_NAME: string;
//   HOME_PARTICIPANT_NAME_ONE: string;
//   MERGE_STAGE_TYPE: string;
//   NAME: string;
//   SHORTNAME_AWAY: string;
//   SHORTNAME_HOME: string;
//   SHORT_NAME: string;
//   SPORT: string;
//   STAGE: string;
//   STAGE_START_TIME: number;
//   STAGE_TYPE: string;
//   START_UTIME: number;
//   TOURNAMENT_ID: string;
//   TOURNAMENT_IMAGE: string;
//   WINNER: number;
//   AWAY_SCORE_CURRENT: string;
//   HOME_SCORE_CURRENT: string;
//   URL: string;
//   NEWS: any;
//   VIDEOS: any;
//   ODDS: any;
//   __v: number;
//   lastUpdated: number;
// }
