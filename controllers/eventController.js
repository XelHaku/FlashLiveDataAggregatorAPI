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
const pageSize = 12;

/**
 * Fetches a list of events based on various filters provided in the request query.
 * Supports pagination, sorting, and filtering by active events, tournament, sport, and country.
 * Each event is enriched with its corresponding event details (DTO) before returning the response.
 *
 * @param {Object} req - Express request object containing the query parameters.
 * @param {Object} res - Express response object used to send the response.
 */
exports.getEvents = async (req, res) => {
  const {
    id,
    active,
    tournament,
    sport = null,
    country,
    pageNo,
    sort = "asc",
    pageSize = 12,
    playerAddress,
    player,
  } = req.query;

  const page = pageNo ? parseInt(pageNo, 10) : 1;
  const size = parseInt(pageSize, 10);
  const skip = (page - 1) * size;
  const sortOrder = sort.toLowerCase() === "desc" ? -1 : 1;

  // Local variable to track whether we are fetching active events
  let isFetchingActiveEvents = active === "true";
  let isFetchingPlayerEvents = player === "true";

  try {
    let eventsList = [];
    let totalItems = 0;

    // Handle active events
    if (isFetchingActiveEvents && isFetchingPlayerEvents) {
      const activeEvents = await getArenatonPlayerEvents(
        sport,
        0,
        playerAddress,
        sort,
        pageNo,
        pageSize
      );

      if (activeEvents.length === 0) {
        // No active events found, move to other filters
        isFetchingActiveEvents = false;
      } else {
        const result = await getEventsByList(
          activeEvents,
          skip,
          size,
          sortOrder,
          true
        );
        eventsList = result.events;
        totalItems = result.totalCount;
      }
    }

    // Handle tournament filter if no active events were fetched
    if (tournament && !isFetchingActiveEvents) {
      const result = await getEventsByTournament(
        tournament,
        skip,
        size,
        sortOrder
      );
      eventsList = result.events;
      totalItems = result.totalCount;
    }

    // Handle specific event IDs
    else if (id && !isFetchingActiveEvents) {
      const idArray = Array.isArray(id) ? id : [id];
      const shortDTO = idArray.length > 1;
      const result = await getEventsByList(
        idArray,
        skip,
        size,
        sortOrder,
        shortDTO
      );
      eventsList = result.events;
      totalItems = result.totalCount;
    }

    // Handle sport and country filters
    else if (sport && !isFetchingActiveEvents) {
      const result = country
        ? await getEventsBySportAndCountry(
            sport,
            country,
            skip,
            size,
            sortOrder
          )
        : await getEventsBySport(sport, skip, size, sortOrder);
      eventsList = result.events;
      totalItems = result.totalCount;
    }

    // If no valid query parameters were provided, return a bad request error
    if (!eventsList || eventsList.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No events found",
      });
    }

    // Enrich events with event DTO
    const enrichedEvents = await Promise.all(
      eventsList.map(async (eventFlash) => {
        const { eventDTO } = await getEventDTO(
          eventFlash.EVENT_ID,
          playerAddress
        );

        // Set event state based on its properties
        switch (eventFlash.STAGE) {
          case "FINISHED":
          case "CANCELED":
          case "POSTPONED":
            eventDTO.eventState = "3";
            break;
          case "SCHEDULED":
            eventDTO.eventState = "1";
            break;
          default:
            if (
              eventFlash.START_UTIME < Math.floor(Date.now() / 1000) &&
              eventFlash.WINNER === "-1"
            ) {
              eventDTO.eventState = "2";
            }
            if (eventDTO.payout) {
              eventDTO.eventState = "4";
            }
            break;
        }

        return { eventFlash, eventDTO };
      })
    );

    const totalPages = Math.ceil(totalItems / size);

    // Send success response with events and pagination
    res.status(200).json({
      status: "success",
      data: { events: enrichedEvents },
      pagination: {
        currentPage: page,
        pageSize: size,
        totalItems,
        totalPages,
        active: isFetchingActiveEvents,
      },
    });
  } catch (error) {
    console.error("Error in getEvents:", error.stack);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

async function getEventsByTournament(tournament, skip, size, sortOrder) {
  console.log("getEventsByTournament");
  try {
    const currentTime = Math.floor(Date.now() / 1000);

    // Fetch events that match the criteria and apply pagination
    let eventsList = await Event.aggregate([
      {
        $match: {
          TOURNAMENT_ID: tournament,
          START_UTIME: { $gt: currentTime },
        },
      },
      { $sort: { START_UTIME: sortOrder } },
      { $skip: skip },
      { $limit: size },
    ]);

    // Get total count of matching events for pagination
    const totalCount = await Event.countDocuments({
      TOURNAMENT_ID: tournament,
      START_UTIME: { $gt: currentTime },
    });

    return { events: eventsList, totalCount };
  } catch (error) {
    console.error("Error in getEventsByTournament:", error);
    return { events: [], totalCount: 0 };
  }
}
async function getEventsBySport(sport, skip, size, sortOrder) {
  try {
    const currentTime = Math.floor(Date.now() / 1000);

    // Create a filter object for the query
    const filter = {
      START_UTIME: { $gt: currentTime },
    };

    // Add sport filter only if sport is not -1
    if (sport !== "-1") {
      filter.SPORT = sport;
    }

    // Fetch the upcoming events for the given sport with pagination
    const upcomingEvents = await Event.find(filter)
      .sort({ START_UTIME: sortOrder })
      .skip(skip)
      .limit(size)
      .select("-_id -__v")
      .lean();

    // Get total count of matching events for pagination
    const totalCount = await Event.countDocuments(filter);

    return { events: upcomingEvents, totalCount };
  } catch (error) {
    console.error("Error in getEventsBySport:", error);
    throw error;
  }
}

async function getEventsBySportAndCountry(
  sport,
  country,
  skip,
  size,
  sortOrder
) {
  try {
    const currentTime = Math.floor(Date.now() / 1000);

    // Create a filter object for the query
    const filter = {
      START_UTIME: { $gt: currentTime },
    };

    // Add sport filter only if sport is not -1
    if (sport !== -1) {
      filter.SPORT = sport;
    }

    // Add country filter only if country is not -1
    if (country !== -1) {
      filter.COUNTRY_ID = country;
    }

    // Fetch the upcoming events for the given sport and country with pagination
    const upcomingEvents = await Event.find(filter)
      .sort({ START_UTIME: sortOrder })
      .skip(skip)
      .limit(size)
      .select("-_id -__v")
      .lean();

    // Get total count of matching events for pagination
    const totalCount = await Event.countDocuments(filter);

    return { events: upcomingEvents, totalCount };
  } catch (error) {
    console.error("Error in getEventsBySportAndCountry:", error);
    throw error;
  }
}
async function getEventsByList(ids, skip, size, sortOrder, shortDTO = true) {
  console.log("getEventsByList");

  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) {
    if (typeof ids === "string") {
      ids = [ids];
    } else {
      throw new Error("Invalid event ID list - must be an array of strings");
    }
  }

  // Helper function to add delay
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  try {
    const events = [];

    for (const id of ids) {
      // Update event and add it to the events array
      const event = await updateEvent(id, shortDTO);
      if (event !== null) {
        events.push(event);
      }
      // Add a delay of 10 milliseconds before the next call
      await delay(10);
    }

    const totalCount = events.length;

    // Sort the events based on the START_UTIME field in the specified order
    events.sort((a, b) => {
      if (sortOrder === 1) {
        return a.START_UTIME - b.START_UTIME;
      } else {
        return b.START_UTIME - a.START_UTIME;
      }
    });

    // Apply pagination manually since the eventsList is already filtered
    const paginatedEvents = events.slice(skip, skip + size);

    return { events: paginatedEvents, totalCount };
  } catch (error) {
    console.error("Error in getEventsByList:", error);
    throw error;
  }
}

