const {
  getUnfinishedEvents,
  deleteEventById,
} = require("./flashLive/getUnfinishedEvents");
const mongoose = require("mongoose");
const ck = require("ckey");
const Event = require("./models/eventModel");
const { EventById } = require("./flashLive/EventById");
const { scorePartValidation } = require("./flashLive/scorePartValidation");

async function cleanUnfinishedEvents() {
  try {
    await mongoose.connect(ck.CONNECTION_STRING, {
      useNewUrlParser: true,
      // useCreateIndex: true,
      dbName: "flashLiveDB",
    });

    console.log("DB connection successful!");

    const events = await getUnfinishedEvents();

    for (const event of events) {
      console.log(
        "EVENT_ID",
        event.EVENT_ID,
        "STAGE_TYPE",
        event.STAGE_TYPE,
        "STAGE",
        event.STAGE,
        "START_UTIME",
        new Date(event.START_UTIME * 1000).toLocaleString(),
        "SPORT",
        event.SPORT
      );
      await getEvent(event.EVENT_ID);
    }
    console.log("length", events.length);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    mongoose.connection.close();
  }
}

cleanUnfinishedEvents();

async function getEvent(_eventId) {
  try {
    // Fetch updated event data from an external source using the EventById function.
    let newEvent = await EventById(_eventId);

    if (newEvent) {
      // console.log(newEvent);
      newEvent = scorePartValidation(newEvent);
      // console.log(newEvent);
      // Update the event data in the database using findOneAndUpdate method.
      const updatedEvent = await Event.findOneAndUpdate(
        { EVENT_ID: _eventId },
        newEvent,
        {
          upsert: true, // Create a new document if no matching document is found.
          new: true, // Return the updated document after the update operation.
          setDefaultsOnInsert: true, // Set default values if a new document is created.
        }
      );

      // Remove unwanted keys from the updated event object.
      if (updatedEvent) {
        updatedEvent._id = undefined;
        updatedEvent.__v = undefined;
      }

      console.log("Updated or created event:", updatedEvent);
    } else {
      deleteEventById(_eventId);
    }
  } catch (error) {
    console.error(error);
  }
}

// function scorePartValidation(event) {
//   // HOME
//   console.log("event", event);

//   if (event.HOME_SCORE_PART_1) {
//     event.HOME_SCORE_PART_1 = fixString(event.HOME_SCORE_PART_1);
//   }

//   if (event.HOME_SCORE_PART_2) {
//     event.HOME_SCORE_PART_2 = fixString(event.HOME_SCORE_PART_2);
//   }

//   if (event.HOME_SCORE_PART_3) {
//     event.HOME_SCORE_PART_3 = fixString(event.HOME_SCORE_PART_3);
//   }

//   if (event.HOME_SCORE_PART_4) {
//     event.HOME_SCORE_PART_4 = fixString(event.HOME_SCORE_PART_4);
//   }

//   if (event.HOME_SCORE_PART_5) {
//     event.HOME_SCORE_PART_5 = fixString(event.HOME_SCORE_PART_5);
//   }

//   if (event.HOME_SCORE_PART_6) {
//     event.HOME_SCORE_PART_6 = fixString(event.HOME_SCORE_PART_6);
//   }

//   if (event.HOME_SCORE_PART_7) {
//     event.HOME_SCORE_PART_7 = fixString(event.HOME_SCORE_PART_7);
//   }

//   if (event.HOME_SCORE_PART_8) {
//     event.HOME_SCORE_PART_8 = fixString(event.HOME_SCORE_PART_8);
//   }

//   if (event.HOME_SCORE_PART_9) {
//     event.HOME_SCORE_PART_9 = fixString(event.HOME_SCORE_PART_9);
//   }
//   //AWAY
//   if (event.AWAY_SCORE_PART_1) {
//     event.AWAY_SCORE_PART_1 = fixString(event.AWAY_SCORE_PART_1);
//   }

//   if (event.AWAY_SCORE_PART_2) {
//     event.AWAY_SCORE_PART_2 = fixString(event.AWAY_SCORE_PART_2);
//   }

//   if (event.AWAY_SCORE_PART_3) {
//     event.AWAY_SCORE_PART_3 = fixString(event.AWAY_SCORE_PART_3);
//   }

//   if (event.AWAY_SCORE_PART_4) {
//     event.AWAY_SCORE_PART_4 = fixString(event.AWAY_SCORE_PART_4);
//   }

