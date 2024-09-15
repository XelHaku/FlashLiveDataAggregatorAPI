const ethers = require("ethers");

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

async function getArenatonEvents(
  _sport,
  _step,
  _player = "0x0000000000000000000000000000000000000000",
  sort = "asc",
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

    let activeEvents;
    let sppp = _sport;
    if (_sport === "-1") {
      sppp = 0;
    }
    activeEvents = await contract.getEvents(sppp, _step, _player);

    if (!activeEvents || activeEvents.length === 0) {
      throw new Error("No events found");
    }

    console.log("Active events:", activeEvents);

    // Clone the immutable result array into a mutable structure
    const clonedEvents = activeEvents.map((event) => [...event]);

    // Sort by total (total_A + total_B) and then by startDate
    const sortedEvents = clonedEvents.sort((a, b) => {
      const totalA = BigInt(a[3] ?? 0) + BigInt(a[4] ?? 0); // total_A + total_B
      const totalB = BigInt(b[3] ?? 0) + BigInt(b[4] ?? 0); // total_A + total_B

      const totalComparison = totalA > totalB ? 1 : totalA < totalB ? -1 : 0;
      if (totalComparison !== 0) {
        return sort === "asc" ? totalComparison : -totalComparison;
      }

      // Compare by startDate (index 1)
      const dateA = BigInt(a[1] ?? 0);
      const dateB = BigInt(b[1] ?? 0);
      const dateComparison = dateA > dateB ? 1 : dateA < dateB ? -1 : 0;
      return sort === "asc" ? dateComparison : -dateComparison;
    });

    // Pagination logic
    const totalItems = sortedEvents.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (pageNo - 1) * pageSize;
    const paginatedEvents = sortedEvents.slice(
      startIndex,
      startIndex + pageSize
    );

    // Extract eventId (index 0) from paginated events
    const activeEventsIdList = paginatedEvents.map((event) => event[0]);

    console.log("Event IDs:", activeEventsIdList);

    return activeEventsIdList;
  } catch (error) {
    console.error("Failed to fetch active events:", {
      message: error.message,
      transaction: error.transaction,
      data: error.data,
    });
    return [];
  }
}

function translateWinner(winner) {
  switch (winner) {
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

function formatDate(date) {
  const timestamp = parseInt(date.toString());
  return new Date(timestamp * 1000).toLocaleString();
}

module.exports = {
  getArenatonEvents,
  translateWinner,
  formatDate,
};
