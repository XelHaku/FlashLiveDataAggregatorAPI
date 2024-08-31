const { ethers } = require("ethers");

const ARENATON_CONTRACT = process.env.ARENATON_CONTRACT;
const RPC_URL = process.env.RPC_URL;

// Define the contract ABI with the correct function signature
const contractABI = [
  {
    type: "function",
    name: "getEventDTO",
    inputs: [
      { name: "_eventId", type: "string" },
      { name: "_player", type: "address" },
    ],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "eventId", type: "string" },
          { name: "startDate", type: "uint256" },
          { name: "sport", type: "uint8" },
          { name: "total_A", type: "uint256" },
          { name: "total_B", type: "uint256" },
          { name: "total", type: "uint256" },
          { name: "winner", type: "int8" },
          { name: "eventState", type: "uint8" },
          {
            name: "playerStake",
            type: "tuple",
            components: [
              { name: "amount", type: "uint256" },
              { name: "team", type: "uint8" },
            ],
          },
          { name: "active", type: "bool" },
          { name: "closed", type: "bool" },
          { name: "paid", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
];

const DEFAULT_PLAYER_ADDRESS = "0x0000000000000000000000220000000000000001";

/**
 * Fetches and processes the EventDTO for a given event ID and player address.
 */
async function getEventDTO(_eventId, _playerAddress = DEFAULT_PLAYER_ADDRESS) {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(
      ARENATON_CONTRACT,
      contractABI,
      provider
    );

    const playerAddress = _playerAddress || DEFAULT_PLAYER_ADDRESS;

    let eventRawDTO = await contract.getEventDTO(_eventId, playerAddress);

    const eventDTO = mapEventDTO(eventRawDTO, _eventId);

    return { eventDTO };
  } catch (error) {
    console.error("Failed to fetch or process event DTO:", error);
    throw error;
  }
}

/**
 * Converts raw event data into a more manageable format.
 */
function mapEventDTO(obj, _eventId) {
  const safeToString = (value) => value?.toString() ?? "0";
  const safeToNumber = (value) => parseInt(safeToString(value));

  const totalA = safeToNumber(obj[3]);
  const totalB = safeToNumber(obj[4]);

  const stakeAmount = parseFloat(ethers.formatEther(safeToString(obj[8]?.[0])));
  const expected = calculateExpected(
    safeToString(obj[8]?.[1]),
    obj[8]?.[0],
    totalA,
    totalB
  );
  const ratio =
    stakeAmount > 0
      ? ((parseFloat(expected) / stakeAmount) * 100).toFixed(2) + "%"
      : "0.00%";

  return {
    eventId: _eventId,
    startDate: safeToString(obj[1]),
    sport: safeToString(obj[2]),
    total_A: safeToString(obj[3]),
    total_B: safeToString(obj[4]),
    total: safeToString(obj[5]),
    winner: safeToString(obj[6]),
    eventState: safeToString(obj[7]),
    playerStake: {
      amount: safeToString(obj[8]?.[0]),
      team: safeToString(obj[8]?.[1]),
    },
    open: obj[9] ?? false,
    close: obj[10] ?? false,
    payout: obj[11] ?? false,
    oddsA: normalizeOdds(totalA, totalB),
    oddsB: normalizeOdds(totalB, totalA),
    totalAshort: formatShortTotal(safeToString(obj[3])),
    totalBshort: formatShortTotal(safeToString(obj[4])),
    expected,
    ratio,
  };
}

/**
 * Calculates the expected payout based on the player's stake and the total stakes.
 */
function calculateExpected(team, stakeAmount, totalA, totalB) {
  let expected = "0";

  const parsedStakeAmount = BigInt(stakeAmount.toString());
  const totalABigInt = BigInt(totalA);
  const totalBBigInt = BigInt(totalB);

  console.log("team", team.toString());
  console.log("stakeAmount", parsedStakeAmount.toString());
  console.log("totalA", totalA);
  console.log("totalB", totalB);

  if (team.toString() === "1" && totalABigInt > BigInt(0)) {
    expected = ethers.formatEther(
      (totalBBigInt * parsedStakeAmount) / totalABigInt + parsedStakeAmount
    );
  } else if (team.toString() === "2" && totalBBigInt > BigInt(0)) {
    expected = ethers.formatEther(
      (totalABigInt * parsedStakeAmount) / totalBBigInt + parsedStakeAmount
    );
  }

  return expected;
}

/**
 * Calculates odds based on total amounts.
 */
function normalizeOdds(totalA, totalB) {
  if (totalA === 0 && totalB === 0) return 0;

  const odds = (100 * totalA) / (totalA + totalB);
  return odds;
}

/**
 * Formats a large number into a shorter string representation.
 */
function formatShortTotal(value) {
  if (value === "0") return "0";

  try {
    const wei = BigInt(value);
    const ether = parseFloat(ethers.formatEther(wei));

    if (isNaN(ether)) return "0";

    if (ether < 0.000001) return ether.toExponential(0);
    if (ether < 0.001) return ether.toExponential(4);
    if (ether < 1000) return ether.toFixed(4);
    return ether.toFixed(0);
  } catch (error) {
    console.error("Error in formatShortTotal:", error);
    return "0";
  }
}

/**
 * Creates a default EventDTO object when no data is found.
 */
function createDefaultEventDTO(_eventId) {
  return {
    eventId: _eventId,
    startDate: "0",
    sport: "0",
    total_A: "0",
    total_B: "0",
    total: "0",
    winner: "0",
    eventState: "0",
    playerStake: { amount: "0", team: "0" },
    open: false,
    close: false,
    payout: false,
    oddsA: 0,
    oddsB: 0,
    totalAshort: "0",
    totalBshort: "0",
    expected: "0",
    ratio: "0.0%",
  };
}

module.exports = {
  getEventDTO,
  mapEventDTO,
  calculateExpected,
  normalizeOdds,
  formatShortTotal,
  createDefaultEventDTO,
};
