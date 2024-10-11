const Event = require("../models/eventModel");
const { EventById } = require("../flashLive/EventById");
const { NewsByEventId } = require("../flashLive/NewsByEventId");
const { VideosByEventId } = require("../flashLive/VideosByEventId");
const { MatchOddsByEventId } = require("../flashLive/MatchOddsByEventId");
const { scorePartValidation } = require("../flashLive/scorePartValidation");

const { getEventDTO } = require("../utils/getEventDTO");
const { getArenatonEvents } = require("../utils/getArenatonEvents");
const { getArenatonPlayerEvents } = require("../utils/getArenatonPlayerEvents");
const NewsModel = require("../models/newsModel");
const pageSizeDefault = 16;



const PAGE_SIZE_DEFAULT = 16;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

const cache = new Map();

const handleError = (res, error, message = "Internal server error") => {
  console.error(`Error: ${message}`, error);
  res.status(500).json({ status: "error", message });
};

const parseQueryParams = (query) => {
  const {
    id,
    active,
    tournament,
    sport = null,
    country,
    pageNo = 1,
    sort = "asc",
    pageSize = PAGE_SIZE_DEFAULT,
    playerAddress,
    player,
  } = query;

  return {
    id,
    active: ["ACTIVE", "true", "1", "active"].includes(active),
    tournament,
    sport,
    country,
    page: parseInt(pageNo) || 1,
    size: parseInt(pageSize) || PAGE_SIZE_DEFAULT,
    sortOrder: sort.toLowerCase() === "desc" ? -1 : 1,
    playerAddress,
    player: player === "true",
  };
};
const fetchEvents = async (params) => {
  const {
    active,
    player,
    playerAddress,
    sport,
    tournament,
    id,
    country,
    page,
    size,
    sortOrder,
  } = params;
  const skip = (page - 1) * size;

  if (player && playerAddress) {
    const playerEventIds = await getArenatonPlayerEvents(
      playerAddress,
      sport,
      active,
      size,
      page,
      "date"
    );
    return await getEventsByList(playerEventIds, skip, size, 0);
  }

  if (active) {
    const activeEventIds = await getArenatonEvents(
      sport,
      0,
      playerAddress,
      "total",
      page,
      size
    );

    if (!activeEventIds || activeEventIds.length === 0) {
      console.log("No active events found. Fetching non-active events.");
      // Recursively call fetchEvents with active set to false
      return fetchEvents({
        ...params,
        active: false,
      });
    }
    const eventList = await getEventsByList(activeEventIds, 0, size, 0);

    return eventList;
  }

  if (tournament && tournament !== "0") {
    return getEventsByTournament(tournament, skip, size, sortOrder);
  }

  if (id) {
    const idArray = Array.isArray(id) ? id : [id];
    return await getEventsByList(idArray, skip, size, sortOrder);
  }

  if (sport) {
    return country
      ? getEventsBySportAndCountry(sport, country, size, page, sortOrder)
      : getEventsBySport(sport, size, page, sortOrder);
  }

  throw new Error("No valid filters provided");
};

const enrichEvents = async (events, playerAddress) => {
  const currentTime = Math.floor(Date.now() / 1000);

  return Promise.all(
    events.map(async (eventFlash) => {
      const { eventDTO } = await getEventDTO(
        eventFlash.EVENT_ID,
        playerAddress
      );

      let eventState = "0";
      if (["FINISHED", "CANCELED", "POSTPONED"].includes(eventFlash.STAGE)) {
        eventState = "3";
      } else if (eventFlash.STAGE === "SCHEDULED" && eventDTO.open) {
        eventState = "1";
      } else if (eventFlash.START_UTIME < currentTime) {
        eventState = eventFlash.WINNER !== "-1" ? "3" : "2";
      }

      if (eventDTO.payout) {
        eventState = "4";
      }

      eventDTO.eventState = eventState;
      eventFlash.queryTime = currentTime;

      return { eventFlash, eventDTO };
    })
  );
};
const ETH_TO_USD = 2300; // This should be dynamically updated or fetched from an API

