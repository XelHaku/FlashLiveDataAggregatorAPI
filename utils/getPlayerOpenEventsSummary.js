const ethers = require("ethers");
const ckey = require("ckey");

const contractABI = [
  {
    type: "function",
    name: "getPlayerEvents",
    inputs: [
      { name: "playerAddress", type: "address", internalType: "address" },
      { name: "sport", type: "uint8", internalType: "uint8" },
      { name: "active", type: "bool", internalType: "bool" },
      { name: "size", type: "uint256", internalType: "uint256" },
      { name: "pageNo", type: "uint256", internalType: "uint256" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        internalType: "struct AStructs.EventDTO[]",
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

async function getPlayerOpenEventsSummary(_player) {
  try {
    if (!ethers.isAddress(_player)) {
      throw new Error("Invalid player address");
    }

    const contractAddress = process.env.ARENATON_CONTRACT;
    if (!ethers.isAddress(contractAddress)) {
      throw new Error("Invalid contract address");
    }

    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const contract = new ethers.Contract(
      contractAddress,
      contractABI,
      provider
    );

    // Add proper parameter separation with commas
    const activeEvents = await contract.getPlayerEvents(
      _player,
      0, // sport parameter
      true, // active parameter
      500, // size parameter
      1 // pageNo parameter
    );

    if (!activeEvents || !Array.isArray(activeEvents)) {
      return {
        totalEvents: 0,
        activeSports: [],
        totalStaked: "0",
        eventsByStatus: { active: 0, closed: 0, paid: 0 },
        eventsBySport: {},
        stakedBySport: {},
        timeRanges: { next24h: 0, next48h: 0, next7d: 0 },
      };
    }

    const summary = initializeSummary();
    const now = Math.floor(Date.now() / 1000);

    for (const event of activeEvents) {
      try {
        processEvent(event, summary, now);
      } catch (eventError) {
        console.warn(`Error processing event: ${eventError.message}`);
        continue;
      }
    }

    return formatSummary(summary);
  } catch (error) {
    console.error("Failed to fetch event summary:", {
      message: error.message,
      code: error.code,
      details: error.data,
    });
    throw error;
  }
}

function initializeSummary() {
  return {
    totalEvents: 0,
    activeSports: new Set(),
    totalStaked: BigInt(0),
    totalStakedTeamA: BigInt(0),
    totalStakedTeamB: BigInt(0),
    eventsByStatus: { active: 0, closed: 0, paid: 0 },
    eventsBySport: {},
    stakedBySport: {},
    eventsByWinner: {
      teamA: 0,
      teamB: 0,
      noWinner: 0,
      tie: 0,
      canceled: 0,
    },
    timeRanges: { next24h: 0, next48h: 0, next7d: 0 },
  };
}

function processEvent(event, summary, now) {
  const sportId = Number(event[2]);
  const eventTotal = BigInt(event[5] || 0);

  summary.totalEvents++;
  summary.activeSports.add(sportId);
  summary.totalStaked += eventTotal;
  summary.totalStakedTeamA += BigInt(event[3] || 0);
  summary.totalStakedTeamB += BigInt(event[4] || 0);

  // Initialize sport stake tracking if needed
  summary.stakedBySport[sportId] =
    (summary.stakedBySport[sportId] || BigInt(0)) + eventTotal;
  summary.eventsBySport[sportId] = (summary.eventsBySport[sportId] || 0) + 1;

  processEventStatus(event, summary);
  processEventWinner(event, summary);
  processEventTiming(event, summary, now);
}

function processEventStatus(event, summary) {
  if (event[8]) summary.eventsByStatus.active++;
  if (event[9]) summary.eventsByStatus.closed++;
  if (event[10]) summary.eventsByStatus.paid++;
}

function processEventWinner(event, summary) {
  const winnerMap = {
    0: "teamA",
    1: "teamB",
    [-1]: "noWinner",
    [-2]: "tie",
    3: "canceled",
  };

  const winner = winnerMap[Number(event[6])];
  if (winner) {
    summary.eventsByWinner[winner]++;
  }
}

function processEventTiming(event, summary, now) {
  const startTime = Number(event[1]);
  if (startTime > now) {
    const hoursDiff = (startTime - now) / 3600;
    if (hoursDiff <= 24) summary.timeRanges.next24h++;
    if (hoursDiff <= 48) summary.timeRanges.next48h++;
    if (hoursDiff <= 168) summary.timeRanges.next7d++;
  }
}

function formatSummary(summary) {
  const stakedPctBySport = calculateStakedPercentages(summary);

  return {
    ...summary,
    totalStaked: summary.totalStaked.toString(),
    totalStakedTeamA: summary.totalStakedTeamA.toString(),
    totalStakedTeamB: summary.totalStakedTeamB.toString(),
    stakedBySport: Object.fromEntries(
      Object.entries(summary.stakedBySport).map(([sport, amount]) => [
        sport,
        amount.toString(),
      ])
    ),
    stakedPctBySport,
    activeSports: Array.from(summary.activeSports),
    averageStakePerEvent: calculateAverageStake(summary),
    participationRate: calculateParticipationRate(summary),
  };
}

function calculateStakedPercentages(summary) {
  const stakedPctBySport = {};
  for (const [sportId, amount] of Object.entries(summary.stakedBySport)) {
    const pct =
      summary.totalStaked === BigInt(0)
        ? 0
        : Number((BigInt(amount) * BigInt(10000)) / summary.totalStaked) / 100;
    stakedPctBySport[sportId] = pct.toFixed(2);
  }
  return stakedPctBySport;
}

function calculateAverageStake(summary) {
  return summary.totalEvents === 0
    ? "0"
    : (Number(summary.totalStaked) / summary.totalEvents).toFixed(2);
}

function calculateParticipationRate(summary) {
  return summary.totalEvents === 0
    ? "0%"
    : ((summary.eventsByStatus.active / summary.totalEvents) * 100).toFixed(2) +
        "%";
}

// Helper functions
function formatNumber(num) {
  return new Intl.NumberFormat().format(num);
}

function getHoursDifference(timestamp) {
  const now = Math.floor(Date.now() / 1000);
  return (Number(timestamp) - now) / 3600;
}

module.exports = {
  getPlayerOpenEventsSummary,
  formatNumber,
  getHoursDifference,
};

// function getPlayerEvents(
//   address playerAddress,
//   uint8 sport,
//   bool active,
//   uint256 size,
//   uint256 pageNo
// ) external view returns (AStructs.EventDTO[] memory) {
//   AStructs.Player storage player = players[playerAddress];

//   // Determine whether to retrieve active or closed events
//   bytes8[] storage eventList = active ? player.activeEvents : player.closedEvents;

//   uint256 totalEvents = eventList.length;

//   // Calculate start index based on pageNo and size
//   uint256 startIndex = (pageNo - 1) * size;

//   // Calculate the number of events to return based on available events
//   uint256 endIndex = startIndex + size;
//   if (endIndex > totalEvents) {
//     endIndex = totalEvents;
//   }

//   // Filter and retrieve events matching the sport condition
//   return _filterAndGetEvents(eventList, playerAddress, sport, startIndex, endIndex);
// }

// function _filterAndGetEvents(
//   bytes8[] storage eventList,
//   address playerAddress,
//   uint8 sport,
//   uint256 startIndex,
//   uint256 endIndex
// ) internal view returns (AStructs.EventDTO[] memory) {
//   // Initialize a temporary array to store filtered events
//   AStructs.EventDTO[] memory tempEvents = new AStructs.EventDTO[](endIndex - startIndex);
//   uint256 count = 0;

//   // Populate the tempEvents array with event details that match the sport filter
//   for (uint256 i = startIndex; i < endIndex; i++) {
//     AStructs.EventDTO memory eventDTO = _getEventDTO(eventList[i], playerAddress);
//     // Check if the event matches the specified sport or if sport < 0 (which means return all)
//     if (eventDTO.sport == sport || sport == 0) {
//       tempEvents[count] = eventDTO;
//       count++;
//     }
//   }

//   // Create a final array with the exact size needed to store the filtered events
//   AStructs.EventDTO[] memory finalEventsDTO = new AStructs.EventDTO[](count);
//   for (uint256 i = 0; i < count; i++) {
//     finalEventsDTO[i] = tempEvents[i];
//   }

//   return finalEventsDTO;
// }
