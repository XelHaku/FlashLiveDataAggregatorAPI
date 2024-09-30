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

    console.log("getArenatonPlayerEvents Parameters:", {
      playerAddress: _playerAddress,
      sport: _sport,
      active: _active,
      pageSize,
      pageNo,
      sort,
    });

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
      0,
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
        return dateB - dateA; // Sort by descending date
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
