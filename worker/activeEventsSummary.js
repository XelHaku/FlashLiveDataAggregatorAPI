const Player = require("../models/playerModel");
const { transferFrom } = require("../syndicate/transferFrom");
const { getArenatonEvents } = require("../utils/getArenatonEvents");

async function activeEventsSummary() {
  const activeEventIds = await getArenatonEvents(
    sport,
    0,
    playerAddress,
    "total",
    page,
    size
  );
     try {
       console.log("Airdrop process completed.");
     } catch (error) {
       console.error("Error in activeEventsSummary function:", error);
     }
}

module.exports = { activeEventsSummary };
