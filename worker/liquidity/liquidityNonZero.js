const ckey = require("ckey");
const { getArenatonEvents } = require("../../utils/getArenatonEvents");
const { updateEventFlash } = require("../../flashLive/updateEventFlash");
const { gasslessStake } = require("../../syndicate/gasslessStake");
const { playerSummary } = require("../../utils/playerSummary");

// Separate balance calculation logic
async function calculateStakeAmount(playerAddress) {
  const _playerSummary = await playerSummary(playerAddress);

  const DECIMALS = 18n;
  const SCALE = 10n ** DECIMALS;
  const STAKE_PERCENTAGE = 100n; // 0.2% (1/500)

  // Convert string balance to BigInt with proper decimal handling
  const atonBalanceBigInt = BigInt(
    Math.floor(parseFloat(_playerSummary.atonBalance) * Number(SCALE))
  );

  // Calculate stake amount
  const stakeAmountBigInt = atonBalanceBigInt / STAKE_PERCENTAGE;

  return {
    originalBalance: _playerSummary.atonBalance,
    balanceBigInt: atonBalanceBigInt,
    stakeAmountBigInt: stakeAmountBigInt,
  };
}

// Process single event
async function processEvent(event, stakeAmount, playerAddress, initTeam) {
  const playerStake = BigInt(event.playerStake.amount || 0);

  if (playerStake === 0n) {
    const eventFlash = await updateEventFlash(event.eventId);
    const forcastedTeam = initTeam; // Could be expanded with forcasterAI logic

    await gasslessStake(
      eventFlash.EVENT_ID,
      stakeAmount.toString(),
      forcastedTeam,
      playerAddress
    );

    console.log("Zero liquidity event processed:", {
      eventId: eventFlash.EVENT_ID,
      stakeAmount: stakeAmount.toString(),
      team: forcastedTeam,
    });
  }
}

async function liquidityNonZero(playerAddress, initTeam) {
  try {
    // Calculate stake amount first
    const balanceInfo = await calculateStakeAmount(playerAddress);

    console.log("Balance Information:", {
      originalBalance: balanceInfo.originalBalance,
      balanceAsBigInt: balanceInfo.balanceBigInt.toString(),
      stakeAmount: balanceInfo.stakeAmountBigInt.toString(),
    });

    // Get events
    const result = await getArenatonEvents("-1", 0, playerAddress, 0, 1, 1000);

    const events = result.events || [];

    // Process events with calculated stake amount
    for (const event of events) {
      await processEvent(
        event,
        balanceInfo.stakeAmountBigInt,
        playerAddress,
        initTeam
      );
    }
  } catch (error) {
    console.error("Error in liquidityNonZero function:", error);
    throw error; // Re-throw to allow handling by caller
  }
}

// Export the functions
module.exports = {
  liquidityNonZero,
  calculateStakeAmount, // Exported for testing purposes
  processEvent, // Exported for testing purposes
};

// Execute if running directly
if (require.main === module) {
  Promise.all([
    liquidityNonZero(process.env.LIQUIDITER2, "2"),
    liquidityNonZero(process.env.LIQUIDITER, "1"),
    liquidityNonZero("0xBc8eC38D988E775b21c2C484d205F6bc9731Ea7E", "2"),
  ]).catch((error) => {
    console.error("Error in main execution:", error);
    process.exit(1);
  });
}
