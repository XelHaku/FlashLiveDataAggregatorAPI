const axios = require("axios");
const ck = require("ckey");

async function MatchOddsByEventId(eventId) {
  const options = {
    method: "GET",
    url: "https://flashlive-sports.p.rapidapi.com/v1/events/odds",
    params: {
      locale: "en_INT",
      event_id: eventId,
    },
    headers: {
      "X-RapidAPI-Key": ck.RAPID_API_KEY,
      "X-RapidAPI-Host": "flashlive-sports.p.rapidapi.com",
    },
  };

  try {
    const response = await axios.request(options);
    const homeAwayOdds = response.data.DATA.find(
      (item) => item.BETTING_TYPE === "*1X2"
    );

    if (homeAwayOdds) {
      const matchOdds = homeAwayOdds.PERIODS.find(
        (period) => period.ODDS_STAGE === "*Full Time"
      );

      if (matchOdds && matchOdds.GROUPS && matchOdds.GROUPS[0].MARKETS) {
        const bookmakers = matchOdds.GROUPS[0].MARKETS.map((market) => ({
          bookmakerId: market.BOOKMAKER_ID,
          bookmaker: market.BOOKMAKER_NAME,
          oddA: market.ODD_CELL_FIRST.VALUE,
          oddDraw: market.ODD_CELL_SECOND.VALUE,
          oddB: market.ODD_CELL_THIRD.VALUE,
        }));

        // Añadir el promedio de cuotas (avgodd)
        const avgOdds = bookmakers.reduce(
          (acc, curr) => {
            acc.oddA += curr.oddA;
            acc.oddDraw += curr.oddDraw;
            acc.oddB += curr.oddB;
            return acc;
          },
          { oddA: 0, oddDraw: 0, oddB: 0 }
        );

        const avgCount = bookmakers.length;
        bookmakers.push({
          bookmakerId: 0,
          bookmaker: "avgodd",
          oddA: Number((avgOdds.oddA / avgCount).toFixed(2)),
          oddDraw: Number((avgOdds.oddDraw / avgCount).toFixed(2)),
          oddB: Number((avgOdds.oddB / avgCount).toFixed(2)),
        });

        return bookmakers;
      }
    }

    console.log("No matching odds data found");
    return null;
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
