const ethers = require("ethers");
const ckey = require("ckey");

const contractABI = [
  {
    type: "function",
    name: "getEvents",
    inputs: [
      { name: "_sport", type: "uint8", internalType: "uint8" },
      {
        name: "_step",
        type: "uint8",
        internalType: "enum AStructs.Step",
      },
      { name: "_player", type: "address", internalType: "address" },
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

async function getArenatonEventsSummary(_sport, _step) {
  try {
    const _player = "0x0000000000000000000000220000000000000001";
    const pageSize = 1200;

    const contractAddress = process.env.ARENATON_CONTRACT;
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const contract = new ethers.Contract(
      contractAddress,
      contractABI,
      provider
    );

    let sportValue = _sport === "-1" ? 0 : _sport;

    // Fetch events from the contract
    const activeEvents = await contract.getEvents(sportValue, _step, _player);

    if (!activeEvents || activeEvents.length === 0) {
      throw new Error("No events found");
    }

    // Process events and calculate summary
    const summary = {
      totalEvents: activeEvents.length,
      activeSports: new Set(),
      totalStaked: BigInt(0),
      totalStakedTeamA: BigInt(0),
      totalStakedTeamB: BigInt(0),
      eventsByStatus: {
        active: 0,
        closed: 0,
        paid: 0,
      },
      eventsBySport: {},
      stakedBySport: {}, // New object to track stakes per sport
      eventsByWinner: {
        teamA: 0,
        teamB: 0,
        noWinner: 0,
        tie: 0,
        canceled: 0,
      },
      timeRanges: {
        next24h: 0,
        next48h: 0,
        next7d: 0,
      },
    };

    const now = Math.floor(Date.now() / 1000);

    for (const event of activeEvents) {
      const sportId = Number(event[2]);
      const eventTotal = BigInt(event[5] || 0);

      // Track unique sports
      summary.activeSports.add(sportId);

      // Accumulate totals
      summary.totalStaked += eventTotal;
      summary.totalStakedTeamA += BigInt(event[3] || 0);
      summary.totalStakedTeamB += BigInt(event[4] || 0);

      // Accumulate stakes by sport
      if (!summary.stakedBySport[sportId]) {
        summary.stakedBySport[sportId] = BigInt(0);
      }
      summary.stakedBySport[sportId] += eventTotal;

      // Count events by status
      if (event[8]) summary.eventsByStatus.active++;
      if (event[9]) summary.eventsByStatus.closed++;
      if (event[10]) summary.eventsByStatus.paid++;

      // Count events by sport
      summary.eventsBySport[sportId] =
        (summary.eventsBySport[sportId] || 0) + 1;

      // Count events by winner
      switch (Number(event[6])) {
        case 0:
          summary.eventsByWinner.teamA++;
          break;
        case 1:
          summary.eventsByWinner.teamB++;
          break;
        case -1:
          summary.eventsByWinner.noWinner++;
          break;
        case -2:
          summary.eventsByWinner.tie++;
          break;
        case 3:
          summary.eventsByWinner.canceled++;
          break;
      }

      // Count upcoming events within time ranges
      const startTime = Number(event[1]);
      if (startTime > now) {
        const hoursDiff = (startTime - now) / 3600;
        if (hoursDiff <= 24) summary.timeRanges.next24h++;
        if (hoursDiff <= 48) summary.timeRanges.next48h++;
        if (hoursDiff <= 168) summary.timeRanges.next7d++; // 7 days
      }
    }

    const stakedPctBySport = {};
    for (const [sportId, amount] of Object.entries(summary.stakedBySport)) {
      // Convert BigInt to number with proper precision for percentage calculation
      const pct =
        summary.totalStaked === BigInt(0)
          ? 0
          : Number((BigInt(amount) * BigInt(10000)) / summary.totalStaked) /
            100;
      stakedPctBySport[sportId] = pct.toFixed(2);
    }

    // Convert BigInts to strings for JSON serialization
    const formattedSummary = {
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
      stakedPctBySport, // Add the percentage data
      activeSports: Array.from(summary.activeSports),
      averageStakePerEvent: (
        Number(summary.totalStaked) / summary.totalEvents
      ).toFixed(2),
      participationRate:
        ((summary.eventsByStatus.active / summary.totalEvents) * 100).toFixed(
          2
        ) + "%",
    };

    console.log("Events Summary:", formattedSummary);
    return formattedSummary;
  } catch (error) {
    console.error("Failed to fetch event summary:", {
      message: error.message,
      transaction: error.transaction,
      data: error.data,
    });
    throw error;
  }
}

// Helper to format large numbers with commas
function formatNumber(num) {
  return new Intl.NumberFormat().format(num);
}

// Helper to calculate time difference in hours
function getHoursDifference(timestamp) {
  const now = Math.floor(Date.now() / 1000);
  return (Number(timestamp) - now) / 3600;
}

module.exports = {
  getArenatonEventsSummary,
  formatNumber,
  getHoursDifference,
};


