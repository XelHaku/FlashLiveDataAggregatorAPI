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
    return getEventsByList(playerEventIds, skip, size, 0);
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
    return getEventsByList(activeEventIds, skip, size, 0);
  }

  if (tournament) {
    return getEventsByTournament(tournament, skip, size, sortOrder);
  }

  if (id) {
    const idArray = Array.isArray(id) ? id : [id];
    return getEventsByList(idArray, skip, size, sortOrder);
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

async function getEventsByList(ids, skip, size, sortOrder, shortDTO = true) {
  if (!Array.isArray(ids)) {
    ids = typeof ids === "string" ? [ids] : [];
  }

  const events = await Promise.all(ids.map((id) => updateEvent(id, shortDTO)));
  const filteredEvents = events.filter((event) => event !== null);

  filteredEvents.sort((a, b) =>
    sortOrder === 1
      ? a.START_UTIME - b.START_UTIME
      : b.START_UTIME - a.START_UTIME
  );

  return {
    events: filteredEvents.slice(skip, skip + size),
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