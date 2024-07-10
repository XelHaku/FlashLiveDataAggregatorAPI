const Event = require("../models/eventModel");
const { EventById } = require("../flashLive/EventById");
const { NewsByEventId } = require("../flashLive/NewsByEventId");
const { VideosByEventId } = require("../flashLive/VideosByEventId");
const { scorePartValidation } = require("../flashLive/scorePartValidation");
const NewsModel = require("../models/newsModel"); // Import the News model you created
const pageSize = 12;
// getEvents function
exports.getEvents = async (req, res) => {
  const {
    id,
    tournament,
    sport = "-1",
    country,
    pageNo,
    sort = "asc",
    pageSize = 12,
  } = req.query;
  const page = pageNo ? parseInt(pageNo) : 1; // Default to page 1 if pageNo is not provided
  const size = parseInt(pageSize);
  const skip = (page - 1) * size; // Calculate the number of items to skip

  // Define the sort order
  const sortOrder = sort.toLowerCase() === "desc" ? -1 : 1;

  try {
    let eventsList, totalItems;

    // Modify each condition to include pagination using limit, skip, and sort
    if (tournament) {
      const result = await getEventsByTournament(
        tournament,
        skip,
        size,
        sortOrder
      );
      eventsList = result.events;
      totalItems = result.totalCount;
    } else if (id) {
      const idArray = Array.isArray(id) ? id : [id];
      const result = await getEventsByList(idArray, skip, size, sortOrder);
      eventsList = result.events;
      totalItems = result.totalCount;
    } else if (sport) {
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

    if (!eventsList || eventsList.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No events found",
      });
    }

    const totalPages = Math.ceil(totalItems / size);

    res.status(200).json({
      status: "success",
      data: eventsList,
      pagination: {
        currentPage: page,
        pageSize: size,
        totalItems,
        totalPages,
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

async function getEventsByList(ids, skip, size, sortOrder) {
  console.log("getEventsByList");

  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) {
    if (typeof ids === "string") {
      ids = [ids];
    } else {
      throw new Error("Invalid event ID list - must be an array of strings");
    }
  }

  try {
    // Fetch and update each event by its ID
    const events = await Promise.all(ids.map(updateEvent));
    // Filter out null events
    const eventsList = events.filter((event) => event !== null);
    const totalCount = eventsList.length;

    // Sort the filtered events list
    eventsList.sort((a, b) => (a.START_UTIME > b.START_UTIME ? sortOrder : -sortOrder));

    // Apply pagination manually since the eventsList is already filtered
    const paginatedEvents = eventsList.slice(skip, skip + size);

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
 * @returns {Object | null} - The updated event object or null if not found.
 */
async function updateEvent(eventId) {
  // Attempt to find the event in the database
  let event = await Event.findOne({ EVENT_ID: eventId }).lean();

  // If not found in the database, try fetching from an external source (Flashscore)
  if (!event || event === "") {
    event = await EventById(eventId);
    // If still not found, return null
    if (!event || event === 404) return null;
    // Ensure required fields are included
    if (!event.HEADER) event.HEADER = "Default Header"; // Provide a default value or fetch it appropriately
    if (!event.NAME) event.NAME = "Default Name"; // Provide a default value or fetch it appropriately

    // If found, create a new event in the database
    event = await Event.create(event);
  }

  const currentTime = Math.floor(Date.now() / 1000);

  // Check if the event needs to be updated based on the lastUpdated timestamp
  if (!event.lastUpdated || event.lastUpdated < currentTime - 10 * 60) {
    // Fetch the latest event details from an external source
    let newEvent = await EventById(eventId);

    // Handle cases where the event is not found or marked as cancelled
    if (newEvent === 404 || !newEvent) {
      // Update the existing event to indicate it is cancelled if not found
      await Event.findOneAndUpdate(
        { EVENT_ID: eventId },
        { STAGE_TYPE: "CANCELLED", STAGE: "CANCELLED" },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );
      return null;
    }

    newEvent = scorePartValidation(newEvent);

    // Process and update news and videos
    const [news, videos] = await Promise.all([
      NewsByEventId(eventId).catch((error) =>
        console.error("Error fetching news:", error)
      ),
      VideosByEventId(eventId).catch((error) =>
        console.error("Error fetching Video:", error)
      ),
    ]);

    if (news) newEvent.NEWS = news;
    if (videos) newEvent.VIDEOS = videos;

    // Update the event in the database with the new data
    await Event.findOneAndUpdate({ EVENT_ID: eventId }, newEvent, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
  }

  return event;
}