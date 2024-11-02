const Player = require("../models/playerModel");
const { transferFrom } = require("../syndicate/transferFrom");
const {
  getPlayerOpenEventsSummary,
} = require("../utils/getPlayerOpenEventsSummary");
const {
  getPlayerClosedEventsSummary,
} = require("../utils/getPlayerClosedEventsSummary");
// async function getPlayerOpenEventsSummary(_player, _step, sort = "total") {

async function playerEventSummary(player) {
  try {
    const open = await getPlayerOpenEventsSummary(player);
    const closed = await getPlayerClosedEventsSummary(player);
    return { open, closed };
  } catch (error) {
    console.error("Error in playerEventSummary function:", error);
  }
}

module.exports = { playerEventSummary };
