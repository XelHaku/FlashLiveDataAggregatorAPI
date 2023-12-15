// const ck = require('ckey');

// const mongoose = require('mongoose');
const Event = require("../models/eventModel");
const { EventById } = require("../flashLive/EventById");
const { NewsByEventId } = require("../flashLive/NewsByEventId");
const { VideosByEventId } = require("../flashLive/VideosByEventId");
const { scorePartValidation } = require("../flashLive/scorePartValidation");
const NewsModel = require("../models/newsModel"); // Import the News model you created

exports.getCountries = async (req, res) => {
  const { sport } = req.query; // Retrieve sport from query parameters
  const currentTime = Math.floor(Date.now() / 1000);

  let matchCondition = { START_UTIME: { $gt: currentTime } };
  if (sport !== undefined) {
    matchCondition.SPORT = Number(sport); // Filter by sport if provided
  }

  try {
    const countriesList = await Event.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: "$COUNTRY_ID",
          countryName: { $first: "$NAME_PART_1" },
          eventCount: { $sum: 1 },
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
          _id: 0,
          countryName: 1,
          countryId: "$_id",
          eventCount: 1,
          tournaments: 1,
        },
      },
      { $sort: { countryName: 1 } },
    ]);

    res.status(200).json({
      status: "success getCountriesWithUpcomingEvents",
      data: countriesList,
    });
  } catch (error) {
    console.error("Error in getCountriesWithUpcomingEvents: ", error);
    res.status(500).json({
      status: "error",
      message: "Error fetching countries with upcoming events",
    });
  }
};
