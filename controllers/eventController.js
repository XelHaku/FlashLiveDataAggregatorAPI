// const ck = require('ckey');

// const mongoose = require('mongoose');
const Event = require("../models/eventModel");
const { EventById } = require("../flashLive/EventById");
const { NewsByEventId } = require("../flashLive/NewsByEventId");
const { VideosByEventId } = require("../flashLive/VideosByEventId");
const { scorePartValidation } = require("../flashLive/scorePartValidation");
const NewsModel = require("../models/newsModel"); // Import the News model you created

exports.getTournaments = async (req, res) => {
  const { sportId } = req.params;
  const { days } = req.params;

  const secondsInADay = 86400; // Number of seconds in a day (24 * 60 * 60)
  const currentTime = Math.floor(Date.now() / 1000);
  const timeCutOff = currentTime - days * secondsInADay;

  // const a = await Event.find();
  const tournamentList = await Event.aggregate([
    {
      $match: { SPORT: { $eq: sportId * 1 }, START_UTIME: { $gt: timeCutOff } },
    },
    {
      $group: {
        _id: "$COUNTRY_ID",
        countryName: { $first: "$COUNTRY_NAME" }, // Added this line
        League: {
          $addToSet: {
            Id: "$TOURNAMENT_ID",
            name: "$NAME_PART_2",
            category: "$CATEGORY_NAME",
            // country: '$COUNTRY_NAME',
          },
        },
        count: { $sum: 1 }, // Moved the count field outside of the combinedColumns object
      },
    },
    {
      $project: {
        _id: 0, // Exclude the _id field
        CountryId: "$_id", // Rename the _id field to HEADER
        countryName: 1,
        League: 1, // Include the combinedColumns field
      },
    },
    { $sort: { Country: 1 } },
  ]);
  res.status(200).json({
    status: "success getTournaments",
    data: tournamentList,
  });
};

exports.getTournamentsByCountry = async (req, res) => {
  const sportId = Number(req.params.sportId);
  const countryId = Number(req.params.countryId);
  const days = Number(req.params.days);

  const secondsInADay = 86400; // Number of seconds in a day (24 * 60 * 60)
  const currentTime = Math.floor(Date.now() / 1000);
  const timeCutOff = currentTime - days * secondsInADay;

  const tournamentList = await Event.aggregate([
    {
      $match: {
        SPORT: { $eq: sportId },
        COUNTRY_ID: { $eq: countryId }, // Include COUNTRY_ID in the match query
        START_UTIME: { $gt: timeCutOff },
        TOURNAMENT_ID: { $ne: "0" },
      },
    },
    {
      $group: {
        _id: "$COUNTRY_ID",
        countryName: { $first: "$CATEGORY_NAME" },
        League: {
          $addToSet: {
            tournamentId: "$TOURNAMENT_ID",
            tournamentName: "$NAME_PART_2",
            countryName: "$CATEGORY_NAME",
            countryId: "$COUNTRY_ID",
            sportId: "$SPORT",
          },
        },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        CountryId: "$_id",
        countryName: 1,
        League: 1,
      },
    },
    { $sort: { Country: 1 } },
  ]);
  let data = [];
  if (tournamentList.length > 0) {
    data = tournamentList[0].League;
  }
  console.log("Ligas ", data);
  console.log("Ligas ", data.length);
  res.status(200).json({
    status: "success getTournamentsByCountry",
    data: data,
  });
};

/**
 * Fetches events by a given tournament and within a specified time range.
 * 
 * @param {Object} req - The request object. It should contain:
 *  - `params.tournamentId` (string): The ID of the desired tournament.
 *  - `params.days` (number): The number of days to look back from the current date.
 * @param {Object} res - The response object.
 * @returns {Object} - Response with the events list.
 */
exports.getEventsByTournament = async (req, res) => {
  // Extract tournamentId and days from request parameters
  const { tournamentId, days } = req.params;

  // Constants
  const SECONDS_IN_A_DAY = 86400;  // Number of seconds in a day
  const currentTime = Math.floor(Date.now() / 1000);
  const timeCutOff = currentTime - days * SECONDS_IN_A_DAY;

  // Fetch events that match the criteria
  let eventsList = await Event.aggregate([
      {
          $match: {
              TOURNAMENT_ID: tournamentId,
              START_UTIME: { $gt: timeCutOff }
          }
      }
  ]);

  // Remove unwanted fields from each event
  eventsList = eventsList.map(event => {
      delete event._id;
      delete event.__v;
      return event;
  });

  // Send the response
  res.status(200).json({
      status: "success getEventsByTournament",
      data: eventsList
  });
};

/**
 * Fetches a single event by its ID.
 * If not found in the database, attempts to find it in an external source (Flashscore).
 * Updates the event if certain conditions are met.
 *
 * @param {Object} req - The request object. Expected to contain:
 *  - `params.eventId` (string): The ID of the desired event.
 * @param {Object} res - The response object.
 * @returns {Object} - Response with the event data.
 */
