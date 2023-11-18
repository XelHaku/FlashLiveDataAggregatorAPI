/* eslint-disable no-console */
/* eslint-disable no-restricted-syntax */
const Sport = require("../models/sportModel");
const Event = require("../models/eventModel");

async function getUnfinishedEvents() {
  try {
    const currentTime = Math.floor(Date.now() / 1000);
    const twoHoursInSeconds = 3 * 60 * 60; // 2 hours in seconds
    const startTimeThreshold = currentTime - twoHoursInSeconds;

    let fifteenMinutesAgo = currentTime - 15 * 60 * 1000; // 15 minutes in milliseconds
    // fifteenMinutesAgo = currentTime; // 15 minutes in milliseconds

    let eventsList = await Event.aggregate([
      {
        $match: {
          START_UTIME: { $lt: startTimeThreshold },
          STAGE_TYPE: { $ne: "FINISHED" },
          // lastUpdated: { $lt: fifteenMinutesAgo },
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
