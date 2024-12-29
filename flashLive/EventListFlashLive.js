const ck = require("ckey");

async function EventListFlashLive(sportId, indentDays) {
  const now = Math.floor(Date.now() / 1000);
  const url = new URL("https://flashlive-sports.p.rapidapi.com/v1/events/list");

  url.searchParams.append("indent_days", indentDays);
  url.searchParams.append("locale", "en_INT");
  url.searchParams.append("timezone", "0");
  url.searchParams.append("sport_id", sportId);

  const options = {
    method: "GET",
    headers: {
      "X-RapidAPI-Key": ck.RAPID_API_KEY,
      "X-RapidAPI-Host": ck.RAPID_HOST,
    },
  };

  try {
    const response = await fetch(url, options);
console.log(response);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    const data = responseData.DATA;

    const events = data.flatMap((item) => {
      if (item.EVENTS) {
        return item.EVENTS.map((event) => {
          const combinedEvent = { ...item, ...event, lastUpdated: now };
          delete combinedEvent.EVENTS;
          return combinedEvent;
        });
      }
      return [];
    });

    return events;
  } catch (error) {
    console.error("Error fetching event list:", error);
    return null;
  }
}

module.exports = { EventListFlashLive };
