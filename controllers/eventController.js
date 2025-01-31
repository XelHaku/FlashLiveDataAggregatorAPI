const Event = require("../models/eventModel");
const { EventById } = require("../flashLive/EventById");
const { NewsByEventId } = require("../flashLive/NewsByEventId");
const { VideosByEventId } = require("../flashLive/VideosByEventId");
const { MatchOddsByEventId } = require("../flashLive/MatchOddsByEventId");
const { scorePartValidation } = require("../flashLive/scorePartValidation");
const { activeEventsSummary } = require("../worker/activeEventsSummary");

const { getEventDTO } = require("../utils/getEventDTO");
const { getArenatonEvents } = require("../utils/getArenatonEvents");
const { getArenatonPlayerEvents } = require("../utils/getArenatonPlayerEvents");
const NewsModel = require("../models/newsModel");

const PAGE_SIZE_DEFAULT = 19;
const CACHE_DURATION =  5 * 1000; // 5 minutes in milliseconds

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
    pageNo: parseInt(pageNo) || 1,
    pageSize: pageSize || PAGE_SIZE_DEFAULT,
    sort: sort.toLowerCase() === "desc" ? -1 : 1,
    playerAddress,
    player: player === "true",
  };
};
const fetchEvents = async (params) => {
  const active = false
  const {
    player,
    playerAddress,
    sport,
    tournament,
    id,
    country,
    page,
    pageSize,
    sort,
  } = params;
  const skip = (page - 1) * pageSize;
  if (tournament && tournament !== "0") {
    return getEventsByTournament(tournament, skip, pageSize, sort);
  }
  if (player && playerAddress) {
    const playerEventIds = await getArenatonPlayerEvents(
      playerAddress,
      sport,
      active,
      pageSize,
      page,
      "date"
    );
    // return await getEventsByList(playerEventIds, skip, pageSize, 0);
    const { events, totalCount } = await getEventsByList(
      playerEventIds,
      skip,
      pageSize,
      0
    );

    const pagination = {
      sport: sport,
      pageSize: pageSize,
      pageNo: page,
      active: active,
    };
    return { events, totalCount, pagination };
  }

  if (active) {
    const activeEventIds = await getArenatonEvents(
      sport,
      0,
      playerAddress,
      "total",
      page,
      pageSize
    );

    if (!activeEventIds || activeEventIds.eventIdList.length === 0) {
      console.log("No active events found. Fetching non-active events.");
      // Recursively call fetchEvents with active set to false
      return fetchEvents({
        ...params,
        active: false,
      });
    }
    const { events, totalCount } = await getEventsByList(
      activeEventIds.eventIdList,
      0,
      pageSize,
      0
    );

    if (events.length !== 0) {
      const sport = events[0].SPORT.SPORT_ID;
    }
    const pagination = {
      sport: sport,
      pageSize: pageSize,
      pageNo: page,
    };
    return { events, totalCount, pagination };
  }

  if (id) {
    const idArray = Array.isArray(id) ? id : [id];
    const { events, totalCount } = await getEventsByList(
      idArray,
      skip,
      pageSize,
      sort,
      false
    );
    const pagination = {
      sport: events.length > 0 ? events[0].SPORT : "",
      country: events.length > 0 ? events[0].COUNTRY_ID : "",
      countryName: events.length > 0 ? events[0].COUNTRY_NAME : "",
      tournament: events.length > 0 ? events[0].TOURNAMENT_ID : "",
      tournamentName: events.length > 0 ? events[0].SHORT_NAME : "",
      pageSize: pageSize,
      pageNo: page,
    };

    return { events, totalCount, pagination };
  }

  if (sport) {
    return country
      ? getEventsBySportAndCountry(sport, country, pageSize, page, sort)
      : getEventsBySport(sport, pageSize, page, sort);
  }

  throw new Error("No valid filters provided");
};

