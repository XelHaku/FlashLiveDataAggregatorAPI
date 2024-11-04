const axios = require("axios");
const ck = require("ckey");

async function MatchOddsByEventId(eventId, retryAttempts = 1, delayMs = 1000) {
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
    timeout: 10000, // 10 second timeout
  };

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  for (let attempt = 1; attempt <= retryAttempts; attempt++) {
    try {
      const response = await axios.request(options);

      // Check if response data exists and has expected structure
      if (!response.data?.DATA) {
        throw new Error("Invalid response structure");
      }

      const homeAwayOdds = response.data.DATA.find(
        (item) => item.BETTING_TYPE === "*1X2"
      );

      if (!homeAwayOdds) {
        console.log(`No 1X2 odds found for event ${eventId}`);
        return null;
      }

      const matchOdds = homeAwayOdds.PERIODS.find(
        (period) => period.ODDS_STAGE === "*Full Time"
      );

      if (!matchOdds?.GROUPS?.[0]?.MARKETS) {
        console.log(`No full time odds found for event ${eventId}`);
        return null;
      }

      const bookmakers = matchOdds.GROUPS[0].MARKETS.map((market) => ({
        bookmakerId: market.BOOKMAKER_ID,
        bookmaker: market.BOOKMAKER_NAME,
        oddA: Number(market.ODD_CELL_FIRST.VALUE) || 0,
        oddDraw: Number(market.ODD_CELL_SECOND.VALUE) || 0,
        oddB: Number(market.ODD_CELL_THIRD.VALUE) || 0,
      }));

      if (bookmakers.length === 0) {
        console.log(`No bookmaker odds found for event ${eventId}`);
        return null;
      }

      // Calculate odds totals for normalization
      const totalOdds = bookmakers.reduce(
        (acc, curr) => ({
          oddA: acc.oddA + curr.oddA,
          oddB: acc.oddB + curr.oddB,
        }),
        { oddA: 0, oddB: 0 }
      );

      // Calculate percentages with minimum threshold
      const minPercentage = 0.1;
      let percentageA =
        (totalOdds.oddA / (totalOdds.oddA + totalOdds.oddB)) * 100;
      let percentageB =
        (totalOdds.oddB / (totalOdds.oddA + totalOdds.oddB)) * 100;

      // Adjust percentages if below minimum
      if (percentageA < minPercentage) {
        percentageA = minPercentage;
        percentageB = 100 - minPercentage;
      } else if (percentageB < minPercentage) {
        percentageB = minPercentage;
        percentageA = 100 - minPercentage;
      }

      // Calculate average odds
      const avgOdds = bookmakers.reduce(
        (acc, curr) => ({
          oddA: acc.oddA + curr.oddA,
          oddDraw: acc.oddDraw + curr.oddDraw,
          oddB: acc.oddB + curr.oddB,
        }),
        { oddA: 0, oddDraw: 0, oddB: 0 }
      );

      const avgCount = bookmakers.length;

      // Add average odds to bookmakers array
      bookmakers.push({
        bookmakerId: 0,
        bookmaker: "avgodd",
        oddA: Number((avgOdds.oddA / avgCount).toFixed(2)),
        oddDraw: Number((avgOdds.oddDraw / avgCount).toFixed(2)),
        oddB: Number((avgOdds.oddB / avgCount).toFixed(2)),
        percentageA: Number(percentageA.toFixed(2)),
        percentageB: Number(percentageB.toFixed(2)),
      });

      return bookmakers;
    } catch (error) {
      const isLastAttempt = attempt === retryAttempts;

      // Log error details
      console.error(
        `Attempt ${attempt}/${retryAttempts} failed for event ${eventId}:`,
        {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        }
      );

      if (error.response?.status === 521) {
        console.log("Web server is down (521), retrying...");
      }

      // If it's not the last attempt, wait before retrying
      if (!isLastAttempt) {
        await delay(delayMs * attempt); // Exponential backoff
        continue;
      }

      // On last attempt, return null
      return null;
    }
  }
}

module.exports = { MatchOddsByEventId };
