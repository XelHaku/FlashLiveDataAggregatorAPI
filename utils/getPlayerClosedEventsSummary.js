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

async function getPlayerClosedEventsSummary(_player) {
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

    const activeEvents = await contract.getPlayerEvents(
      _player,
      0, // sport parameter
      false, // active parameter
      500, // size parameter
      1 // pageNo parameter
    );

    if (!activeEvents || !Array.isArray(activeEvents)) {
      return getEmptySummary();
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

function getEmptySummary() {
  return {
    totalEvents: 0,
    activeSports: [],
    totalStaked: "0",
    eventsByStatus: { active: 0, closed: 0, paid: 0 },
    eventsBySport: {},
    stakedBySport: {},
    timeRanges: { next24h: 0, next48h: 0, next7d: 0 },
    performance: {
      wins: 0,
      losses: 0,
      ties: 0,
      canceled: 0,
      winRate: { overall: "0%", bySport: {} },
      profitLoss: { total: "0", bySport: {}, profitabilityRate: "0%" },
    },
  };
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
    performance: {
      wins: 0,
      losses: 0,
      ties: 0,
      canceled: 0,
      totalProfit: BigInt(0),
      profitBySport: {},
      winsBySport: {},
      lossesBySport: {},
    },
  };
}

function processEvent(event, summary, now) {
  const sportId = Number(event[2]);
  const eventTotal = BigInt(event[5] || 0);
  const playerStake = event[7];
  const stakeAmount = BigInt(playerStake.amount || 0);
  const playerTeam = Number(playerStake.team);
  const winner = Number(event[6]);
  const totalTeamA = BigInt(event[3] || 0);
  const totalTeamB = BigInt(event[4] || 0);

  summary.totalEvents++;
  summary.activeSports.add(sportId);
  summary.totalStaked += stakeAmount;
  summary.totalStakedTeamA += playerTeam === 0 ? stakeAmount : BigInt(0);
  summary.totalStakedTeamB += playerTeam === 1 ? stakeAmount : BigInt(0);

  // Initialize tracking for sport if needed
  summary.stakedBySport[sportId] =
    (summary.stakedBySport[sportId] || BigInt(0)) + stakeAmount;
  summary.eventsBySport[sportId] = (summary.eventsBySport[sportId] || 0) + 1;
  summary.performance.profitBySport[sportId] =
    summary.performance.profitBySport[sportId] || BigInt(0);
  summary.performance.winsBySport[sportId] =
    summary.performance.winsBySport[sportId] || 0;
  summary.performance.lossesBySport[sportId] =
    summary.performance.lossesBySport[sportId] || 0;

  if (event[9]) {
    // If event is closed
    calculateEventPerformance(event, summary, sportId, {
      playerTeam,
      stakeAmount,
      winner,
      totalTeamA,
      totalTeamB,
      eventTotal,
    });
  }

  processEventStatus(event, summary);
  processEventWinner(event, summary);
  processEventTiming(event, summary, now);
}

function calculateEventPerformance(event, summary, sportId, params) {
  const {
    playerTeam,
    stakeAmount,
    winner,
    totalTeamA,
    totalTeamB,
    eventTotal,
  } = params;

  if (!event[9] || stakeAmount === BigInt(0)) return;

  let profit = BigInt(0);

  if (winner === playerTeam) {
    summary.performance.wins++;
    summary.performance.winsBySport[sportId]++;
    const winningPool = playerTeam === 0 ? totalTeamA : totalTeamB;
    const payoutRatio =
      eventTotal === BigInt(0)
        ? BigInt(0)
        : (eventTotal * BigInt(1000000)) / winningPool;
    profit = (stakeAmount * payoutRatio) / BigInt(1000000) - stakeAmount;
  } else if (winner === -2) {
    summary.performance.ties++;
    profit = BigInt(0);
  } else if (winner === 3) {
    summary.performance.canceled++;
    profit = BigInt(0);
  } else if (
    winner === -1 ||
    ((winner === 0 || winner === 1) && winner !== playerTeam)
  ) {
    summary.performance.losses++;
    summary.performance.lossesBySport[sportId]++;
    profit = -stakeAmount;
  }

  summary.performance.totalProfit += profit;
  summary.performance.profitBySport[sportId] += profit;
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
  const winRate = calculateWinRate(summary);
  const profitLoss = formatProfitLoss(summary);

  return {
    totalEvents: summary.totalEvents,
    activeSports: Array.from(summary.activeSports),
    totalStaked: summary.totalStaked.toString(),
    totalStakedTeamA: summary.totalStakedTeamA.toString(),
    totalStakedTeamB: summary.totalStakedTeamB.toString(),
    eventsByStatus: summary.eventsByStatus,
    eventsBySport: summary.eventsBySport,
    eventsByWinner: summary.eventsByWinner,
    stakedBySport: Object.fromEntries(
      Object.entries(summary.stakedBySport).map(([sport, amount]) => [
        sport,
        amount.toString(),
      ])
    ),
    stakedPctBySport,
    timeRanges: summary.timeRanges,
    averageStakePerEvent: calculateAverageStake(summary),
    participationRate: calculateParticipationRate(summary),
    performance: {
      wins: summary.performance.wins,
      losses: summary.performance.losses,
      ties: summary.performance.ties,
      canceled: summary.performance.canceled,
      winRate,
      profitLoss,
    },
  };
}

function calculateWinRate(summary) {
  const winRateBySport = {};

  for (const sportId of summary.activeSports) {
    const wins = summary.performance.winsBySport[sportId] || 0;
    const losses = summary.performance.lossesBySport[sportId] || 0;
    const totalSportEvents = wins + losses;
    winRateBySport[sportId] =
      totalSportEvents === 0
        ? "0.00%"
        : ((wins / totalSportEvents) * 100).toFixed(2) + "%";
  }

  const totalCompleted = summary.performance.wins + summary.performance.losses;
  const overallWinRate =
    totalCompleted === 0
      ? "0.00%"
      : ((summary.performance.wins / totalCompleted) * 100).toFixed(2) + "%";

  return {
    overall: overallWinRate,
    bySport: winRateBySport,
  };
}

function formatProfitLoss(summary) {
  return {
    total: summary.performance.totalProfit.toString(),
    bySport: Object.fromEntries(
      Object.entries(summary.performance.profitBySport).map(
        ([sport, amount]) => [sport, amount.toString()]
      )
    ),
    profitabilityRate:
      summary.totalStaked === BigInt(0)
        ? "0.00%"
        : (
            (Number(summary.performance.totalProfit) /
              Number(summary.totalStaked)) *
            100
          ).toFixed(2) + "%",
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

function formatNumber(num) {
  return new Intl.NumberFormat().format(num);
}

function getHoursDifference(timestamp) {
  const now = Math.floor(Date.now() / 1000);
  return (Number(timestamp) - now) / 3600;
}

module.exports = {
  getPlayerClosedEventsSummary,
  formatNumber,
  getHoursDifference,
};
