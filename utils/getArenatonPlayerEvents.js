const ethers = require("ethers");

// ABI for the 'getPlayerEvents' function
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

// Function to fetch player events from the contract
async function getArenatonPlayerEvents(
  _playerAddress,
  _sport,
  _active = true,
  pageSize,
  pageNo = 1,
  sort = "date"
) {
  try {
    // Ensure _sport is a valid uint8 value
    if (_sport === undefined || _sport < 0) {
      _sport = 0; // Represents "any sport"
    }

    const contractAddress = process.env.ARENATON_CONTRACT;
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const contract = new ethers.Contract(
      contractAddress,
      contractABI,
      provider
    );

    // Call the contract function getPlayerEvents
    const playerEvents = await contract.getPlayerEvents(
      _playerAddress,
      _sport || 0,
      _active,
      pageSize,
      pageNo
    );

    if (!playerEvents || playerEvents.length === 0) {
      throw new Error("No events found");
    }

    // Clone the immutable result array into a mutable structure
    const clonedEvents = playerEvents.map((event) => ({ ...event }));

    console.log("getArenatonPlayerEvents Player Events:", clonedEvents);

    // Sort events based on the provided 'sort' criteria
    const sortedEvents = clonedEvents.sort((a, b) => {
      if (sort === "total") {
        // Compare by total (total_A + total_B)
        console.log("a:", a);
        console.log("b:", b);
        const totalA = a.total ?? 0;
        const totalB = b.total ?? 0;
        return totalB - totalA; // Sort by descending total
      } else if (sort === "date") {
        // Compare by startDate
        const dateA = a.startDate ?? 0;
        const dateB = b.startDate ?? 0;
        return dateA - dateB; // Sort by descending date
      }
      return 0; // Default no sort
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
    const activeEventsIdList = paginatedEvents.map((event) => event["0"]);

    console.log("getArenatonPlayerEvents Event IDs:", activeEventsIdList);

    return activeEventsIdList;
  } catch (error) {
    console.error("Failed to fetch player events:", {
      message: error.message,
      transaction: error.transaction,
      data: error.data,
    });
    return [];
  }
}

// Helper function to translate the winner field into human-readable text
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

// Helper function to format a timestamp into a readable date string
function formatDate(date) {
  const timestamp = Number(date); // Convert BigInt to Number for date formatting
  return new Date(timestamp * 1000).toLocaleString();
}

module.exports = {
  getArenatonPlayerEvents,
  translateWinner,
  formatDate,
};
