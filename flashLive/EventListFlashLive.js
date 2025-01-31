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
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    const data = responseData.DATA;

    const allowedFields = [
      'EVENT_ID',
      'SPORT',
      'NAME',
      'HEADER',
      'NAME_PART_1',
      'NAME_PART_2',
      'COUNTRY_ID',
      'COUNTRY_NAME',
      'TOURNAMENT_ID',
      'TEMPLATE_ID',
      'SHORT_NAME',
      'URL',
      'TOURNAMENT_IMAGE',
      'CATEGORY_NAME',
      'START_UTIME',
      'STAGE_TYPE',
      'STAGE',
      'SHORTNAME_HOME',
      'HOME_NAME',
      'HOME_PARTICIPANT_NAME_ONE',
      'HOME_GOAL_VAR',
      'HOME_SCORE_CURRENT',
      'HOME_SCORE_FULL',
      'HOME_SCORE_PART_1',
      'HOME_SCORE_PART_2',
      'HOME_SCORE_PART_3',
      'HOME_SCORE_PART_4',
      'HOME_IMAGES',
      'SHORTNAME_AWAY',
      'AWAY_NAME',
      'AWAY_PARTICIPANT_NAME_ONE',
      'AWAY_GOAL_VAR',
      'AWAY_SCORE_CURRENT',
      'AWAY_SCORE_FULL',
      'AWAY_SCORE_PART_1',
      'AWAY_SCORE_PART_2',
      'AWAY_SCORE_PART_3',
      'AWAY_SCORE_PART_4',
      'AWAY_IMAGES',
      'WINNER',
      'lastUpdated',
      'NEWS',
      'VIDEOS',
      'ODDS'
    ];

    const events = data.flatMap((item) => {
      if (item.EVENTS) {
        return item.EVENTS.map((event) => {
          const combinedEvent = { ...item, ...event, lastUpdated: now };
          delete combinedEvent.EVENTS;
          
          // Filter out unwanted properties
          const filteredEvent = {};
          for (const field of allowedFields) {
            if (combinedEvent.hasOwnProperty(field)) {
              filteredEvent[field] = combinedEvent[field];
            }
          }
          
          return filteredEvent;
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