const axios = require("axios");
const ck = require("ckey");
const { scorePartValidation } = require("./scorePartValidation");

async function EventById(eventId) {
  const options = {
    method: "GET",
    url: "https://flashlive-sports.p.rapidapi.com/v1/events/data",
    params: {
      locale: "en_INT",
      event_id: eventId,
    },
    headers: {
      "X-RapidAPI-Key": ck.RAPID_API_KEY,
      "X-RapidAPI-Host": ck.RAPID_HOST,
    },
  };
  try {
    const response = await axios.request(options);
    const data = response.data.DATA;
    const sport = response.data.DATA.SPORT.SPORT_ID;
    let event = data.EVENT;
    if (event.HOME_IMAGES !== null && event.HOME_IMAGES !== undefined) {
      event.HOME_IMAGES = event.HOME_IMAGES[0];
    }
    if (event.AWAY_IMAGES !== null && event.AWAY_IMAGES !== undefined) {
      event.AWAY_IMAGES = event.AWAY_IMAGES[0];
    }
    event.SPORT = sport;
    const now = Math.floor(Date.now() / 1000);
    event.lastUpdated = now;

    event = scorePartValidation(event);

    return event;
  } catch (error) {
    console.log(error.response.status);
    if (error.response.status === 404) {
      return 404;
    }
    return null;
  }
}

module.exports = { EventById };
