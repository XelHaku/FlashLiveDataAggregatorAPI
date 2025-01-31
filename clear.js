const { getArenatonEvents } = require("./utils/getArenatonEvents");
const ck = require("ckey");
const players = require("./utils/players");
const { terminateEvent } = require("./syndicate/terminateEvent");
const { addEvent } = require("./syndicate/addEvent");
const { playerSummary } = require("./utils/playerSummary");
const { gasslessStake } = require("./syndicate/gasslessStake");
const ethers = require("ethers");

// Sleep function to pause execution for a given number of milliseconds
function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function main() {
  const startDateAAA = 1738425600;

  console.log("players", players.players);

//   // Iterate over players and fetch their summaries
//   for (const player of players.players) {
//     try {
//       const sum = await playerSummary(player);
//       const balance = sum.atonBalance;


//       // Ensure balance is converted to a string before passing to ethers
// const balanceInWei = ethers.parseUnits(balance.toString());
//       const res = await gasslessStake("AAAAAAAA", balanceInWei, 2, player);
//       console.log("sum", balanceInWei);

//       console.log("Stake result:", res);

//       // Sleep for 200ms between each player summary
//       await sleep(200);
//     } catch (error) {
//       console.log("Error processing player:", player, error);
//     }
//   }


//    const sum = await playerSummary("0x35BB6B2757C004A1662e83FdA9a034f4aFbBEdb3");
//       const balance = sum.atonBalance;


//       // Ensure balance is converted to a string before passing to ethers
// const balanceInWei = ethers.parseUnits(balance.toString());
//       const res = await gasslessStake("AAAAAAAA", balanceInWei, 2, "0x35BB6B2757C004A1662e83FdA9a034f4aFbBEdb3");
//       console.log("sum", balanceInWei);

//       console.log("Stake result:", res);

//       // Sleep for 200ms between each player summary
//       await sleep(200);

await terminateEvent("AAAAAAAA", 1);
}

// Call the function
main();