exports.getEventById = async (req, res) => {
  const { eventId } = req.params;

  // Fetch event from database
  let event = await Event.findOne({ EVENT_ID: eventId }).lean();

  // If not found in database, attempt to fetch from Flashscore
  if (!event) {
      event = await EventById(eventId);
      if (!event) {
          return res.status(404).json({
              status: "Not Found in Database nor Flashscore",
              message: "Event not found",
          });
      }

      // Insert the newly fetched event into the database
      await Event.findOneAndUpdate(
          { EVENT_ID: eventId },
          event,
          {
              upsert: true,
              new: true,
              setDefaultsOnInsert: true,
          }
      );
  }

  const currentTime = Math.floor(Date.now() / 1000);

  // Check if event needs to be updated (based on lastUpdated time)
  if (!event.lastUpdated || event.lastUpdated < currentTime - 10 * 60) {
      try {
          let newEvent = await EventById(eventId);
          if (newEvent == 404) {
              newEvent = { ...event, STAGE_TYPE: "CANCELLED", STAGE: "CANCELLED" };
          } else if (!newEvent) {
              return res.status(500).json({
                  status: "error",
                  message: "Event not found on Flashscore",
              });
          }
          newEvent = scorePartValidation(newEvent);

          // Fetch additional details for the event
          const [news, videos] = await Promise.all([
              NewsByEventId(eventId).catch(error => { console.error("Error fetching news:", error); return null; }),
              VideosByEventId(eventId).catch(error => { console.error("Error fetching Video:", error); return null; })
          ]);

          if (news && Array.isArray(news)) {
              const enrichedNews = news.map(item => ({
                  ...item,
                  SPORT: event.SPORT,
                  TOURNAMENT_ID: event.TOURNAMENT_ID,
                  COUNTRY_ID: event.COUNTRY_ID,
                  EVENT_ID: eventId,
              }));

              for (let newsItem of enrichedNews) {
                  await NewsModel.updateOne(
                      { ID: newsItem.ID },
                      { $set: newsItem },
                      { upsert: true }
                  );
              }
              newEvent.NEWS = enrichedNews;
          }

          if (videos) {
              newEvent.VIDEOS = videos;
          }

          // Update the event in the database
          const updatedEvent = await Event.findOneAndUpdate(
              { EVENT_ID: eventId },
              newEvent,
              {
                  upsert: true,
                  new: true,
                  setDefaultsOnInsert: true,
              }
          );

          // Remove unwanted keys
          updatedEvent._id = undefined;
          updatedEvent.__v = undefined;

          return res.status(200).json({
              status: "success getEventById",
              data: updatedEvent,
          });
      } catch (error) {
          console.error("Error updating event:", error);
          return res.status(500).json({
              status: "error",
              message: "Error updating event",
          });
      }
  }

  // Remove unwanted keys from the event object
  event._id = undefined;
  event.__v = undefined;

  return res.status(200).json({
      status: "success getEventById",
      data: event,
  });
};


exports.getUpcomingEventsBySportId = async (req, res) => {
  const { sportId } = req.params;
  const currentTime = Math.floor(Date.now() / 1000);

  try {
    // Query the database to find the first 100 youngest upcoming events for the given sportId and within the specified time range.
    // Using .lean() to get a plain JavaScript object instead of a Mongoose document for better performance.
    const upcomingEvents = await Event.find({
      SPORT: sportId,
      START_UTIME: { $gt: currentTime }, // Filter events with start time within the future time range.
    })
      .sort({ START_UTIME: 1 }) // Sort events in ascending order of START_UTIME
      .limit(200) // Limit the number of results to 100
      .lean();

    // If no upcoming events are found, return a 404 Not Found response.
    if (upcomingEvents.length === 0) {
      return res.status(404).json({
        status: "Not Found",
        message: "No upcoming events found for the specified sportId",
      });
    }

    // Remove unwanted keys from the upcoming events array.
    const cleanedUpcomingEvents = upcomingEvents.map((event) => {
      event._id = undefined;
      event.__v = undefined;
      return event;
    });

    console.log("Upcoming events:", cleanedUpcomingEvents);

    // Return a 200 success response with the upcoming events data.
    return res.status(200).json({
      status: "success getUpcomingEventsBySportId",
      data: cleanedUpcomingEvents,
    });
  } catch (error) {
    // If there's an error during the query process, return a 500 internal server error response.
    console.error("Error fetching upcoming events:", error);
    return res.status(500).json({
      status: "error",
      message: "Error fetching upcoming events",
    });
  }
};

