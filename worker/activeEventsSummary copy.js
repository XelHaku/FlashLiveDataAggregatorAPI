const Player = require("../models/playerModel");
const { transferFrom } = require("../syndicate/transferFrom");
const {
  getArenatonEventsSummary,
} = require("../utils/getArenatonEventsSummary");
// async function getArenatonEventsSummary(_sport, _step, sort = "total") {

async function activeEventsSummary(sport) {
  try {
    const EventsSummary = await getArenatonEventsSummary(sport, 2);
    console.log("EventsSummary.");
    return EventsSummary;
  } catch (error) {
    console.error("Error in activeEventsSummary function:", error);
  }
}

module.exports = { activeEventsSummary };

// activeEventsSummary("-1");