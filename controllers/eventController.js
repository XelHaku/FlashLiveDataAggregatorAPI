// const ck = require('ckey');

// const mongoose = require('mongoose');
const Event = require("../models/eventModel");
const { EventById } = require("../flashLive/EventById");
const { NewsByEventId } = require("../flashLive/NewsByEventId");
const { VideosByEventId } = require("../flashLive/VideosByEventId");
const { scorePartValidation } = require("../flashLive/scorePartValidation");
const NewsModel = require("../models/newsModel"); // Import the News model you created
const pageSize = 12;
// getEvents function
exports.getEvents = async (req, res) => {
  const { id, tournament, sport, country } = req.query;

  try {
    let eventsList;

    if (tournament) {
      eventsList = await getEventsByTournament(tournament);
    } else if (sport) {
      eventsList = country
        ? await getEventsBySportAndCountry(sport, country)
        : await getEventsBySport(sport);
    } else if (id) {
      // Ensure that 'id' is an array or convert it to an array
      const idArray = Array.isArray(id) ? id : [id];
      eventsList = await getEventsByList(idArray);
    }

    if (!eventsList || eventsList.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No events found",
      });
    }

    // Clean up the events list by removing unwanted fields
    if (typeof id !== "string" || !id) {
      eventsList = eventsList.map((event) => {
        const {
          _id,
          __v,
          VIDEOS,
          NEWS,
          HEADER,
          HOME_EVENT_PARTICIPANT_ID,
          URL,
          ...rest
        } = event;
        return rest;
      });
    }
    res.status(200).json({
      status: "success",
      data: eventsList,
    });
  } catch (error) {
    console.error("Error in getEvents:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

async function getEventsByTournament(tournament) {
  try {
    // Constants
    const currentTime = Math.floor(Date.now() / 1000);

    // Fetch events that match the criteria
    const eventsList = await Event.aggregate([
      {
        $match: {
          TOURNAMENT_ID: tournament,
          START_UTIME: { $gt: currentTime },
        },
      },
      {
        $project: {
          _id: 0, // Exclude the _id and __v fields from the output
          __v: 0,
          // Add other fields you want to include in your response
        },
      },
    ])
      .limit(100)
      .lean();

    // Return eventsList or an empty array if no events are found
    return eventsList.length > 0 ? eventsList : [];
  } catch (error) {
    console.error("Error in getEventsByTournament:", error);
    throw error; // Rethrow the error to be handled by the caller
  }
}

async function getEventsBySport(sport) {
  try {
    const currentTime = Math.floor(Date.now() / 1000);

    // Fetch the upcoming events for the given sport
    const upcomingEvents = await Event.find({
      SPORT: sport,
      START_UTIME: { $gt: currentTime },
    })
      .sort({ START_UTIME: 1 })
      .limit(100)
      .select("-_id -__v") // Exclude _id and __v from the output
      .lean();

    // Return an empty array if no events are found
    return upcomingEvents.length > 0 ? upcomingEvents : [];
  } catch (error) {
    console.error("Error in getEventsBySport:", error);
    throw error; // Rethrow the error to be handled by the caller
  }
}
async function getEventsBySportAndCountry(sport, country) {
  try {
    const currentTime = Math.floor(Date.now() / 1000);

    // Fetch the upcoming events for the given sport and country
    const upcomingEvents = await Event.find({
      SPORT: sport,
      COUNTRY_ID: country,
      START_UTIME: { $gt: currentTime },
    })
      .sort({ START_UTIME: 1 })
      .limit(100)
      .select("-_id -__v") // Exclude _id and __v from the output
      .lean();

    // Return an empty array if no events are found
    return upcomingEvents.length > 0 ? upcomingEvents : [];
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
    return events.filter((event) => event !== null);
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

// UTILS
getEventsByTournament = async (tournament, res) => {
  console.log("getEventsByTournament");
  // Extract tournament and days from request parameters
  try {
    // Constants
    const SECONDS_IN_A_DAY = 86400; // Number of seconds in a day
    const currentTime = Math.floor(Date.now() / 1000);

    // Fetch events that match the criteria
    let eventsList = await Event.aggregate([
      {
        $match: {
          TOURNAMENT_ID: tournament,
          START_UTIME: { $gt: currentTime },
        },
      },
    ]);

    // Remove unwanted fields from each event
    eventsList = eventsList.map((event) => {
      delete event._id;
      delete event.__v;
      return event;
    });

    return eventsList;
  } catch (error) {
    return false;
  }
};