const calculateEventState = async (eventFlash, eventDTO) => {
  const currentTime = Math.floor(Date.now() / 1000);

  let eventState = "0";
  if (
    ["FINISHED", "CANCELED", "POSTPONED", "ABANDONED", "DELAYED"].includes(
      eventFlash.STAGE
    )
  ) {
    eventState = "3";
  } else if (eventFlash.STAGE === "SCHEDULED" && eventDTO.open) {
    eventState = "1";
  }

  if (eventFlash.START_UTIME < currentTime) {
    eventState = eventFlash.WINNER !== "-1" ? "3" : "2";
  }
  if (eventDTO.closed) {
    eventState = "3";
  }
  if (eventDTO.payout) {
    eventState = "4";
  }

  eventDTO.eventState = eventState;
  eventFlash.queryTime = currentTime;

  return eventState;
};
const ETH_TO_USD = 2600; // This should be dynamically updated or fetched from an API

exports.activeEventsSummary = async (req, res) => {
  try {
    const params = parseQueryParams(req.query);

    const result = await activeEventsSummary(params.sport || "-1");
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getEventEthers:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

exports.getEventEthers = async (req, res) => {
  try {
    let { id, playerAddress, input, team } = req.query;

    // Fetch the current event data
    let { eventDTO } = await getEventDTO(id, playerAddress);
    if (!team) {
      team = 0;
    }
    if (!input) {
      input = 0;
    }

    if (!eventDTO) {
      return res
        .status(404)
        .json({ status: "error", message: "Event not found" });
    }

    // Parse the input as a float (assuming it's in ETH)
    const inputAmount = parseFloat(input) || 0;

    // Determine the effective team
    let effectiveTeam = team;
    if (
      eventDTO?.playerStake?.team === "1" ||
      eventDTO?.playerStake?.team === "2"
    ) {
      effectiveTeam = eventDTO?.playerStake?.team;
    }

    // Ensure all numeric values are properly parsed
    const currentTotalA = parseFloat(eventDTO.total_A) || 0;
    const currentTotalB = parseFloat(eventDTO.total_B) || 0;
    const currentPlayerStakeAmount =
      parseFloat(eventDTO.playerStake.amount) || 0;

    // Calculate the new total stake for the selected team
    const newTotalA =
      effectiveTeam === "1" ? currentTotalA + inputAmount : currentTotalA;
    const newTotalB =
      effectiveTeam === "2" ? currentTotalB + inputAmount : currentTotalB;

    // Calculate the new player stake
    const newPlayerStake = {
      amount: currentPlayerStakeAmount + inputAmount,
      team: effectiveTeam,
    };

    // Calculate the expected payout
    const expected = calculateExpectedPayout(
      currentTotalA,
      currentTotalB,
      currentPlayerStakeAmount,
      effectiveTeam
    );
    const newExpected = calculateExpectedPayout(
      newTotalA,
      newTotalB,
      newPlayerStake.amount,
      effectiveTeam
    );

    const diffExpected = newExpected - expected;

    // Calculate the ratio (odds)
    const calculateRatio = (expectedPayout, stakeAmount) => {
      if (stakeAmount <= 0) return 0;
      return expectedPayout / stakeAmount;
    };

    const ratio = calculateRatio(expected, currentPlayerStakeAmount);
    const newRatio = calculateRatio(newExpected, newPlayerStake.amount);

    // Ensure ratio and newRatio are numbers and not NaN
    const safeRatio = isNaN(ratio) ? 0 : ratio;
    const safeNewRatio = isNaN(newRatio) ? 0 : newRatio;

    console.log("Calculated values:", {
      currentTotalA,
      currentTotalB,
      currentPlayerStakeAmount,
      newTotalA,
      newTotalB,
      inputAmount,
      expected,
      newExpected,
      ratio,
      newRatio,
      safeRatio,
      safeNewRatio,
    });

    const eventFlash = await getEventDBshort(id);
    const eventState = await calculateEventState(eventFlash, eventDTO);

    // Update the eventDTO with new calculated values
    const updatedEventDTO = {
      ...eventDTO,
      team: effectiveTeam,
      inputAmount: inputAmount.toFixed(6),
      eventState: eventState,
      total: (currentTotalA + currentTotalB).toFixed(6),
      total_A: currentTotalA.toFixed(6),
      total_B: currentTotalB.toFixed(6),
      oddsA: oddsPivot(currentTotalA, currentTotalB),
      oddsB: oddsPivot(currentTotalB, currentTotalA),
      totalAshort: formatShortTotal(newTotalA),
      totalBshort: formatShortTotal(newTotalB),
      stake: newPlayerStake.amount.toFixed(6),
      expected: newExpected.toFixed(6),
      ratio: safeNewRatio.toFixed(2),
      newTotal: (newTotalA + newTotalB).toFixed(6),
      newTotal_A: newTotalA.toFixed(6),
      newTotal_B: newTotalB.toFixed(6),
      newOddsA: oddsPivot(newTotalA, newTotalB),
      newOddsB: oddsPivot(newTotalB, newTotalA),
      totalStakeUsd: `$${((newTotalA + newTotalB) * ETH_TO_USD).toFixed(
        2
      )} USD~`,
      calculatedValues: {
        currentStake: currentPlayerStakeAmount.toFixed(6),
        amount: inputAmount.toFixed(6),
        expected: expected.toFixed(6),
        newExpected: newExpected.toFixed(6),
        diffExpected: diffExpected.toFixed(6),
        ratio: safeRatio.toFixed(2),
        newRatio: safeNewRatio.toFixed(2),
        diffRatio: (safeNewRatio - safeRatio).toFixed(2),
        pctDiffRatio: `${(
          ((safeNewRatio - safeRatio) / Math.abs(safeRatio)) *
          100
        ).toFixed(2)}%`,
        pctDiffExpected: `${(
          ((newExpected - expected) / Math.abs(expected)) *
          100
        ).toFixed(2)}%`,
        pctDiffStake: `${(
          ((newPlayerStake.amount - currentPlayerStakeAmount) /
            Math.abs(currentPlayerStakeAmount)) *
          100
        ).toFixed(2)}%`,
      },
    };

    res.status(200).json({
      status: "success",
      data: {
        eventDTO: updatedEventDTO,
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

    const { events, totalCount, pagination } = await fetchEvents(params);

    if (!events.length) {
      return res
        .status(404)
        .json({ status: "error", message: "No events found" });
    }

    // const enrichedEvents = await enrichEvents(events, params.playerAddress);
    const totalPages = Math.ceil(totalCount / params.size);

    const result = {
      status: "success",
      data: { events: events },
      pagination: pagination,
    };

    cache.set(cacheKey, { data: result, timestamp: Date.now() });
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error);
  }
};
async function getEventsByTournament(tournament, skip, pageSize, sort, pageNo) {
  try {
    // Subtract 1 day from the current time (in seconds)
    const oneDayInSeconds = 24 * 60 * 60;
    const currentTime = Math.floor(Date.now() / 1000) - oneDayInSeconds;

    const query = {
      TOURNAMENT_ID: tournament,
      START_UTIME: { $gt: currentTime },
    };

    const [events] = await Promise.all([
      Event.find(query)
        .sort({ START_UTIME: sort })
        .skip(skip)
        .limit(pageSize)
     
        .lean(),
    ]);

    const totalCount = events.length;

    let sport = "-1",
      country = "",
      tournamentId = "",
      countryName = "",
      tournamentName = "";

    if (events.length !== 0) {
      tournamentId = events[0].TOURNAMENT_ID;
      sport = events[0].SPORT;
      country = events[0].COUNTRY_ID;
      countryName = events[0].COUNTRY_NAME;
      tournamentName = events[0].SHORT_NAME;
    }

    const pagination = {
      sport: sport,
      country: country,
      tournament: tournamentId,
      countryName: countryName,
      tournamentName: tournamentName,
      pageSize: pageSize,
      pageNo: pageNo || 1,
      sort: sort,
      active: false,
    };

    return { events, totalCount, pagination };
  } catch (error) {
    console.error("Error fetching events:", error);
    return {
      events: [],
      totalCount: 0,
      pagination: null,
      error: error.message,
    };
  }
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

  const pagination = {
    sport: sport,
    country: "",
    tournament: "",
    pageSize: pageSize,
    pageNo: pageNo,
    sort: sort,
    active: false,
  };

  return { events, totalCount, pagination };
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

  if (events.length !== 0) {
    const sport = events[0].SPORT.SPORT_ID;
    const country = events[0].COUNTRY_ID;
    const countryName = events[0].COUNTRY_NAME;
  }
  const pagination = {
    sport: sport,
    country: country,
    countryName: countryName,
    pageSize: pageSize,
    pageNo: pageNo,
    sort: sort,
    active: false,
  };

  return { events, totalCount, pagination };
}

async function getEventsByList(
  ids,
  skip = 0,
  pageSize = Infinity,
  sort = 1,
  shortDTO = true
) {
  // Ensure ids is always an array
  const idsArray = Array.isArray(ids)
    ? ids
    : typeof ids === "string"
    ? [ids]
    : [];

  // Fetch events in parallel
  const eventsPromises = idsArray.map((id) => getEventDB(id));
  const events = await Promise.allSettled(eventsPromises);

  // Filter out rejected promises and null events
  const filteredEvents = events
    .filter((result) => result.status === "fulfilled" && result.value !== null)
    .map((result) => result.value);

  // Sort events based on sort
  if (sort !== 0) {
    filteredEvents.sort((a, b) => {
      const aTime = a.START_UTIME || 0;
      const bTime = b.START_UTIME || 0;
      return sort === 1 ? aTime - bTime : bTime - aTime;
    });
  }

  // Calculate start and end indices for pagination
  const startIndex = 0;
  const endIndex = Math.min(filteredEvents.length, startIndex + pageSize);

  return {
    events: filteredEvents.slice(startIndex, endIndex),
    totalCount: filteredEvents.length,
  };
}

async function getEventDB(eventId) {
  const queryFields = { NEWS: 0, VIDEOS: 0 };
  let event = await Event.findOne({ EVENT_ID: eventId }, queryFields).lean();

  return event;
}

async function getEventDBshort(eventId) {
  const queryFields = {
    EVENT_ID: 1,
    STAGE: 1,
    WINNER: 1,
    START_UTIME: 1,
  };

  let event = await Event.findOne({ EVENT_ID: eventId }, queryFields).lean();

  return event;
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
  const updateInterval = isLive ? 15 * 60 : 120 * 60; // 15 minutes for live events, 120 minutes otherwise

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
  const _pageSize = parseInt(pageSize, 10);

  try {
    if (!search_text || search_text.length < 3) {
      return res.status(400).json({
        status: "error",
        message: "Search text must be at least 3 characters long",
      });
    }

    // Escape special regex characters and create a case-insensitive regex
    const escapedSearchText = search_text.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    const query = {
      $or: [
        { EVENT_ID: { $regex: escapedSearchText, $options: "i" } },
        { AWAY_NAME: { $regex: escapedSearchText, $options: "i" } },
        { HOME_NAME: { $regex: escapedSearchText, $options: "i" } },
        { CATEGORY_NAME: { $regex: escapedSearchText, $options: "i" } },
        { COUNTRY_NAME: { $regex: escapedSearchText, $options: "i" } },
        { NAME: { $regex: escapedSearchText, $options: "i" } },
        { SHORTNAME_AWAY: { $regex: escapedSearchText, $options: "i" } },
        { SHORTNAME_HOME: { $regex: escapedSearchText, $options: "i" } },
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
      SPORT: 1,
      COUNTRY_ID: 1,
      WINNER: 1,
      AWAY_IMAGES: 1,
      HOME_IMAGES: 1,
      STAGE_TYPE: 1,
    };

    const [events, totalItems] = await Promise.all([
      Event.find(query)
        .select(fieldsToSelect)
        .sort({ START_UTIME: 1 })
        .skip((page - 1) * _pageSize)
        .limit(pageSize)
        .lean(),
      Event.countDocuments(query),
    ]);

    if (!events.length) {
      return res.status(404).json({
        status: "error",
        message: "No events found matching the search criteria",
      });
    }

    const totalPages = Math.ceil(totalItems / _pageSize);

    res.status(200).json({
      status: "success",
      data: events,
      pagination: {
        currentpageNo: page,
        pageSize: _pageSize,
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    handleError(res, error, "Error in getSearchEvents");
  }
};
//  localhost:3000/api/v1/events?sport=-1&active=ACTIVE&pageNo=1


