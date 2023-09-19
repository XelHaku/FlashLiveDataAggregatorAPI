const axios = require("axios");
const ck = require("ckey");
const { scorePartValidation } = require("./scorePartValidation");

async function NewsByEventId(eventId) {
  const options = {
    method: "GET",
    url: "https://flashlive-sports.p.rapidapi.com/v1/events/news",
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

    return data;
  } catch (error) {
    console.error(error);
    return 1;
  }
}

module.exports = { NewsByEventId };
