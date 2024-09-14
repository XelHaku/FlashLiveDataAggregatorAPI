const { ethers } = require("ethers");

const ARENATON_CONTRACT = process.env.ARENATON_CONTRACT;
const RPC_URL = process.env.RPC_URL;
const ETH_TO_USD = 2615; // Current ETH to USD conversion rate

// Define the contract ABI with the correct function signature
const contractABI = [
  {
    type: "function",
    name: "getEvent",
    inputs: [
      { name: "_eventId", type: "string", internalType: "string" },
      { name: "_player", type: "address", internalType: "address" },
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
              {
                name: "amount",
                type: "uint256",
                internalType: "uint256",
              },
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

const DEFAULT_PLAYER_ADDRESS = "0x0000000000000000000000220000000000000001";

/**
 * Fetches and processes the EventDTO for a given event ID and player address.
 */
async function getEventDTO(_eventId, _playerAddress = DEFAULT_PLAYER_ADDRESS) {
  try {
    const contractAddress = process.env.ARENATON_CONTRACT;
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const contract = new ethers.Contract(
      contractAddress,
      contractABI,
      provider
    );

    const _player = _playerAddress || DEFAULT_PLAYER_ADDRESS;

    console.log(`Fetching event ID: ${_eventId} for player: ${_player}`);

    // Fetch raw event data from the contract
    let eventRawDTO = await contract.getEvent(_eventId, _player);

    // If eventRawDTO is empty or invalid, return a default DTO
    if (!eventRawDTO || eventRawDTO.length === 0) {
      console.warn(
        `No matching event found for ID: ${_eventId}. Returning default DTO.`
      );
      return { eventDTO: createDefaultEventDTO(_eventId) }; // Return the default DTO in a structured way
    }

    // Map the raw event data to a structured DTO
    const eventDTO = mapEventDTO(eventRawDTO, _eventId);

    return { eventDTO }; // Return the structured event DTO
  } catch (error) {
    console.error(
      `Failed to fetch or process event DTO for ID ${_eventId}:`,
      error
    );

    // Return default DTO in case of error
    return { eventDTO: createDefaultEventDTO(_eventId) };
  }
}

/**
 * Creates a default or empty EventDTO object when no data is found.
 */
function createDefaultEventDTO(_eventId) {
  return {
    eventId: _eventId, // Keep the event ID as provided
    startDate: "0", // Default start date (can be 0 for non-existent event)
    sport: "0", // Default sport (non-existent or unknown)
    total_A: "0", // Default total A (no stakes)
    total_B: "0", // Default total B (no stakes)
    total: "0", // Default total (no total stakes)
    winner: "0", // Default winner (unknown)
    eventState: "0", // Default state (not started or unknown)
    playerStake: {
      // Default player stake
      amount: "0", // No stake amount
      team: "0", // No team chosen
    },
    open: false, // Event not open
    close: false, // Event not closed
    payout: false, // No payout
    oddsA: 0, // Default odds for team A
    oddsB: 0, // Default odds for team B
    totalAshort: "0", // Default shortened total for team A
    totalBshort: "0", // Default shortened total for team B
    expected: "0", // Default expected value
    ratio: "0.00%", // Default ratio
    totalStakeUsd: "$0.00 USD", // Default total stake in USD
    commissionInATON: "0 ATON", // Default commission in ATON
  };
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

  const totalStakeUsd = calculateTotalStakeInUsd(totalA, totalB);
  const commissionInATON = calculateCommissionInATON(totalA, totalB);

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
    totalStakeUsd,
    commissionInATON,
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
 * Calculates total stake in USD using the ETH to USD conversion rate.
 */
function calculateTotalStakeInUsd(totalA, totalB) {
  const totalStakeInEther = parseFloat(
    ethers.formatEther(BigInt(totalA + totalB))
  );
  return `$${(totalStakeInEther * ETH_TO_USD).toFixed(2)} USD`;
}

/**
 * Calculates the 2% commission in ATON for total stakes.
 */
function calculateCommissionInATON(totalA, totalB) {
  const totalStake = BigInt(totalA + totalB);
  const commission = (totalStake * BigInt(2)) / BigInt(100); // 2% commission
  return ethers.formatEther(commission) + " ATON";
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
    totalStakeUsd: "$0.00 USD",
    commissionInATON: "0 ATON",
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
