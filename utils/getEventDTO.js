const { ethers } = require("ethers");

// RPC URL and contract address from environment variables
const RPC_URL = process.env.RPC_URL;
const ARENATON_CONTRACT = process.env.ARENATON_CONTRACT;
const ETH_TO_USD = 2300; // Current ETH to USD conversion rate

// ABI for the contract function 'getEventDTO'
const contractABI = [
  {
    type: "function",
    name: "getEventDTO",
    inputs: [
      { name: "_player", type: "address", internalType: "address" },
      { name: "_eventId", type: "string", internalType: "string" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct AStructs.EventDTO",
        components: [
          { name: "eventId", type: "string", internalType: "string" },
          { name: "startDate", type: "uint256", internalType: "uint256" },
          { name: "sport", type: "uint8", internalType: "uint8" },
          { name: "total_A", type: "uint256", internalType: "uint256" },
          { name: "total_B", type: "uint256", internalType: "uint256" },
          { name: "total", type: "uint256", internalType: "uint256" },
          { name: "winner", type: "int8", internalType: "int8" },
          {
            name: "playerStake",
            type: "tuple",
            internalType: "struct AStructs.Stake",
            components: [
              { name: "amount", type: "uint256", internalType: "uint256" },
              { name: "team", type: "uint8", internalType: "uint8" },
            ],
          },
          { name: "active", type: "bool", internalType: "bool" },
          { name: "closed", type: "bool", internalType: "bool" },
          { name: "paid", type: "bool", internalType: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
];

// Initialize provider and contract using ethers.js
const provider = new ethers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(ARENATON_CONTRACT, contractABI, provider);

// Function to fetch event data from the contract
async function getEventDTO(
  _eventId,
  _playerAddress = "0x0000000000000000000000220000000000000001"
) {
  try {
    // Call the contract function 'getEvent'
    const eventRawDTO = await contract.getEventDTO(_playerAddress, _eventId);
    console.log("Raw event data:", eventRawDTO);

    // Map the raw data into a structured DTO
    const eventDTO = mapEventDTO(eventRawDTO, _eventId);
    return { eventDTO };
  } catch (error) {
    console.error(`Failed to fetch or process event DTO: ${error.message}`);
    return null;
  }
}
// Helper function to map the raw event data to a structured DTO
function mapEventDTO(eventRawDTO, _eventId, ETH_TO_USD) {
  const team = eventRawDTO.playerStake.team.toString();
  const totalA = parseFloat(ethers.formatEther(eventRawDTO.total_A));
  const totalB = parseFloat(ethers.formatEther(eventRawDTO.total_B));
  const playerStakeAmount = parseFloat(
    ethers.formatEther(eventRawDTO.playerStake.amount)
  );

  let expected = 0;
  if (team === "1") {
    // Calculate expected payout with a 2% fee deduction if totalA > 0
    expected =
      totalA > 0
        ? (totalB * playerStakeAmount) / totalA +
          playerStakeAmount -
          ((totalB * playerStakeAmount) / totalA) * 0.02
        : playerStakeAmount;
  } else if (team === "2") {
    expected =
      totalB > 0
        ? (totalA * playerStakeAmount) / totalB +
          playerStakeAmount -
          ((totalA * playerStakeAmount) / totalB) * 0.02
        : playerStakeAmount;
  }
  // Ensure expected is a valid number, defaulting to 0 if NaN
  expected = Number.isNaN(expected) ? 0 : expected;

  // Calculate the payout ratio (as percentage) based on player's stake and expected payout
  const ratio =
    playerStakeAmount > 0
      ? (expected / playerStakeAmount).toFixed(2) // Sports odds in decimal form
      : "1.00"; // Default odds if no stake

  // Shorten large total amounts for display (e.g., 1,000,000 => 1M)
  const totalAshort = formatShortTotal(totalA);
  const totalBshort = formatShortTotal(totalB);

  return {
    eventId: _eventId,
    startDate: eventRawDTO.startDate.toString(),
    sport: eventRawDTO.sport.toString(),
    total_A: ethers.formatEther(eventRawDTO.total_A),
    total_B: ethers.formatEther(eventRawDTO.total_B),
    total: ethers.formatEther(eventRawDTO.total),
    totalStakeUsd: `$${(
      ethers.formatEther(eventRawDTO.total) * ETH_TO_USD
    ).toFixed(2)} USD~`,
    winner: eventRawDTO.winner.toString(),
    playerStake: {
      amount: ethers.formatEther(eventRawDTO.playerStake.amount),
      team: eventRawDTO.playerStake.team.toString(),
    },
    open: eventRawDTO.active,
    close: eventRawDTO.closed,
    payout: eventRawDTO.paid,
    totalAshort,
    totalBshort,
    stake: playerStakeAmount.toFixed(9), // Round player stake to 9 decimals
    expected: expected.toFixed(9), // Round expected payout to 6 decimals
    ratio,
    oddsA: oddsPivot(totalA, totalB), // Calculate odds for team A
    oddsB: oddsPivot(totalB, totalA), // Calculate odds for team B
  };
}

/**
 * Shorten large numbers for display purposes (e.g., 1,000,000 -> 1M).
 */
function formatShortTotal(total) {
  if (total >= 1e6) return (total / 1e6).toFixed(1) + "M";
  if (total >= 1e3) return (total / 1e3).toFixed(1) + "K";
  return total.toFixed(2);
}

/**
 * Calculate odds for a team based on total stakes.
 * Avoid division by zero by returning 1 as the default odds if totalB is zero.
 */
function oddsPivot(totalA, totalB) {
  return totalB > 0 ? (totalA / totalB).toFixed(2) : "1.00";
}


// Function to calculate odds based on totalA and totalB
function oddsPivot(totalA, totalB) {
  const total = totalA + totalB;
  if (total === 0) {
    return "0.00";
  }
  const odds = totalA / total;
  return odds.toFixed(2);
}

// Function to format large totals into a shortened format (ETH or ATON)
function formatShortTotal(total) {
  const value = parseFloat(total);
  if (value < 1e-6) {
    return `${value.toExponential(2)}`;
  } else if (value < 1e-3) {
    return `${value.toExponential(4)}`;
  } else {
    return `${value.toFixed(6)} ETH`;
  }
}

// Default event DTO in case of errors or missing data
function createDefaultEventDTO(_eventId) {
  return {
    eventId: _eventId,
    startDate: "0",
    sport: "0",
    total_A: "0",
    total_B: "0",
    total: "0",
    winner: "0",
    playerStake: { amount: "0", team: "0" },
    open: false,
    close: false,
    payout: false,
    totalAshort: "0",
    totalBshort: "0",
    stake: "0",
    expected: "0",
    ratio: "0.0%",
    totalStakeUsd: "$0.00 USD~",
    commissionInATON: "0 ATON",
    oddsA: "0",
    oddsB: "0",
  };
}

module.exports = {
  getEventDTO,
};
