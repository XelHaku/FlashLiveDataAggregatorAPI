const axios = require('axios');
const ck = require('ckey');

async function EventListFlashLive(sportId, indentDays) {
  const now = Math.floor(Date.now() / 1000);
  const options = {
    method: 'GET',
    url: 'https://flashlive-sports.p.rapidapi.com/v1/events/list',
    params: {
      indent_days: indentDays,
      locale: 'en_INT',
      timezone: '0',
      sport_id: sportId,
    },
    headers: {
      'X-RapidAPI-Key': ck.RAPID_API_KEY,
      'X-RapidAPI-Host': ck.RAPID_HOST,
    },
  };
  const events = [];
  try {
    const response = await axios.request(options);
    const data = response.data.DATA;

    for (let i = 0; i < data.length; i += 1) {
      if (data[i].EVENTS !== undefined) {
        for (let j = 0; j < data[i].EVENTS.length; j += 1) {
          // eslint-disable-next-line node/no-unsupported-features/es-syntax
          const event = { ...data[i], ...data[i].EVENTS[j] };
          event.lastUpdated = now;
          delete event.EVENTS;
          events.push(event);
          // console.log(event);
        }
      }
    }
    return events;
  } catch (error) {
    console.error(error);
    return null;
  }
}

// EventListFlashLive(6);

module.exports = { EventListFlashLive };