//   if (event.AWAY_SCORE_PART_5) {
//     event.AWAY_SCORE_PART_5 = fixString(event.AWAY_SCORE_PART_5);
//   }

//   if (event.AWAY_SCORE_PART_6) {
//     event.AWAY_SCORE_PART_6 = fixString(event.AWAY_SCORE_PART_6);
//   }

//   if (event.AWAY_SCORE_PART_7) {
//     event.AWAY_SCORE_PART_7 = fixString(event.AWAY_SCORE_PART_7);
//   }

//   if (event.AWAY_SCORE_PART_8) {
//     event.AWAY_SCORE_PART_8 = fixString(event.AWAY_SCORE_PART_8);
//   }

//   if (event.AWAY_SCORE_PART_9) {
//     event.AWAY_SCORE_PART_9 = fixString(event.AWAY_SCORE_PART_9);
//   }
//   return event;
// }

// function fixString(_value) {
//   if (typeof _value === "string") {
//     const numericValue = Number(_value);
//     if (isNaN(numericValue)) {
//       _value = 0;
//     } else {
//       _value = numericValue;
//     }
//   }

//   return _value;
// }

// //   EVENT_ID: 'dS7agUH5',
// //   AWAY_EVENT_PARTICIPANT_ID: 'O43HtcKq',
// //   AWAY_GOAL_VAR: 0,
// //   AWAY_IMAGES: 'https://www.flashscore.com/res/image/data/4jc6udhl-MyFeHWzn.png',
// //   AWAY_NAME: 'Pittsburgh Pirates',
// //   AWAY_PARTICIPANT_NAME_ONE: 'Pittsburgh Pirates',
// //   CATEGORY_NAME: 'USA',
// //   COUNTRY_ID: 200,
// //   COUNTRY_NAME: 'USA',
// //   HEADER: 'USA: MLB;175;4O099Es6',
// //   HOME_EVENT_PARTICIPANT_ID: 'MeHkowCS',
// //   HOME_GOAL_VAR: 0,
// //   HOME_IMAGES: 'https://www.flashscore.com/res/image/data/dWIh4Til-8toS1iya.png',
// //   HOME_NAME: 'Baltimore Orioles',
// //   HOME_PARTICIPANT_NAME_ONE: 'Baltimore Orioles',
// //   MERGE_STAGE_TYPE: 'LIVE',
// //   NAME: 'USA: MLB',
// //   NAME_PART_1: 'USA',
// //   NAME_PART_2: 'MLB',
// //   SHORTNAME_AWAY: 'PIT',
// //   SHORTNAME_HOME: 'BAL',
// //   SHORT_NAME: 'MLB',
// //   SORT: 'Baltimore Orioles',
// //   SPORT: 6,
// //   STAGE: 'NINTH_INNING',
// //   STAGE_TYPE: 'LIVE',
// //   START_UTIME: 1683932700,
// //   TOURNAMENT_ID: 'WKGtYoEE',
// //   TOURNAMENT_IMAGE: 'https://www.flashscore.com/res/image/data/67eGZ1iD-fulSBIc8.png',
// //   URL: '/baseball/usa/mlb/',
// //   lastUpdated: 1683942662,
// //   AWAY_SCORE_CURRENT: '3',
// //   AWAY_SCORE_PART_1: 0,
// //   AWAY_SCORE_PART_2: 0,
// //   AWAY_SCORE_PART_3: 1,
// //   HOME_SCORE_CURRENT: '6',
// //   HOME_SCORE_PART_1: 0,
// //   HOME_SCORE_PART_2: 0,
// //   HOME_SCORE_PART_3: 0,
// //   STAGE_START_TIME: 1683941811,
// //   AWAY_SCORE_PART_4: 0,
// //   AWAY_SCORE_PART_5: 0,
// //   AWAY_SCORE_PART_6: 0,
// //   HOME_SCORE_PART_4: 0,
// //   HOME_SCORE_PART_5: 0,
// //   HOME_SCORE_PART_6: 1,
// //   AWAY_SCORE_PART_7: 1,
// //   AWAY_SCORE_PART_8: 0,
// //   AWAY_SCORE_PART_9: 1,
// //   HOME_SCORE_PART_7: 2,
// //   HOME_SCORE_PART_8: 3
