const ckey = require("ckey");
const { getArenatonEvents } = require("../../utils/getArenatonEvents");
const { updateEventFlash } = require("../../flashLive/updateEventFlash");
const { gasslessStake } = require("../../syndicate/gasslessStake");
const { playerSummary } = require("../../utils/playerSummary");

async function liquidityNonZero(_playerLiquiditer, _initTeam) {
  try {
    const _playerSummary = await playerSummary(_playerLiquiditer);

    // Convert atonBalance to BigInt (assuming 18 decimals)
    const DECIMALS = 18n;
    const SCALE = 10n ** DECIMALS;

    // Convert string balance to BigInt with proper decimal handling
    const atonBalanceBigInt = BigInt(
      Math.floor(parseFloat(_playerSummary.atonBalance) * Number(SCALE))
    );

    // Calculate 1% stake amount (divide by 100)
    const stakeAmountBigInt = atonBalanceBigInt / 500n;

    console.log("Original Balance:", _playerSummary.atonBalance);
    console.log("Balance as BigInt:", atonBalanceBigInt.toString());
    console.log("Stake amount as BigInt:", stakeAmountBigInt.toString());

    // Get events
    const result = await getArenatonEvents(
      "-1",
      0,
      _playerLiquiditer,
      0,
      1,
      1000
    );

    const events = result.events || [];

    // Using for...of instead of forEach for async operations
    for (const event of events) {
      // Convert all numeric values to BigInt
      const total = BigInt(event.total || 0);
      const totalA = BigInt(event.total_A || 0);
      const totalB = BigInt(event.total_B || 0);
      const playerStake = BigInt(event.playerStake.amount || 0);

      console.log("Player stake as BigInt:", playerStake.toString());

      if (playerStake === 0n) {
        // if (total === 0n || totalA === 0n || totalB === 0n) {
        const eventFlash = await updateEventFlash(event.eventId);
        // let forcastedTeam = "1";
        let forcastedTeam = _initTeam;

        if (eventFlash.ODDS && eventFlash.ODDS.length > 0) {
          // forcastedTeam = forcasterAI(eventFlash.ODDS)
        }

        // Convert stakeAmountBigInt to string for the gasslessStake function
        await gasslessStake(
          eventFlash.EVENT_ID,
          stakeAmountBigInt.toString(),
          forcastedTeam,
          _playerLiquiditer
        );

        console.log("Zero liquidity event:", {
          ...eventFlash,
          stakeAmount: stakeAmountBigInt.toString(),
        });
        // }
      }
    }
  } catch (error) {
    console.error("Error in liquidityNonZero function:", error);
  }
}

module.exports = { liquidityNonZero };
liquidityNonZero(process.env.LIQUIDITER2, "2");
liquidityNonZero(process.env.LIQUIDITER, "1");
