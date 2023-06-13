// const ck = require('ckey');

// const mongoose = require('mongoose');
const Event = require("../models/eventModel");
const { EventById } = require("../flashLive/EventById");

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
      },
    },
    {
      $group: {
        _id: "$COUNTRY_ID",
        countryName: { $first: "$COUNTRY_NAME" },
        League: {
          $addToSet: {
            Id: "$TOURNAMENT_ID",
            name: "$NAME_PART_2",
            category: "$CATEGORY_NAME",
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
    data: tournamentList[0].League,
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
  const { eventId } = req.params;

  const event = await Event.findOne({ EVENT_ID: eventId }).lean();

  // No event found
  if (!event) {
    return res.status(404).json({
      status: "Not Found",
      message: "Event not found",
    });
  }

  const currentTime = Math.floor(Date.now() / 1000);

  // Event needs to be updated
  if (
    currentTime > event.START_UTIME &&
    (!event.lastUpdated || event.lastUpdated < currentTime - 5 * 60) &&
    !event.WINNER
  ) {
    try {
      const newEvent = await EventById(eventId);
      const updatedEvent = await Event.findOneAndUpdate(
        { EVENT_ID: event.EVENT_ID },
        newEvent,
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

      // Remove unwanted keys
      if (updatedEvent) {
        updatedEvent._id = undefined;
        updatedEvent.__v = undefined;
      }

      console.log("Updated or created event:", updatedEvent);
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

  // Remove unwanted keys
  event._id = undefined;
  event.__v = undefined;

  return res.status(200).json({
    status: "success getEventById",
    data: event,
  });
};

exports.getCountries = async (req, res) => {
  const { sportId } = req.params;

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
        CountryName: "$_id", // Rename the _id field to Country
        CountryId: "$countryId", // Include the CountryId field
      },
    },
    { $sort: { CountryName: 1 } },
  ]);

  res.status(200).json({
    status: "success getCountries",
    data: countriesList,
  });
};

exports.getCountriesBySport = async (req, res) => {
  const sportId = Number(req.params.sportId);
  const days = Number(req.params.days);

  const secondsInADay = 86400; // Number of seconds in a day (24 * 60 * 60)
  const currentTime = Math.floor(Date.now() / 1000);
  const timeCutOff = currentTime - days * secondsInADay;

  console.log("sportId", sportId);
  console.log("sportId", typeof sportId);
  const countriesList = await Event.aggregate([
    {
      $lookup: {
        from: "sports",
        localField: "SPORT",
        foreignField: "ID",
        as: "sport",
      },
    },
    { $unwind: "$sport" },
    {
      $match: {
        "sport.ID": sportId, // Added condition
        "sport.AVAILABLE": true,
        START_UTIME: { $gt: timeCutOff },
      },
    },
    {
      $group: {
        _id: "$NAME_PART_1",
        countryId: { $first: "$COUNTRY_ID" },
      },
    },
    {
      $project: {
        _id: 0,
        CountryName: "$_id",
        CountryId: "$countryId",
      },
    },
    { $sort: { CountryName: 1 } },
  ]);
  console.log("countriesList.length", countriesList.length);

  res.status(200).json({
    status: "success getCountries",
    data: countriesList,
  });
};
