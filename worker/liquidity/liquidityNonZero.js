// PURPOSE TO AVOID Events with zero liquidity
const { getArenatonEvents } = require("../../utils/getArenatonEvents");
async function liquidityNonZero() {
  try {

    const player = 
    const _getArenatonEvents = await getArenatonEvents(
      "-1",
      0,
      _player,
      0,
      1,
      1000
    );
    console.log("_getArenatonEvents", _getArenatonEvents);
  } catch (error) {
    console.error("Error in liquidityNonZero function:", error);
  }
}

module.exports = { liquidityNonZero };
liquidityNonZero();