exports.getUpcomingEventsBySportIdAndCountryId = async (req, res) => {
  const { sportId, countryId } = req.params;
  const currentTime = Math.floor(Date.now() / 1000);

  try {
    // Query the database to find the first 100 youngest upcoming events for the given sportId, countryId, and within the specified time range.
    // Using .lean() to get a plain JavaScript object instead of a Mongoose document for better performance.
    const upcomingEvents = await Event.find({
      SPORT: sportId,
      COUNTRY_ID: countryId,
      START_UTIME: { $gt: currentTime }, // Filter events with start time within the future time range.
    })
      .sort({ START_UTIME: 1 }) // Sort events in ascending order of START_UTIME
      .limit(100) // Limit the number of results to 100
      .lean();

    // If no upcoming events are found, return a 404 Not Found response.
    if (upcomingEvents.length === 0) {
      return res.status(404).json({
        status: "Not Found",
        message:
          "No upcoming events found for the specified sportId and countryId",
      });
    }

    // Remove unwanted keys from the upcoming events array.
    const cleanedUpcomingEvents = upcomingEvents.map((event) => {
      event._id = undefined;
      event.__v = undefined;
      return event;
    });

    console.log("Upcoming events:", cleanedUpcomingEvents);

    // Return a 200 success response with the upcoming events data.
    return res.status(200).json({
      status: "success getUpcomingEventsBySportIdAndCountryId",
      data: cleanedUpcomingEvents,
    });
  } catch (error) {
    // If there's an error during the query process, return a 500 internal server error response.
    console.error("Error fetching upcoming events:", error);
    return res.status(500).json({
      status: "error",
      message: "Error fetching upcoming events",
    });
  }
};

exports.getCountries = async (req, res) => {
  // const { sportId } = req.params;

  const countriesList = await Event.aggregate([
    {
      $lookup: {
        from: "sports", // Specify the collection to join with (use the correct name for your Sport collection)
        localField: "SPORT", // The field from the Event collection
        foreignField: "ID", // The field from the Sport collection
        as: "sport", // The alias for the joined data
      },
    },
    { $unwind: "$sport" }, // Flatten the joined data
    { $match: { "sport.AVAILABLE": true } },
    {
      $group: {
        _id: "$NAME_PART_1",
        countryId: { $first: "$COUNTRY_ID" }, // Add the field COUNTRY_ID
      },
    },
    {
      $project: {
        _id: 0, // Exclude the _id field
        countryName: "$_id", // Rename the _id field to Country
        countryId: "$countryId", // Include the CountryId field
      },
    },
    { $sort: { countryName: 1 } },
  ]);

  res.status(200).json({
    status: "success getCountries",
    data: countriesList,
  });
};

exports.getCountriesWithUpcomingEvents = async (req, res) => {
  const { sportId } = req.params;
  const currentTime = Math.floor(Date.now() / 1000);
  console.log("sportId", sportId);
  const countriesList = await Event.aggregate([
    {
      $match: {
        SPORT: Number(sportId), // Filter events for the specified sportId
        START_UTIME: { $gt: currentTime }, // Filter events with start time within the future time range.
      },
    },
    {
      $group: {
        _id: "$COUNTRY_ID",
        countryName: { $first: "$NAME_PART_1" }, // Add the field NAME_PART_1 as countryName
        eventCount: { $sum: 1 }, // Count the number of events for each country
        tournaments: {
          $addToSet: {
            tournamentId: "$TOURNAMENT_ID",
            tournamentImage: "$TOURNAMENT_IMAGE",
            name: "$SHORT_NAME",
          },
        },
      },
    },
    {
      $project: {
        _id: 0, // Exclude the _id field
        countryName: "$countryName", // Include the countryName field
        countryId: "$_id", // Rename the _id field to countryId
        eventCount: "$eventCount", // Include the eventCount field
        tournaments: "$tournaments", // Include the tournaments field
      },
    },
    { $sort: { countryName: 1 } },
  ]);

  res.status(200).json({
    status: "success getCountriesWithUpcomingEvents",
    data: countriesList,
  });
};

exports.getRecentNews = async (req, res) => {
  try {
    // Calculate the timestamp for 24 hours ago
    const oneDayAgo = Math.floor(Date.now() / 1000) - 24 * 60 * 60;

    // Fetch events from the last 24 hours
    const events = await Event.find({
      START_UTIME: { $gte: oneDayAgo },
    }).lean();

    let allNews = [];

    // Extract recent news from these events
    for (let event of events) {
      if (event.NEWS && Array.isArray(event.NEWS)) {
        const recentNews = event.NEWS.filter(
          (news) => news.PUBLISHED >= oneDayAgo
        );
        allNews.push(...recentNews);
      }
    }

    // Sort news based on the PUBLISHED timestamp in descending order
    allNews.sort((a, b) => b.PUBLISHED - a.PUBLISHED);

    // Return the sorted news as a response
    return res.status(200).json({
      status: "success",
      data: allNews,
    });
  } catch (error) {
    console.error("Error fetching recent news:", error);
    return res.status(500).json({
      status: "error",
      message: "Error fetching recent news",
    });
  }
};
