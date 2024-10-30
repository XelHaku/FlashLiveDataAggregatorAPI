const Player = require("../models/playerModel");
const { transferFrom } = require("../syndicate/transferFrom");
const {
  getArenatonEventsSummary,
} = require("../utils/getArenatonEventsSummary");
// async function getArenatonEventsSummary(_sport, _step, sort = "total") {

async function activeEventsSummary(sport) {
  const activeEventIds = await getArenatonEventsSummary(sport, 0, "total");
  try {
    console.log("Airdrop process completed.");
  } catch (error) {
    console.error("Error in activeEventsSummary function:", error);
  }
}

module.exports = { activeEventsSummary };

activeEventsSummary("-1");