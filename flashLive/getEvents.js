/* eslint-disable no-console */
/* eslint-disable no-restricted-syntax */
const Sport = require("../models/sportModel");
const Event = require("../models/eventModel");
const { getWeekEventsBySport } = require("./getWeekEventsBySport");
const { scorePartValidation } = require("./scorePartValidation");

async function getEvents() {
  try {
    const sportsList = await Sport.find({ AVAILABLE: true });
    for (const sportItem of sportsList) {
      console.log(sportItem);

      // eslint-disable-next-line no-await-in-loop
      const events = await getWeekEventsBySport(sportItem.ID);
      for (let event of events) {
        // console.log(event);
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
          // console.log("Updated or created event:", updatedEvent);
        } catch (error) {
          console.error("Error:", error, event);
        }
      }
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // mongoose.connection.close();
  }
}

module.exports = { getEvents };
