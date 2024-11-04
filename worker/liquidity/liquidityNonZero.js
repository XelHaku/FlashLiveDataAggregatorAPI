const ckey = require("ckey");
const { getArenatonEvents } = require("../../utils/getArenatonEvents");
const { updateEventFlash } = require("../../flashLive/updateEventFlash");
const { gasslessStake } = require("../../syndicate/gasslessStake");
async function liquidityNonZero() {
  try {
    const _playerLiquiditer = process.env.LIQUIDITER;
    const result = await getArenatonEvents(
      "-1",
      0,
      _playerLiquiditer,
      0,
      1,
      1000
    );
    console.log(result.events.length);
    const events = result.events || [];

    // Using for...of instead of forEach for async operations
    for (const event of events) {
      const total = Number(event.total || 0);
      const totalA = Number(event.total_A || 0);
      const totalB = Number(event.total_B || 0);
      const playerStake = Number(event.playerStake.amount || 0);
      console.log(playerStake);

      if (playerStake == 0)
        if (total === 0 || totalA === 0 || totalB === 0) {
          const eventFlash = await updateEventFlash(event.eventId);
          let forcastedTeam = "1";

          if (eventFlash.ODDS.length > 0) {
            // forcastedTeam = forcasterAI(eventFlash.ODDS)
          } else {
          }
          // async function gasslessStake(_eventId, _amountATONI, _team, _player) {

          await gasslessStake(
            eventFlash.EVENT_ID,
            playerStake,
            forcastedTeam,
            _playerLiquiditer
          );

          //STAKE

          console.log("Zero liquidity event:", eventFlash);
        }
    }
  } catch (error) {
    console.error("Error in liquidityNonZero function:", error);
  }
}

module.exports = { liquidityNonZero };
liquidityNonZero();
