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
    pageNo = 1,
    sort = "asc",
    pageSize = pageSizeDefault, // Ensure pageSizeDefault is defined
    playerAddress,
    player,
  } = req.query;

  console.log(
    `Received request with query params: ${JSON.stringify(req.query)}`
  );
  let _active = false;
  if (
    active === "ACTIVE" ||
    active === "true" ||
    active === "1" ||
    active === "active"
  ) {
    _active = true;
  }

  const page = parseInt(pageNo) || 1;
  const size = parseInt(pageSize) || pageSizeDefault;
  const skip = (page - 1) * size;
  const sortOrder = sort.toLowerCase() === "desc" ? -1 : 1;

  console.log(
    `Pagination - Page: ${page}, Page Size: ${size}, Skip: ${skip}, Sort Order: ${sortOrder}`
  );

  try {
    let eventsList = [];
    let totalItems = 0;

    // Fetch player-specific events
    if (player === "true" && playerAddress) {
      console.log(
        `Fetching player-specific events for player address: ${playerAddress}`
      );

      const playerEventIds = await getArenatonPlayerEvents(
        playerAddress,
        sport,
        _active,
        size,
        page,
        "date"
      );

      if (!playerEventIds || playerEventIds.length === 0) {
        return res.status(200).json({
          status: "success",
          data: { events: [] },
          pagination: {
            currentPage: page,
            pageSize: 0,
            totalItems: 0,
            totalPages: 1,
            active: _active,
            player: true,
            sport: sport || "-1",
          },
        });
      }

      console.log(
        `Player-specific events found: ${playerEventIds.length} events`
      );
      const result = await getEventsByList(playerEventIds, skip, size, 0);
      eventsList = result.events;
      totalItems = result.totalCount;

      // Fetch active events
    } else if (_active) {
      console.log("Fetching active events...");

      const activeEventIds = await getArenatonEvents(
        sport,
        0,
        playerAddress,
        "total",
        page,
        size
      );

      if (!activeEventIds || activeEventIds.length === 0) {
        return res.status(200).json({
          status: "success",
          data: { events: [] },
          pagination: {
            currentPage: page,
            pageSize: 0,
            totalItems: 0,
            totalPages: 1,
            active: "true",
            player: "false",
            sport: sport || "-1",
          },
        });
      }

      console.log(`Active events found: ${activeEventIds.length} events`);
      const result = await getEventsByList(activeEventIds, skip, size, 0);
      eventsList = result.events;
      totalItems = result.totalCount;

      // Fetch events by tournament
    } else if (tournament) {
      console.log(`Fetching events by tournament: ${tournament}`);
      const result = await getEventsByTournament(
        tournament,
        skip,
        size,
        sortOrder
      );
      eventsList = result.events;
      totalItems = result.totalCount;

      // Fetch events by ID
    } else if (id) {
      console.log(`Fetching events by ID: ${id}`);
      const idArray = Array.isArray(id) ? id : [id];
      const result = await getEventsByList(idArray, skip, size, sortOrder);
      eventsList = result.events;
      totalItems = result.totalCount;

      // Fetch events by sport (and optionally by country)
    } else if (sport) {
      console.log(
        `Fetching events by sport: ${sport} and country: ${country || "N/A"}`
      );
      const result = country
        ? await getEventsBySportAndCountry(
            sport,
            country,
            pageSize,
            pageNo,
            sortOrder
          )
        : await getEventsBySport(sport, pageSize, pageNo, sortOrder);

      eventsList = result.events;
      totalItems = result.totalCount;
    } else {
      console.log("No valid filters provided");
      return res.status(400).json({
        status: "error",
        message: "No valid filters provided",
      });
    }

    // Return an error if no events found
    if (!eventsList.length) {
      console.log("No events found after applying filters");
      return res.status(404).json({
        status: "error",
        message: "No events found",
      });
    }

    // Enrich the events with additional DTOs
    console.log("Enriching events with event DTOs");

    const enrichedEvents = await Promise.all(
      eventsList.map(async (eventFlash) => {
        const { eventDTO } = await getEventDTO(
          eventFlash.EVENT_ID,
          playerAddress
        );
        const currentTime = Math.floor(Date.now() / 1000);
        let eventState = "0"; // Default state: not opened

        if (["FINISHED", "CANCELED", "POSTPONED"].includes(eventFlash.STAGE)) {
          eventState = "3"; // Event is completed or canceled
        } else if (eventFlash.STAGE === "SCHEDULED" && eventDTO.open) {
          eventState = "1"; // Event is scheduled
        } else if (eventFlash.START_UTIME < currentTime) {
          eventState = "2"; // Event is live
        } else if (
          eventFlash.START_UTIME < currentTime &&
          eventFlash.WINNER !== "-1"
        ) {
          eventState = "3"; // Event is live
        }

        if (eventDTO.payout) {
          eventState = "4"; // Payout is completed
        }

        eventDTO.eventState = eventState;
        return { eventFlash, eventDTO };
      })
    );

    const totalPages = Math.ceil(totalItems / size);

    console.log(
      `Sending response with ${enrichedEvents.length} enriched events`
    );

    res.status(200).json({
      status: "success",
      data: { events: enrichedEvents },
      pagination: {
        currentPage: page,
        pageSize: size,
        totalItems,
        totalPages,
        active: active === "true",
        player: player === "true",
        sport: sport || "-1",
      },
    });
  } catch (error) {
    console.error("Error in getEvents:", error);

    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Add verbosity to other helper functions (example for getEventsByTournament)
async function getEventsByTournament(tournament, skip, size, sortOrder) {
  console.log(
    `Fetching events for tournament: ${tournament}, Skip: ${skip}, Size: ${size}, Sort Order: ${sortOrder}`
  );

  try {
    const currentTime = Math.floor(Date.now() / 1000);

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

    const totalCount = await Event.countDocuments({
      TOURNAMENT_ID: tournament,
      START_UTIME: { $gt: currentTime },
    });

    console.log(
      `Found ${eventsList.length} events for tournament: ${tournament}, Total Count: ${totalCount}`
    );

    return { events: eventsList, totalCount };
  } catch (error) {
    console.error("Error in getEventsByTournament:", error);
    return { events: [], totalCount: 0 };
  }
}

async function getEventsBySport(
  sport,
  pageSize = 10, // Default page size
  pageNo = 1, // Default page number
  sort = "asc" // Default sorting order
) {
  try {
    const currentTime = Math.floor(Date.now() / 1000);

    // Create a filter object for the query
    const filter = {
      START_UTIME: { $gt: currentTime }, // Get events that are in the future
    };

    // Add sport filter only if sport is not -1
    if (sport !== "-1") {
      filter.SPORT = sport;
    }

    // Determine the sorting order (ascending or descending)

    // Calculate how many items to skip for pagination
    const skip = (pageNo - 1) * pageSize;

    // Fetch the upcoming events for the given sport with pagination
    const upcomingEvents = await Event.find(filter)
      .sort({ START_UTIME: 1 }) // Sort by start time
      .skip(skip) // Skip items for pagination
      .limit(pageSize) // Limit the number of results
      .select("-_id -__v") // Exclude unwanted fields
      .lean(); // Optimize query by returning plain JavaScript objects

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
  pageSize = 10, // Default page size
  pageNo = 1, // Default page number
  sort = "asc" // Default sorting order
) {
  try {
    const currentTime = Math.floor(Date.now() / 1000);

    // Create a filter object for the query
    const filter = {
      START_UTIME: { $gt: currentTime }, // Only get events that are in the future
    };

    // Add sport filter only if sport is not -1 (indicating "any sport")
    if (sport !== "-1") {
      filter.SPORT = sport;
    }

    // Add country filter only if country is not -1 (indicating "any country")
    if (country && country !== "") {
      filter.COUNTRY_ID = country;
    }

    // Determine the sorting order (ascending or descending)

    // Calculate how many items to skip for pagination
    const skip = (pageNo - 1) * pageSize;

    // Fetch the upcoming events for the given sport and country with pagination
    const upcomingEvents = await Event.find(filter)
      .sort({ START_UTIME: 1 }) // Sort by start time
      .skip(skip) // Skip items for pagination
      .limit(pageSize) // Limit the number of results
      .select("-_id -__v") // Exclude unwanted fields
      .lean(); // Optimize query by returning plain JavaScript objects

    // Get total count of matching events for pagination
    const totalCount = await Event.countDocuments(filter);

    return { events: upcomingEvents, totalCount };
  } catch (error) {
    console.error("Error in getEventsBySportAndCountry:", error);
    throw error;
  }
}

async function getEventsByList(ids, skip, size, sortOrder, shortDTO = true) {
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
    if (ids.length < 2) {
      shortDTO = false;
    }

    for (const id of ids) {
      // Update event and add it to the events array
      const event = await updateEvent(id, shortDTO);
      if (event !== null) {
        events.push(event);
      }
      // Add a delay of 10 milliseconds before the next call
      // await delay(10);
    }

    const totalCount = events.length;

    // Sort the events based on the START_UTIME field in the specified order
    events.sort((a, b) => {
      if (sortOrder === 1) {
        return a.START_UTIME - b.START_UTIME;
      } else if (sortOrder === -1) {
        return b.START_UTIME - a.START_UTIME;
      }
      return 0;
    });

    // Apply pagination manually since the eventsList is already filtered
    const paginatedEvents = events.slice(skip, skip + size);

    return { events: paginatedEvents, totalCount };
  } catch (error) {
    console.error("Error in get EventsByList:", error);
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
    ? { NEWS: 0, VIDEOS: 0 } // Exclude these fields for shortDTO
    : {}; // Include all fields if shortDTO is false

  // Attempt to find the event in the database
  // let event = await Event.findOne({ EVENT_ID: eventId }, queryFields).lean();
  let event = await Event.findOne({ EVENT_ID: eventId }).lean();

  // If not found in the database, try fetching from an external source (Flashscore)
  if (!event || event === "") {
    event = await EventById(eventId);

    // If still not found, return null
    if (!event || event === 404) return null;

    // Ensure required fields are included
    event.HEADER = event.HEADER || "Default Header"; // Provide a default value
    event.NAME = event.NAME || "Default Name"; // Provide a default value

    // Create a new event in the database
    event = await Event.create(event);
  }

  const currentTime = Math.floor(Date.now() / 1000);

  // Check if the event needs to be updated based on the lastUpdated timestamp
  if (
    !event.lastUpdated ||
    event.lastUpdated < currentTime - 45 * 60 ||
    !shortDTO
  ) {
    // Fetch the latest event details from the external source
    let newEvent = await EventById(eventId);

    // If the event was fetched but is marked as 404 or not found, set it as CANCELED
    if (newEvent === 404 || !newEvent) {
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

    // Validate and update event details
    newEvent = scorePartValidation(newEvent);

    // Process and update news, videos, and odds only if shortDTO is false
    if (!shortDTO) {
      const [news, videos] = await Promise.all([
        NewsByEventId(eventId).catch((error) =>
          console.error("Error fetching news:", error)
        ),
        VideosByEventId(eventId).catch((error) =>
          console.error("Error fetching videos:", error)
        ),
      ]);

      if (news) newEvent.NEWS = news;
      if (videos) newEvent.VIDEOS = videos;
      const [matchOdds] = await Promise.all([
        MatchOddsByEventId(eventId).catch((error) =>
          console.error("Error fetching match odds:", error)
        ),
      ]);

      if (matchOdds) {
        console.log("MatchOddsByEventId", matchOdds);
        newEvent.ODDS = matchOdds;
      } else {
        newEvent.ODDS = [];
      }
    }

    // Ensure required fields are included in the new event
    newEvent.EVENT_ID = eventId; // Assign the eventId to the new event object
    newEvent.lastUpdated = currentTime; // Update the lastUpdated timestamp

    // Save the new event to the database
    await Event.findOneAndUpdate({ EVENT_ID: eventId }, newEvent, {
      upsert: true, // Create a new document if it doesn't exist
      new: true, // Return the updated document
      setDefaultsOnInsert: true, // Apply default values when inserting
    });
    return newEvent;
  }

  // Return the found or updated event
  return event;
}

// getSearchEvents function
// getSearchEvents function
exports.getSearchEvents = async (req, res) => {
  const { search_text, sport, pageNo = 1, pageSize = 12 } = req.query;
  const page = parseInt(pageNo, 10);
  const size = parseInt(pageSize, 10);

  try {
    // Validate search_text
    if (!search_text || search_text.length < 4) {
      return res.status(400).json({
        status: "error",
        message: "Search text must be at least 4 characters long",
      });
    }

    // Escape special regex characters to prevent ReDoS attacks
    const escapedSearchText = search_text.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    // Build the regex
    const searchRegex = new RegExp(escapedSearchText, "i");

    // Build the query
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
        { START_UTIME: { $gt: Math.floor(Date.now() / 1000) } }, // Only future events
      ],
    };

    // Filter by sport if provided
    if (sport && sport !== "-1") {
      query.$and.push({ SPORT: parseInt(sport, 10) });
    }

    // Fields to select
    const fieldsToSelect = {
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
    };

    // Ensure indexes exist on the fields used in queries
    // Indexes should be created on START_UTIME, SPORT, and fields used in the $or condition

    // Perform the query and count in parallel
    const [events, totalItems] = await Promise.all([
      Event.find(query)
        .select(fieldsToSelect)
        .sort({ START_UTIME: 1 })
        .skip((page - 1) * size)
        .limit(size)
        .lean(), // Use lean for better performance
      Event.countDocuments(query),
    ]);

    if (events.length === 0) {
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
    console.error("Error in getSearchEvents:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};
