const Event = require("../models/eventModel");
const { EventById } = require("../flashLive/EventById");
const { NewsByEventId } = require("../flashLive/NewsByEventId");
const { VideosByEventId } = require("../flashLive/VideosByEventId");
const { scorePartValidation } = require("../flashLive/scorePartValidation");
const NewsModel = require("../models/newsModel"); // Import the News model you created
const pageSize = 12;
// getEvents function
exports.getEvents = async (req, res) => {
  const { id, tournament, sport, country, pageNo, pageSize = 12 } = req.query;
  const page = pageNo ? parseInt(pageNo) : 1; // Default to page 1 if pageNo is not provided
  const size = parseInt(pageSize);
  const skip = (page - 1) * size; // Calculate the number of items to skip

  try {
    let eventsList, totalItems;

    // Modify each condition to include pagination using limit and skip
    if (tournament) {
      const result = await getEventsByTournament(tournament, skip, size);

      eventsList = result.events;
      totalItems = result.totalCount;
    } else if (sport) {
      const result = country
        ? await getEventsBySportAndCountry(sport, country, skip, size)
        : await getEventsBySport(sport, skip, size);
      eventsList = result.events;
      totalItems = result.totalCount;
    } else if (id) {
      const idArray = Array.isArray(id) ? id : [id];
      const result = await getEventsByList(idArray, skip, size);
      eventsList = result.events;
      totalItems = result.totalCount;
    }

    if (!eventsList || eventsList.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No events found",
      });
    }

    // Clean up the events list
    // ... (existing code for cleanup)

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
getEventsByTournament = async (tournament, skip, size) => {
  console.log("getEventsByTournament");
  try {
    const SECONDS_IN_A_DAY = 86400; // Number of seconds in a day
    const currentTime = Math.floor(Date.now() / 1000);

    // Fetch events that match the criteria and apply pagination
    let eventsList = await Event.aggregate([
      {
        $match: {
          TOURNAMENT_ID: tournament,
          START_UTIME: { $gt: currentTime },
        },
      },
      { $skip: skip },
      { $limit: size },
      // You can add a $project stage here to remove unwanted fields, if needed
    ]);

    // Get total count of matching events for pagination
    const totalCount = await Event.countDocuments({
      TOURNAMENT_ID: tournament,
      START_UTIME: { $gt: currentTime },
    });

    return [eventsList, totalCount];
  } catch (error) {
    console.error("Error in getEventsByTournament:", error);
    return [false, 0];
  }
};

async function getEventsBySport(sport, skip, size) {
  try {
    const currentTime = Math.floor(Date.now() / 1000);

    // Fetch the upcoming events for the given sport with pagination
    const upcomingEvents = await Event.find({
      SPORT: sport,
      START_UTIME: { $gt: currentTime },
    })
      .sort({ START_UTIME: 1 })
      .skip(skip)
      .limit(size)
      .select("-_id -__v") // Exclude _id and __v from the output
      .lean();

    // Get total count of matching events for pagination
    const totalCount = await Event.countDocuments({
      SPORT: sport,
      START_UTIME: { $gt: currentTime },
    });

    return { events: upcomingEvents, totalCount };
  } catch (error) {
    console.error("Error in getEventsBySport:", error);
    throw error; // Rethrow the error to be handled by the caller
  }
}

async function getEventsBySportAndCountry(sport, country, skip, size) {
  try {
    const currentTime = Math.floor(Date.now() / 1000);

    // Fetch the upcoming events for the given sport and country with pagination
    const upcomingEvents = await Event.find({
      SPORT: sport,
      COUNTRY_ID: country,
      START_UTIME: { $gt: currentTime },
    })
      .sort({ START_UTIME: 1 })
      .skip(skip)
      .limit(size)
      .select("-_id -__v") // Exclude _id and __v from the output
      .lean();

    // Get total count of matching events for pagination
    const totalCount = await Event.countDocuments({
      SPORT: sport,
      COUNTRY_ID: country,
      START_UTIME: { $gt: currentTime },
    });

    return { events: upcomingEvents, totalCount };
  } catch (error) {
    console.error("Error in getEventsBySportAndCountry:", error);
    throw error; // Rethrow the error to be handled by the caller
  }
}
async function getEventsByList(ids) {
  console.log("getEventsByList");

  // Validate ids
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

    return { events: eventsList, totalCount };
  } catch (error) {
    console.error("Error in getEventsByList:", error);
    throw error; // Rethrow the error to be handled by the caller
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

getEventsByTournament = async (tournament, skip, size) => {
  console.log("getEventsByTournament");
  try {
    const SECONDS_IN_A_DAY = 86400; // Number of seconds in a day
    const currentTime = Math.floor(Date.now() / 1000);

    // Fetch events that match the criteria and apply pagination
    let eventsList = await Event.aggregate([
      {
        $match: {
          TOURNAMENT_ID: tournament,
          START_UTIME: { $gt: currentTime },
        },
      },
      { $skip: skip },
      { $limit: size },
      // You can add a $project stage here to remove unwanted fields, if needed
    ]);

    // Get total count of matching events for pagination
    const totalCount = await Event.countDocuments({
      TOURNAMENT_ID: tournament,
      START_UTIME: { $gt: currentTime },
    });

    return { events: eventsList, totalCount };
  } catch (error) {
    console.error("Error in getEventsByTournament:", error);
    return [false, 0];
  }
};