/**
 * Updates an individual event by its ID.
 * Fetches the event from the database or an external source (Flashscore).
 * Applies necessary updates based on certain conditions.
 *
 * @param {string} eventId - The ID of the event to update.
 * @param {boolean} shortDTO - Flag indicating whether to include expensive fields.
 * @returns {Object | null} - The updated event object or null if not found.
 */
async function updateEvent(eventId, shortDTO = true) {
  // Construct the query object based on shortDTO
  const queryFields = shortDTO
    ? { NEWS: 0, VIDEOS: 0, ODDS: 0 } // Exclude these fields
    : {}; // Include all fields if shortDTO is false

  // Attempt to find the event in the database
  let event = await Event.findOne({ EVENT_ID: eventId }, queryFields).lean();

  // If not found in the database, try fetching from an external source (Flashscore)
  if (!event || event === "") {
    event = await EventById(eventId);

    // If still not found, return null
    if (!event || event === 404) return null;

    // Ensure required fields are included
    event.HEADER = event.HEADER || "Default Header"; // Provide a default value or fetch it appropriately
    event.NAME = event.NAME || "Default Name"; // Provide a default value or fetch it appropriately

    // If found, create a new event in the database
    event = await Event.create(event);
  }

  const currentTime = Math.floor(Date.now() / 1000);

  // Check if the event needs to be updated based on the lastUpdated timestamp
  if (
    !event.lastUpdated ||
    (event.lastUpdated < currentTime - 10 * 60 && !shortDTO)
  ) {
    // Fetch the latest event details from an external source
    let newEvent = await EventById(eventId);

    // Handle cases where the event is not found or marked as CANCELED
    if (newEvent === 404 || !newEvent) {
      // Update the existing event to indicate it is CANCELED if not found
      await Event.findOneAndUpdate(
        { EVENT_ID: eventId },
        { STAGE_TYPE: "CANCELED", STAGE: "CANCELED" },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );
      return null;
    }

    newEvent = scorePartValidation(newEvent);

    // Process and update news, videos, and odds only if shortDTO is false
    if (!shortDTO) {
      const [news, videos, matchOdds] = await Promise.all([
        NewsByEventId(eventId).catch((error) =>
          console.error("Error fetching news:", error)
        ),
        VideosByEventId(eventId).catch((error) =>
          console.error("Error fetching Video:", error)
        ),
        MatchOddsByEventId(eventId).catch((error) =>
          console.error("Error fetching Match Odds:", error)
        ),
      ]);

      if (news) newEvent.NEWS = news;
      if (videos) newEvent.VIDEOS = videos;
      if (matchOdds) {
        newEvent.ODDS = matchOdds.DATA;
      } else {
        newEvent.ODDS = [];
      }
    }

    // Update the event in the database with the new data and update the lastUpdated field
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

// getSearchEvents function
exports.getSearchEvents = async (req, res) => {
  const { search_text, sport, pageNo = 1, pageSize = 12 } = req.query;
  const page = parseInt(pageNo);
  const size = parseInt(pageSize);
  const skip = (page - 1) * size;

  try {
    if (!search_text || search_text.length < 3) {
      return res.status(400).json({
        status: "error",
        message: "Search text must be at least 4 characters long",
      });
    }

    const searchRegex = new RegExp(search_text, "i");
    const query = {
      $and: [
        {
          $or: [
            { EVENT_ID: searchRegex },
            { AWAY_NAME: searchRegex },
            { AWAY_PARTICIPANT_NAME_ONE: searchRegex },
            { CATEGORY_NAME: searchRegex },
            { COUNTRY_NAME: searchRegex },
            { HOME_NAME: searchRegex },
            { HOME_PARTICIPANT_NAME_ONE: searchRegex },
            { NAME: searchRegex },
            { NAME_PART_1: searchRegex },
            { NAME_PART_2: searchRegex },
            { SHORTNAME_AWAY: searchRegex },
            { SHORTNAME_HOME: searchRegex },
            { SHORT_NAME: searchRegex },
            { SORT: searchRegex },
            { TOURNAMENT_ID: searchRegex },
          ],
        },
        { START_UTIME: { $gt: Math.floor(Date.now() / 1000) } }, // Co Added condition to only query events with START_UTIME > 1730908800
      ],
    };

    if (sport && sport !== "-1") {
      query.$and.push({ SPORT: sport });
    }

    const events = await Event.find(query)
      .select({
        EVENT_ID: 1,
        NAME: 1,
        CATEGORY_NAME: 1,
        COUNTRY_NAME: 1,
        HOME_NAME: 1,
        AWAY_NAME: 1,
        HOME_PARTICIPANT_NAME_ONE: 1,
        AWAY_PARTICIPANT_NAME_ONE: 1,
        START_UTIME: 1,
        STAGE_TYPE: 1,
        HOME_SCORE_CURRENT: 1,
        AWAY_SCORE_CURRENT: 1,
        ODDS: 1,
        HOME_IMAGES: 1,
        AWAY_IMAGES: 1,
        SHORTNAME_HOME: 1,
        SHORTNAME_AWAY: 1,
        SHORT_NAME: 1,
        TOURNAMENT_ID: 1,
      })
      .sort({ START_UTIME: 1 })
      .skip(skip)
      .limit(size);

    const totalItems = await Event.countDocuments(query);
    const totalPages = Math.ceil(totalItems / size);

    if (events.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No events found matching the search criteria",
      });
    }

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
    console.error("Error in getSearchEvents:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};
