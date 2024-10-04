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

    // console.log("eventData:", data);

    // Extract relevant data from the response
    let event = data.EVENT;
    let tournament = data.TOURNAMENT;
    let sport = data.SPORT.SPORT_ID;

    // Merge event and tournament data if needed
    event = { ...event, ...tournament };

    // Process image URLs
    if (event.HOME_IMAGES != null && event.HOME_IMAGES.length > 0) {
      event.HOME_IMAGES = event.HOME_IMAGES[0];
    }
    if (event.AWAY_IMAGES != null && event.AWAY_IMAGES.length > 0) {
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


// use this instead
// curl --request GET \
// 	--url 'https://flashlive-sports.p.rapidapi.com/v1/events/details?event_id=6ZCocWsb&locale=en_INT' \
// 	--header 'x-rapidapi-host: flashlive-sports.p.rapidapi.com' \
// 	--header 'x-rapidapi-key: 1d86ae077bmsh03965d8264487c4p14d0ffjsnf78cc55d6658'

