const Player = require("../models/playerModel");
const { transferFrom } = require("../syndicate/transferFrom");

async function airdropX() {
  try {
    // Fetch eligible players from the database
    const players = await Player.find({
      typeOfLogin: { $in: ["twitter", "google"] },
      airdropClaimed: false,
    });

    // Debugging: Set all players with typeOfLogin: "twitter" to airdropClaimed: true
    // Uncomment the following lines if you want to set all players as claimed for testing

    // await Player.updateMany(
    //   { typeOfLogin: "twitter" },
    //   { airdropClaimed: false }
    // );
    // console.log(
    //   "All players with typeOfLogin 'twitter' have been marked as unclaimed."
    // );
    // return; // Exit early for debugging

    console.log(`Found ${players.length} eligible players for airdrop.`);

    const airdropAmount = "10"; // Amount of tokens to airdrop, adjust as needed

    for (const player of players) {
      try {
        // Perform the transfer
        const transferSuccess = await transferFrom(
          player.playerAddress,
          airdropAmount
        );

        if (transferSuccess) {
          // Check if the transfer was successful
          // Update player's airdrop status in the database
          await Player.updateOne({ _id: player._id }, { airdropClaimed: true });
          console.log(`Airdrop successful for player: ${player.playerAddress}`);
        } else {
          console.error(`Airdrop failed for player: ${player.playerAddress}`);
        }
      } catch (transferError) {
        console.error(
          `Error during airdrop for player ${player.playerAddress}:`,
          transferError
        );
      }
    }

    console.log("Airdrop process completed.");
  } catch (error) {
    console.error("Error in airdropX function:", error);
  }
}

module.exports = { airdropX };

// Execute if running directly
if (require.main === module) {
  Promise.all([airdropX()]).catch((error) => {
    console.error("Error in main execution:", error);
    process.exit(1);
  });
}
