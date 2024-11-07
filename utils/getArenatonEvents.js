const ethers = require("ethers");

const contractABI = [
  {
    type: "function",
    name: "getEvents",
    inputs: [
      { name: "_sport", type: "uint8", internalType: "uint8" },
      { name: "_step", type: "uint8", internalType: "enum AStructs.Step" },
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

// Helper function to map array response to object with named properties
function mapEventData(event) {
  return {
    eventId: event[0],
    startDate: event[1],
    sport: event[2],
    total_A: event[3],
    total_B: event[4],
    total: event[5],
    winner: event[6],
    playerStake: {
      amount: event[7][0],
      team: event[7][1],
    },
    active: event[8],
    closed: event[9],
    paid: event[10],
  };
}

// Helper function to translate the winner field into human-readable text
function translateWinner(winner) {
  switch (Number(winner)) {
    case 0:
      return "Team A";
    case 1:
      return "Team B";
    case -1:
      return "No Winner";
    case -2:
      return "Tie";
    case 3:
      return "Event Canceled";
    default:
      return "Unknown";
  }
}

// Helper function to format a timestamp into a readable date string
function formatDate(date) {
  const timestamp = Number(date.toString());
  return new Date(timestamp * 1000).toLocaleString();
}

async function getArenatonEvents(
  _sport,
  _step,
  _player = "0x0000000000000000000000000000000000000000",
  sort = "total",
  pageNo = 1,
  pageSize = 12
) {
  try {
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

    // Map and clone events for manipulation
    const mappedEvents = activeEvents.map(mapEventData);

    // Sort events by total
    const sortedEvents = mappedEvents.sort((a, b) => {
      const totalA = Number(a.total ?? 0);
      const totalB = Number(b.total ?? 0);
      return totalB - totalA; // Sort by descending total
    });

    // Pagination logic
    const totalItems = sortedEvents.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (pageNo - 1) * pageSize;
    const paginatedEvents = sortedEvents.slice(
      startIndex,
      startIndex + pageSize
    );

    // Extract eventIds from paginated events
    const activeEventsIdList = paginatedEvents.map((event) => event.eventId);

    console.log("getArenatonPlayerEvents Event IDs:", activeEventsIdList);

    return {
      events: paginatedEvents,
      eventIdList: activeEventsIdList,
      pagination: {
        totalItems,
        totalPages,
        currentPage: pageNo,
        pageSize,
      },
    };
  } catch (error) {
    console.error("Failed to fetch player events:", {
      message: error.message,
      transaction: error.transaction,
      data: error.data,
    });
    return {
      events: [],
      eventIds: [],
      pagination: {
        totalItems: 0,
        totalPages: 0,
        currentPage: pageNo,
        pageSize,
      },
    };
  }
}

module.exports = {
  getArenatonEvents,
  translateWinner,
  formatDate,
  mapEventData,
};
