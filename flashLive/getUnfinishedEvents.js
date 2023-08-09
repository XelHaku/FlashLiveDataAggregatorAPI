/* eslint-disable no-console */
/* eslint-disable no-restricted-syntax */
const { getWeekEventsBySport } = require("./getWeekEventsBySport");
const Sport = require("../models/sportModel");
const Event = require("../models/eventModel");

async function getUnfinishedEvents() {
  try {
    const currentTime = Math.floor(Date.now() / 1000);
    const twoHoursInSeconds = 24 * 60 * 60; // 2 hours in seconds
    const startTimeThreshold = currentTime - twoHoursInSeconds;

    let eventsList = await Event.aggregate([
      {
        $match: {
          START_UTIME: { $lt: startTimeThreshold },
          STAGE_TYPE: { $ne: "FINISHED" },
        },
      },
    ]);

    eventsList = eventsList.map((event) => {
      const { _id, __v, ...cleanedEvent } = event;
      return cleanedEvent;
    });

    return eventsList;
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
}

// module.exports = {};

// async function deleteOldEvents() {
//   try {
//     const oneMonthInSeconds = 30 * 24 * 60 * 60; // 1 month in seconds
//     const currentTime = Math.floor(Date.now() / 1000);
//     const cutoffTime = currentTime - oneMonthInSeconds;

//     // Find and delete events older than 1 month
//     await Event.deleteMany({
//       START_UTIME: { $lt: cutoffTime },
//       STAGE_TYPE: { $ne: "FINISHED" },
//     });

//     console.log("Old events deleted successfully");
//   } catch (error) {
//     console.error("Error:", error);
//   }
// }

// module.exports = { deleteOldEvents };

/* eslint-disable no-console */

async function deleteEventById(eventId) {
  try {
    const result = await Event.deleteOne({ EVENT_ID: eventId });
    console.log(result);
    if (result.deletedCount > 0) {
      console.log(`Event with ID ${eventId} deleted successfully`);
    } else {
      console.log(`Event with ID ${eventId} not found`);
    }
  } catch (error) {
    console.log("Error:", error);
  }
}

module.exports = { getUnfinishedEvents, deleteEventById };
