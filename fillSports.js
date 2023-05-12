/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
// const { EventListFlashLive } = require('./flashLive/EventListFlashLive');
const mongoose = require('mongoose');
const ck = require('ckey');
const { SportsFlashLive } = require('./flashLive/SportsFlashLive');

const Sport = require('./models/sportModel');

async function fillSports() {
  const unavailableSports = [42, 31, 32, 33, 34, 35, 37, 39, 40];
  const sports = await SportsFlashLive();

  for (let i = 0; i < sports.length; i++) {
    sports[i].AVAILABLE = !unavailableSports.includes(sports[i].ID);
  }
  mongoose
    .connect(ck.CONNECTION_STRING, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'flashLiveDB',
    })
    .then(() => {
      console.log('Connected to the Database.');
    })
    .catch((err) => console.error(err));

  (async () => {
    for (const sport of sports) {
      const existingSport = await Sport.findOne({ ID: sport.ID });

      if (!existingSport) {
        await Sport.create(sport);
        console.log(`Sport with ID: ${sport.ID} added to the database.`);
      } else {
        console.log(
          `Sport with ID: ${sport.ID} already exists in the database.`
        );
      }
    }

    mongoose.connection.close();
  })();
}
fillSports();
