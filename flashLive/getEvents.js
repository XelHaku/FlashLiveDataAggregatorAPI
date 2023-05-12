/* eslint-disable no-console */
/* eslint-disable no-restricted-syntax */
const { getWeekEventsBySport } = require('./getWeekEventsBySport');
const Sport = require('../models/sportModel');
const Event = require('../models/eventModel');

async function getEvents() {
  try {
    // await mongoose.connect(ck.CONNECTION_STRING, {
    //   useNewUrlParser: true,
    //   useUnifiedTopology: true,
    //   dbName: 'flashLiveDB',
    // });

    const sportsList = await Sport.find({ AVAILABLE: true });
    for (const sportItem of sportsList) {
      console.log(sportItem);

      // eslint-disable-next-line no-await-in-loop
      const events = await getWeekEventsBySport(sportItem.ID);
      for (const event of events) {
        // console.log(event);
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
          console.log('Updated or created event:', updatedEvent);
        } catch (error) {
          console.error('Error:', error);
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // mongoose.connection.close();
  }
}

// getEvents();

module.exports = { getEvents };