exports.getEventEthers = async (req, res) => {
  try {
    const { id, playerAddress, input, team } = req.query;

    // Fetch the current event data
    let { eventDTO } = await getEventDTO(id, playerAddress);

    if (!eventDTO) {
      return res
        .status(404)
        .json({ status: "error", message: "Event not found" });
    }

    // Parse the input as a float (assuming it's in ETH)
    const inputAmount = parseFloat(input) || 0;

    // Ensure all numeric values are properly parsed
    const currentTotalA = parseFloat(eventDTO.total_A) || 0;
    const currentTotalB = parseFloat(eventDTO.total_B) || 0;
    const currentPlayerStakeAmount =
      parseFloat(eventDTO.playerStake.amount) || 0;

    // Calculate the new total stake for the selected team
    const newTotalA =
      team === "1" ? currentTotalA + inputAmount : currentTotalA;
    const newTotalB =
      team === "2" ? currentTotalB + inputAmount : currentTotalB;

    // Calculate the new player stake
    const newPlayerStake = {
      amount: currentPlayerStakeAmount + inputAmount,
      team: team || eventDTO.playerStake.team,
    };

    // Calculate the expected payout
    const expected = calculateExpectedPayout(
      currentTotalA,
      currentTotalB,
      currentPlayerStakeAmount,
      eventDTO.playerStake.team
    );
    const newExpected = calculateExpectedPayout(
      newTotalA,
      newTotalB,
      newPlayerStake.amount,
      newPlayerStake.team
    );

    // Calculate the ratio (odds)
    const ratio = calculateRatio(expected, currentPlayerStakeAmount);
    const newRatio = calculateRatio(newExpected, newPlayerStake.amount);

    // Update the eventDTO with new calculated values
    const updatedEventDTO = {
      ...eventDTO,
      total_A: newTotalA.toString(),
      total_B: newTotalB.toString(),
      total: (newTotalA + newTotalB).toString(),
      playerStake: newPlayerStake,
      totalAshort: formatShortTotal(newTotalA),
      totalBshort: formatShortTotal(newTotalB),
      stake: newPlayerStake.amount.toFixed(9),
      expected: newExpected.toFixed(9),
      ratio: newRatio,
      oddsA: oddsPivot(newTotalA, newTotalB),
      oddsB: oddsPivot(newTotalB, newTotalA),
      totalStakeUsd: `$${((newTotalA + newTotalB) * ETH_TO_USD).toFixed(
        2
      )} USD~`,
    };

    res.status(200).json({
      status: "success",
      data: {
        eventDTO: updatedEventDTO,
        calculatedValues: {
          amount: inputAmount,
          expected,
          newExpected,
          ratio,
          newRatio,
        },
      },
    });
  } catch (error) {
    console.error("Error in getEventEthers:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

function calculateExpectedPayout(totalA, totalB, stakeAmount, team) {
  if (team === "1") {
    return totalA > 0
      ? (totalB * stakeAmount) / totalA +
          stakeAmount -
          ((totalB * stakeAmount) / totalA) * 0.02
      : stakeAmount;
  } else if (team === "2") {
    return totalB > 0
      ? (totalA * stakeAmount) / totalB +
          stakeAmount -
          ((totalA * stakeAmount) / totalB) * 0.02
      : stakeAmount;
  }
  return 0;
}

function calculateRatio(expected, stake) {
  return stake > 0 ? (expected / stake).toFixed(2) : "1.00";
}

function formatShortTotal(total) {
  if (total >= 1e6) return (total / 1e6).toFixed(1) + "M";
  if (total >= 1e3) return (total / 1e3).toFixed(1) + "K";
  return total.toFixed(6) + " ETH";
}

function oddsPivot(totalA, totalB) {
  const total = totalA + totalB;
  return total > 0 ? (totalA / total).toFixed(2) : "0.50";
}

// Assuming ETH_TO_USD is defined somewhere in your codebase
exports.getEvents = async (req, res) => {
  try {
    const params = parseQueryParams(req.query);
    const cacheKey = JSON.stringify(params);

    if (cache.has(cacheKey)) {
      const { data, timestamp } = cache.get(cacheKey);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return res.status(200).json(data);
      }
    }

    const { events, totalCount } = await fetchEvents(params);

    if (!events.length) {
      return res
        .status(404)
        .json({ status: "error", message: "No events found" });
    }

    const enrichedEvents = await enrichEvents(events, params.playerAddress);
    const totalPages = Math.ceil(totalCount / params.size);

    const result = {
      status: "success",
      data: { events: enrichedEvents },
      pagination: {
        currentPage: params.page,
        pageSize: params.size,
        totalItems: totalCount,
        totalPages,
        active: params.active,
        player: params.player,
        sport: params.sport || "-1",
        country: params.country || "-1",
        tournament: params.tournament || "-1",
      },
    };

    cache.set(cacheKey, { data: result, timestamp: Date.now() });
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

async function getEventsByTournament(tournament, skip, size, sortOrder) {
  const currentTime = Math.floor(Date.now() / 1000);
  const query = {
    TOURNAMENT_ID: tournament,
    START_UTIME: { $gt: currentTime },
  };

  const [events, totalCount] = await Promise.all([
    Event.find(query)
      .sort({ START_UTIME: sortOrder })
      .skip(skip)
      .limit(size)
      .lean(),
    Event.countDocuments(query),
  ]);

  return { events, totalCount };
}

async function getEventsBySport(sport, pageSize, pageNo, sort) {
  const currentTime = Math.floor(Date.now() / 1000);
  const filter = { START_UTIME: { $gt: currentTime } };
  if (sport !== "-1") filter.SPORT = sport;

  const [events, totalCount] = await Promise.all([
    Event.find(filter)
      .sort({ START_UTIME: sort === "asc" ? 1 : -1 })
      .skip((pageNo - 1) * pageSize)
      .limit(pageSize)
      .select("-_id -__v")
      .lean(),
    Event.countDocuments(filter),
  ]);

  return { events, totalCount };
}

async function getEventsBySportAndCountry(
  sport,
  country,
  pageSize,
  pageNo,
  sort
) {
  const currentTime = Math.floor(Date.now() / 1000);
  const filter = { START_UTIME: { $gt: currentTime } };
  if (sport !== "-1") filter.SPORT = sport;
  if (country && country !== "") filter.COUNTRY_ID = country;

  const [events, totalCount] = await Promise.all([
    Event.find(filter)
      .sort({ START_UTIME: sort === "asc" ? 1 : -1 })
      .skip((pageNo - 1) * pageSize)
      .limit(pageSize)
      .select("-_id -__v")
      .lean(),
    Event.countDocuments(filter),
  ]);

  return { events, totalCount };
}

async function getEventsByList(
  ids,
  skip = 0,
  size = Infinity,
  sortOrder = 1,
  shortDTO = true
) {
  // Ensure ids is always an array
  const idsArray = Array.isArray(ids)
    ? ids
    : typeof ids === "string"
    ? [ids]
    : [];

  // Fetch events in parallel
  const eventsPromises = idsArray.map((id) => updateEvent(id, shortDTO));
  const events = await Promise.allSettled(eventsPromises);

  // Filter out rejected promises and null events
  const filteredEvents = events
    .filter((result) => result.status === "fulfilled" && result.value !== null)
    .map((result) => result.value);

  // Sort events based on sortOrder
  filteredEvents.sort((a, b) => {
    const aTime = a.START_UTIME || 0;
    const bTime = b.START_UTIME || 0;
    return sortOrder === 1 ? aTime - bTime : bTime - aTime;
  });

  // Calculate start and end indices for pagination
  const startIndex = Math.max(0, skip);
  const endIndex = Math.min(filteredEvents.length, startIndex + size);

  return {
    events: filteredEvents.slice(startIndex, endIndex),
    totalCount: filteredEvents.length,
  };
}

async function updateEvent(eventId, shortDTO = true) {
  const queryFields = shortDTO ? { NEWS: 0, VIDEOS: 0 } : {};
  let event = await Event.findOne({ EVENT_ID: eventId }, queryFields).lean();

  const currentTime = Math.floor(Date.now() / 1000);

  if (!event) {
    event = await EventById(eventId);
    if (!event || event === 404) return null;
    event.HEADER = event.HEADER || "Default Header";
    event.NAME = event.NAME || "Default Name";
    event = await Event.create(event);
  }

  const isLive = event.START_UTIME <= currentTime && event.WINNER === "-1";
  const updateInterval = isLive ? 5 * 60 : 45 * 60; // 5 minutes for live events, 45 minutes otherwise

  if (
    !event.lastUpdated ||
    event.lastUpdated < currentTime - updateInterval ||
    !shortDTO
  ) {
    let newEvent = await EventById(eventId);

    if (newEvent === 404 || !newEvent) {
      await Event.findOneAndUpdate(
        { EVENT_ID: eventId },
        { STAGE_TYPE: "CANCELED", STAGE: "CANCELED" },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return null;
    }

    newEvent = scorePartValidation(newEvent);

    if (!shortDTO) {
      const [news, videos, matchOdds] = await Promise.all([
        NewsByEventId(eventId),
        VideosByEventId(eventId),
        MatchOddsByEventId(eventId),
      ]);

      if (news) newEvent.NEWS = news;
      if (videos) newEvent.VIDEOS = videos;
      if (matchOdds) newEvent.ODDS = matchOdds;
    }

    newEvent.EVENT_ID = eventId;
    newEvent.lastUpdated = currentTime;

    await Event.findOneAndUpdate({ EVENT_ID: eventId }, newEvent, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
    return newEvent;
  }

  return event;
}

exports.getSearchEvents = async (req, res) => {
  const { search_text, sport, pageNo = 1, pageSize = 12 } = req.query;
  const page = parseInt(pageNo, 10);
  const size = parseInt(pageSize, 10);

  try {
    if (!search_text || search_text.length < 4) {
      return res.status(400).json({
        status: "error",
        message: "Search text must be at least 4 characters long",
      });
    }

    const escapedSearchText = search_text
      .trim()
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(`^${escapedSearchText}`, "i");

    const query = {
      $or: [
        { EVENT_ID: searchRegex },
        { AWAY_NAME: searchRegex },
        { HOME_NAME: searchRegex },
        { CATEGORY_NAME: searchRegex },
        { COUNTRY_NAME: searchRegex },
        { NAME: searchRegex },
        { SHORTNAME_AWAY: searchRegex },
        { SHORTNAME_HOME: searchRegex },
      ],
      START_UTIME: { $gt: Math.floor(Date.now() / 1000) },
    };

    if (sport && sport !== "-1") {
      query.SPORT = parseInt(sport, 10);
    }

    const fieldsToSelect = {
      EVENT_ID: 1,
      NAME: 1,
      CATEGORY_NAME: 1,
      COUNTRY_NAME: 1,
      HOME_NAME: 1,
      AWAY_NAME: 1,
      START_UTIME: 1,
      ODDS: 1,
      SHORTNAME_HOME: 1,
      SHORTNAME_AWAY: 1,
    };

    const [events, totalItems] = await Promise.all([
      Event.find(query)
        .select(fieldsToSelect)
        .sort({ START_UTIME: 1 })
        .skip((page - 1) * size)
        .limit(size)
        .lean(),
      Event.countDocuments(query),
    ]);

    if (!events.length) {
      return res.status(404).json({
        status: "error",
        message: "No events found matching the search criteria",
      });
    }

    const totalPages = Math.ceil(totalItems / size);

    res.status(200).json({
      status: "success",
      data: events,
      pagination: {
        currentPage: page,
        pageSize: size,
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    handleError(res, error, "Error in getSearchEvents");
  }
};
//  localhost:3000/api/v1/events?sport=-1&active=ACTIVE&pageNo=1





// // const { ethers } = require("ethers");

// // RPC URL and contract address from environment variables
// const RPC_URL = process.env.RPC_URL;
// const ARENATON_CONTRACT = process.env.ARENATON_CONTRACT;
// const ETH_TO_USD = 2300; // Current ETH to USD conversion rate

// // ABI for the contract function 'getEventDTO'
// const contractABI = [
//   {
//     type: "function",
//     name: "getEventDTO",
//     inputs: [
//       { name: "_player", type: "address", internalType: "address" },
//       { name: "_eventId", type: "string", internalType: "string" },
//     ],
//     outputs: [
//       {
//         name: "",
//         type: "tuple",
//         internalType: "struct AStructs.EventDTO",
//         components: [
//           { name: "eventId", type: "string", internalType: "string" },
//           { name: "startDate", type: "uint256", internalType: "uint256" },
//           { name: "sport", type: "uint8", internalType: "uint8" },
//           { name: "total_A", type: "uint256", internalType: "uint256" },
//           { name: "total_B", type: "uint256", internalType: "uint256" },
//           { name: "total", type: "uint256", internalType: "uint256" },
//           { name: "winner", type: "int8", internalType: "int8" },
//           {
//             name: "playerStake",
//             type: "tuple",
//             internalType: "struct AStructs.Stake",
//             components: [
//               { name: "amount", type: "uint256", internalType: "uint256" },
//               { name: "team", type: "uint8", internalType: "uint8" },
//             ],
//           },
//           { name: "active", type: "bool", internalType: "bool" },
//           { name: "closed", type: "bool", internalType: "bool" },
//           { name: "paid", type: "bool", internalType: "bool" },
//         ],
//       },
//     ],
//     stateMutability: "view",
//   },
// ];

// // Initialize provider and contract using ethers.js
// const provider = new ethers.JsonRpcProvider(RPC_URL);
// const contract = new ethers.Contract(ARENATON_CONTRACT, contractABI, provider);

// // Function to fetch event data from the contract
// async function getEventDTO(
//   _eventId,
//   _playerAddress = "0x0000000000000000000000220000000000000001"
// ) {
//   try {
//     // Call the contract function 'getEvent'
//     const eventRawDTO = await contract.getEventDTO(_playerAddress, _eventId);
//     console.log("Raw event data:", eventRawDTO);

//     // Map the raw data into a structured DTO
//     const eventDTO = mapEventDTO(eventRawDTO, _eventId);
//     return { eventDTO };
//   } catch (error) {
//     console.error(`Failed to fetch or process event DTO: ${error.message}`);
//     return { eventDTO: createDefaultEventDTO(_eventId) };
//   }
// }
// // Helper function to map the raw event data to a structured DTO
// function mapEventDTO(eventRawDTO, _eventId, ETH_TO_USD) {
//   const team = eventRawDTO.playerStake.team.toString();
//   const totalA = parseFloat(ethers.formatEther(eventRawDTO.total_A));
//   const totalB = parseFloat(ethers.formatEther(eventRawDTO.total_B));
//   const playerStakeAmount = parseFloat(
//     ethers.formatEther(eventRawDTO.playerStake.amount)
//   );

//   let expected = 0;
//   if (team === "1") {
//     // Calculate expected payout with a 2% fee deduction if totalA > 0
//     expected =
//       totalA > 0
//         ? (totalB * playerStakeAmount) / totalA +
//           playerStakeAmount -
//           ((totalB * playerStakeAmount) / totalA) * 0.02
//         : playerStakeAmount;
//   } else if (team === "2") {
//     expected =
//       totalB > 0
//         ? (totalA * playerStakeAmount) / totalB +
//           playerStakeAmount -
//           ((totalA * playerStakeAmount) / totalB) * 0.02
//         : playerStakeAmount;
//   }
//   // Ensure expected is a valid number, defaulting to 0 if NaN
//   expected = Number.isNaN(expected) ? 0 : expected;

//   // Calculate the payout ratio (as percentage) based on player's stake and expected payout
//   const ratio =
//     playerStakeAmount > 0
//       ? (expected / playerStakeAmount).toFixed(2) // Sports odds in decimal form
//       : "1.00"; // Default odds if no stake

//   // Shorten large total amounts for display (e.g., 1,000,000 => 1M)
//   const totalAshort = formatShortTotal(totalA);
//   const totalBshort = formatShortTotal(totalB);

//   return {
//     eventId: _eventId,
//     startDate: eventRawDTO.startDate.toString(),
//     sport: eventRawDTO.sport.toString(),
//     total_A: ethers.formatEther(eventRawDTO.total_A),
//     total_B: ethers.formatEther(eventRawDTO.total_B),
//     total: ethers.formatEther(eventRawDTO.total),
//     totalStakeUsd: `$${(
//       ethers.formatEther(eventRawDTO.total) * ETH_TO_USD
//     ).toFixed(2)} USD~`,
//     winner: eventRawDTO.winner.toString(),
//     playerStake: {
//       amount: ethers.formatEther(eventRawDTO.playerStake.amount),
//       team: eventRawDTO.playerStake.team.toString(),
//     },
//     open: eventRawDTO.active,
//     close: eventRawDTO.closed,
//     payout: eventRawDTO.paid,
//     totalAshort,
//     totalBshort,
//     stake: playerStakeAmount.toFixed(9), // Round player stake to 9 decimals
//     expected: expected.toFixed(9), // Round expected payout to 6 decimals
//     ratio,
//     oddsA: oddsPivot(totalA, totalB), // Calculate odds for team A
//     oddsB: oddsPivot(totalB, totalA), // Calculate odds for team B
//   };
// }

// /**
//  * Shorten large numbers for display purposes (e.g., 1,000,000 -> 1M).
//  */
// function formatShortTotal(total) {
//   if (total >= 1e6) return (total / 1e6).toFixed(1) + "M";
//   if (total >= 1e3) return (total / 1e3).toFixed(1) + "K";
//   return total.toFixed(2);
// }

// /**
//  * Calculate odds for a team based on total stakes.
//  * Avoid division by zero by returning 1 as the default odds if totalB is zero.
//  */
// function oddsPivot(totalA, totalB) {
//   return totalB > 0 ? (totalA / totalB).toFixed(2) : "1.00";
// }


// // Function to calculate odds based on totalA and totalB
// function oddsPivot(totalA, totalB) {
//   const total = totalA + totalB;
//   if (total === 0) {
//     return "0.00";
//   }
//   const odds = totalA / total;
//   return odds.toFixed(2);
// }

// // Function to format large totals into a shortened format (ETH or ATON)
// function formatShortTotal(total) {
//   const value = parseFloat(total);
//   if (value < 1e-6) {
//     return `${value.toExponential(2)}`;
//   } else if (value < 1e-3) {
//     return `${value.toExponential(4)}`;
//   } else {
//     return `${value.toFixed(6)} ETH`;
//   }
// }

// // Default event DTO in case of errors or missing data
// function createDefaultEventDTO(_eventId) {
//   return {
//     eventId: _eventId,
//     startDate: "0",
//     sport: "0",
//     total_A: "0",
//     total_B: "0",
//     total: "0",
//     winner: "0",
//     playerStake: { amount: "0", team: "0" },
//     open: false,
//     close: false,
//     payout: false,
//     totalAshort: "0",
//     totalBshort: "0",
//     stake: "0",
//     expected: "0",
//     ratio: "0.0%",
//     totalStakeUsd: "$0.00 USD~",
//     commissionInATON: "0 ATON",
//     oddsA: "0",
//     oddsB: "0",
//   };
// }

// module.exports = {
//   getEventDTO,
// };
