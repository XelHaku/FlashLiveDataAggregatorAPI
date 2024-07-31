const axios = require("axios");
const ck = require("ckey");

async function MatchOddsByEventId(eventId, sportId) {
  const options = {
    method: "GET",
    url: "https://flashlive-sports.p.rapidapi.com/v1/events/prematch-odds",
    params: {
      locale: "en_INT",
      event_id: eventId,
      sport_id: sportId,
    },
    headers: {
      "X-RapidAPI-Key": ck.RAPID_API_KEY,
      "X-RapidAPI-Host": "flashlive-sports.p.rapidapi.com",
    },
  };

  try {
    const response = await axios.request(options);
    console.log("Match data response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching match data:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
    return null;
  }
}

module.exports = { MatchOddsByEventId };
