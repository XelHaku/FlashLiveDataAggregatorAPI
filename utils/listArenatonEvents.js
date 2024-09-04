const ethers = require("ethers");

const contractABI = [
  {
    type: "function",
    name: "listArenatonEvents",
    inputs: [
      { name: "_sport", type: "int8", internalType: "int8" },
      { name: "_step", type: "uint8", internalType: "enum AStructs.Step" },
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
          { name: "eventState", type: "uint8", internalType: "uint8" },
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

async function listArenatonEvents(
  _sport,
  _step,
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

    const activeEvents = await contract.listArenatonEvents(_sport, _step);
    console.log("Active Events:", activeEvents);

    // Create a shallow copy of the array before sorting
    const sortedEvents = [...activeEvents];

    // Sort by total (event[5]) and then by startDate (event[1])
    sortedEvents.sort((a, b) => {
      const totalComparison = a[5] > b[5] ? 1 : a[5] < b[5] ? -1 : 0; // Compare the totals (event[5])
      if (totalComparison !== 0) {
        return sort === "asc" ? totalComparison : -totalComparison;
      }

      // If totals are equal, sort by startDate (event[1])
      const dateComparison = a[1] > b[1] ? 1 : a[1] < b[1] ? -1 : 0;
      return sort === "asc" ? dateComparison : -dateComparison;
    });

    // Calculate pagination
    const totalItems = sortedEvents.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (pageNo - 1) * pageSize;
    const paginatedEvents = sortedEvents.slice(
      startIndex,
      startIndex + pageSize
    );

    // Map through the paginated events to extract the eventId
    const activeEventsIdList = paginatedEvents.map((event) => event[0]);

    // Convert to array if not already
    const idArray = Array.isArray(activeEventsIdList)
      ? activeEventsIdList
      : [activeEventsIdList];

    console.log("Event IDs:", idArray);

    return idArray;
  } catch (error) {
    console.error("Failed to fetch active events:", error.message);
    throw error;
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
  let timestamp;
  if (true) {
    // Convert BigInt to number using the unary plus operator or Number() function
    timestamp = parseInt(date.toString()); // or Number(date)
  }

  return new Date(timestamp * 1000).toLocaleString();
}

module.exports = {
  listArenatonEvents,
};
