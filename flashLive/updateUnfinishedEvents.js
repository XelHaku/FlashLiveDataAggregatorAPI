const {
  getUnfinishedEvents,
  deleteEventById,
} = require("./getUnfinishedEvents");
// const mongoose = require("mongoose");
const ck = require("ckey");
const Event = require("../models/eventModel");
const { EventById } = require("./EventById");
const { scorePartValidation } = require("./scorePartValidation");
const { dbUpdateEventById } = require("../db/dbUpdateEventById");
async function updateUnfinishedEvents() {
  try {
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
        event.SPORT,
        "lastUpdated",
        new Date(event.lastUpdated * 1000).toLocaleString()
      );

      // Calculate the date one month ago
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      // Check if the event is older than one month
      if (event.START_UTIME * 1000 < oneMonthAgo.getTime()) {
        console.log(`Deleting old event with EVENT_ID: ${event.EVENT_ID}`);
        await deleteEventById(event.EVENT_ID);
      } else {
        await dbUpdateEventById(event.EVENT_ID);
      }
    }
    console.log("length", events.length);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // mongoose.connection.close();
  }
}


module.exports = { updateUnfinishedEvents };
