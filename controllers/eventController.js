// const ck = require('ckey');

// const mongoose = require('mongoose');
const Event = require("../models/eventModel");
const { EventById } = require("../flashLive/EventById");
const { NewsByEventId } = require("../flashLive/NewsByEventId");
const { VideosByEventId } = require("../flashLive/VideosByEventId");
const { scorePartValidation } = require("../flashLive/scorePartValidation");

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

exports.getEventsByTournament = async (req, res) => {
  const { tournamentId } = req.params;
  const { days } = req.params;

  const secondsInADay = 86400; // Number of seconds in a day (24 * 60 * 60)
  const currentTime = Math.floor(Date.now() / 1000);
  const timeCutOff = currentTime - days * secondsInADay;

  // const a = await Event.find();
  let eventsList = await Event.aggregate([
    {
      $match: {
        TOURNAMENT_ID: tournamentId,
        START_UTIME: { $gt: timeCutOff },
      },
    },
  ]);

  eventsList = eventsList.map((sport) => {
    delete sport._id;
    delete sport.__v;
    return sport;
  });
  res.status(200).json({
    status: "success getEventsByTournament",
    data: eventsList,
  });
};

exports.getEventById = async (req, res) => {
  const { eventId } = req.params; // Extract the eventId from the request parameters.
  console.log("eventId", eventId);

  // Query the database to find the event with the given eventId.
  // Using .lean() to get a plain JavaScript object instead of a Mongoose document for better performance.
  let event = await Event.findOne({ EVENT_ID: eventId }).lean();

  // If no event is found with the given ID, return a 404 Not Found response.
  if (!event) {
    event = await EventById(eventId);
    event.lastUpdated = 0;
    if (!event) {
      return res.status(404).json({
        status: "Not Found",
        message: "Event not found",
      });
    } else {
      const updatedEvent = await Event.findOneAndUpdate(
        { EVENT_ID: event.EVENT_ID },
        event,
        {
          upsert: true, // Create a new document if no matching document is found.
          new: true, // Return the updated document after the update operation.
          setDefaultsOnInsert: true, // Set default values if a new document is created.
        }
      );

      // Remove unwanted keys from the updated event object.
      if (updatedEvent) {
        updatedEvent._id = undefined;
        updatedEvent.__v = undefined;
      }
    }
  }

  // Get the current time in seconds.
  const currentTime = Math.floor(Date.now() / 1000);

  // Check if the event needs to be updated based on the following conditions:
  // 1. If the current time is greater than the event's start time (START_UTIME).
  // 2. If the event has not been updated in the last 5 minutes (lastUpdated < currentTime - 5 * 60).
  // 3. If the event has no winner (WINNER is not defined).

  // if (
  //   currentTime > event.START_UTIME &&
  console.log(
    "event.lastUpdated < currentTime - 5 * 60",
    event.lastUpdated < currentTime - 5 * 60
  );
  if (!event.lastUpdated || event.lastUpdated > currentTime - 10 * 60) {
    try {
      // Fetch updated event data from an external source using the EventById function.
      let newEvent = await EventById(eventId);

      if (newEvent == 404) {
        newEvent = event;
        newEvent.STAGE_TYPE = "CANCELLED";
        newEvent.STAGE = "CANCELLED";
        // newEvent.STAGE = "CANCELLED";
      } else if (!newEvent) {
        return res.status(500).json({
          status: "error",
          message: "Event not found on Flashscore",
        });
      }
      // console.log(newEvent);
      newEvent = scorePartValidation(newEvent);
      let news = null;
      let Videos = null;

      try {
        news = await NewsByEventId(eventId);
      } catch (error) {
        console.error("Error fetching news:", error);
      }

      // Add news as a new property to newEvent
      if (news) {
        newEvent.NEWS = news;
      }

      try {
        Videos = await VideosByEventId(eventId);
      } catch (error) {
        console.error("Error fetching Video:", error);
      }

      // Add Video as a new property to newEvent
      if (Videos) {
        newEvent.VIDEOS = Videos;
      }

      // console.log(newEvent);
      // Update the event data in the database using findOneAndUpdate method.
      const updatedEvent = await Event.findOneAndUpdate(
        { EVENT_ID: event.EVENT_ID },
        newEvent,
        {
          upsert: true, // Create a new document if no matching document is found.
          new: true, // Return the updated document after the update operation.
          setDefaultsOnInsert: true, // Set default values if a new document is created.
        }
      );

      // Remove unwanted keys from the updated event object.
      if (updatedEvent) {
        updatedEvent._id = undefined;
        updatedEvent.__v = undefined;
      }

      console.log("Updated or created event:", updatedEvent);

      // Return a 200 success response with the updated event data.
      return res.status(200).json({
        status: "success getEventById",
        data: updatedEvent,
      });
    } catch (error) {
      // If there's an error during the update process, return a 500 internal server error response.
      console.error("Error updating event:", error);
      return res.status(500).json({
        status: "error",
        message: "Error updating event",
      });
    }
  }

  // Remove unwanted keys from the event object before returning it.
  event._id = undefined;
  event.__v = undefined;

  // If the event doesn't need to be updated, return a 200 success response with the event data.
  return res.status(200).json({
    status: "success getEventById",
    data: event,
  });
};
// eventController.js

// Import necessary modules and models

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
