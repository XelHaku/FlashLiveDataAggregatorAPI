const ck = require("ckey");
const { scorePartValidation } = require("./scorePartValidation");

async function EventById(eventId) {
  const url = new URL("https://flashlive-sports.p.rapidapi.com/v1/events/data");
  url.searchParams.append("locale", "en_INT");
  url.searchParams.append("event_id", eventId);

  const options = {
    method: "GET",
    headers: {
      "X-RapidAPI-Key": ck.RAPID_API_KEY,
      "X-RapidAPI-Host": ck.RAPID_HOST,
    },
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      console.warn(`Failed to fetch event ${eventId}: ${response.status}`);
      return {}; // Return an empty object if the fetch fails
    }

    const responseData = await response.json();
    const data = responseData.DATA;
    const sport = data.SPORT.SPORT_ID;
    let event = data.EVENT;

    if (event.HOME_IMAGES != null) {
      event.HOME_IMAGES = event.HOME_IMAGES[0];
    }
    if (event.AWAY_IMAGES != null) {
      event.AWAY_IMAGES = event.AWAY_IMAGES[0];
    }

    event.SPORT = sport;
    event.lastUpdated = Math.floor(Date.now() / 1000);
    event = scorePartValidation(event);

    return event;
  } catch (error) {
    console.error(`Error fetching event ${eventId}:`, error.message);
    return {}; // Return an empty object in case of an error
  }
}

module.exports = { EventById };
