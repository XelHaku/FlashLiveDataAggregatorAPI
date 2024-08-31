const ck = require("ckey");
const { scorePartValidation } = require("./scorePartValidation");

async function VideosByEventId(eventId) {
  const url = new URL(
    "https://flashlive-sports.p.rapidapi.com/v1/events/highlights"
  );
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
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const jsonData = await response.json();
    return jsonData.DATA;
  } catch (error) {
    // console.error("Error fetching video data:", error);
    return null;
  }
}

module.exports = { VideosByEventId };
