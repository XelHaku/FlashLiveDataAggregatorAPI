/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
// const ck = require('ckey');
const { EventListFlashLive } = require('./EventListFlashLive');
// const { SportsFlashLive } = require('./SportsFlashLive');

// const mongoose = require('mongoose');
// const Sport = require('./models/sportModel');

async function getWeekEventsBySport(_sport) {
  let events = [];
  // eslint-disable-next-line no-plusplus
  for (let i = -1; i <= 1; i++) {
    try {
      const eventsDay = await EventListFlashLive(_sport, i);
      if (eventsDay !== undefined) {
        for (const event of eventsDay) {
          if (event.HOME_IMAGES !== null && event.HOME_IMAGES !== undefined) {
            event.HOME_IMAGES = event.HOME_IMAGES[0];
          }
          if (event.AWAY_IMAGES !== null && event.AWAY_IMAGES !== undefined) {
            event.AWAY_IMAGES = event.AWAY_IMAGES[0];
          }
          event.SPORT = _sport;
        }

        events = events.concat(eventsDay);
      }
    } catch (e) {
      console.log(i, e);
    }
  }

  return events;
}

module.exports = { getWeekEventsBySport };
