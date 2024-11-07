const ck = require("ckey");
const Event = require("../models/eventModel");
const { EventById } = require("../flashLive/EventById");

// cleanUnfinishedEvents();

async function dbUpdateEventById(_eventId) {
  try {
    // Fetch updated event data from an external source using the EventById function.
    let newEvent = await EventById(_eventId);

    if (newEvent && newEvent != 404) {
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

module.exports = { dbUpdateEventById };
