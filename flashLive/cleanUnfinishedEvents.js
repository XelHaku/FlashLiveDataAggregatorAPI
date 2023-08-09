const {
  getUnfinishedEvents,
  deleteEventById,
} = require("./getUnfinishedEvents");
const mongoose = require("mongoose");
const ck = require("ckey");
const Event = require("../models/eventModel");
const { EventById } = require("./EventById");
const { scorePartValidation } = require("./scorePartValidation");

async function cleanUnfinishedEvents() {
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
      await updateEventById(event.EVENT_ID);
    }
    console.log("length", events.length);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    mongoose.connection.close();
  }
}

// cleanUnfinishedEvents();

async function updateEventById(_eventId) {
  try {
    // Fetch updated event data from an external source using the EventById function.
    let newEvent = await EventById(_eventId);

    if (newEvent) {
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

      // console.log("Updated or created event:", updatedEvent);
    } else {
      deleteEventById(_eventId);
    }
  } catch (error) {
    console.error(error);
  }
}

module.exports = { cleanUnfinishedEvents };
