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

