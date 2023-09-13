const {
  getUnfinishedEvents,
  deleteEventById,
} = require("./flashLive/getUnfinishedEvents");
const mongoose = require("mongoose");
const ck = require("ckey");
const Event = require("./models/eventModel");
const { EventById } = require("./flashLive/EventById");
const { NewsByEventId } = require("./flashLive/NewsByEventId");
const { scorePartValidation } = require("./flashLive/scorePartValidation");

async function main() {
  try {
    await mongoose.connect(ck.CONNECTION_STRING, {
      useNewUrlParser: true,
      // useCreateIndex: true,
      dbName: "flashLiveDB",
    });
    const news = await NewsByEventId("6ZCocWsb");
    console.log("news", news);

    news.forEach((element) => {
      console.log(element);
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // mongoose.connection.close();
  }
}

main();

async function getEvent(_eventId) {
  try {
    // Fetch updated event data from an external source using the EventById function.
    let newEvent = await EventById(_eventId);
    console.log(newEvent);
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
