// const ck = require('ckey');

// const mongoose = require('mongoose');
// const { EventById } = require("../flashLive/EventById");
// const { NewsByEventId } = require("../flashLive/NewsByEventId");
// const { VideosByEventId } = require("../flashLive/VideosByEventId");
// const { scorePartValidation } = require("../flashLive/scorePartValidation");
const NewsModel = require("../models/newsModel"); // Import the News model you created

exports.getNews = async (req, res) => {
  try {
    const allNews = await NewsModel.find(); // Fetch all news from the database
    res.status(200).json({
      status: "success getNews",
      data: allNews,
    });
  } catch (error) {
    console.error("Error fetching news:", error);
    res.status(500).json({
      status: "error",
      message: "Error fetching news",
    });
  }
};

exports.getNewsBySportId = async (req, res) => {
  // Extract sportId from request parameters
  const { sportId } = req.params;

  try {
    // Fetch all news related to the provided sportId from the database
    const newsBySport = await NewsModel.find({ SPORT: sportId });

    if (newsBySport.length === 0) {
      // Check if no news was found for the given sportId
      return res.status(404).json({
        status: "Not Found",
        message: `No news found for sportId: ${sportId}`,
      });
    }

    // Send the retrieved news as response
    res.status(200).json({
      status: `success getNewsBySportId for ${sportId}`,
      data: newsBySport,
    });
  } catch (error) {
    console.error("Error fetching news by sportId:", error);
    res.status(500).json({
      status: "error",
      message: "Error fetching news by sportId",
    });
  }
};

exports.getNewestNews = async (req, res) => {
  try {
    const { count } = req.params || 20; // Get the count from query parameter or default to 10

    // Fetch the newest news from the database based on the PUBLISHED timestamp
    const newestNews = await NewsModel.find()
      .sort({ PUBLISHED: -1 })
      .limit(count);

    if (newestNews.length === 0) {
      // Check if no news was found
      return res.status(404).json({
        status: "Not Found",
        message: "No news found.",
      });
    }

    // Send the retrieved news as response
    res.status(200).json({
      status: "success getNewestNews",
      data: newestNews,
    });
  } catch (error) {
    console.error("Error fetching newest news:", error);
    res.status(500).json({
      status: "error",
      message: "Error fetching newest news",
    });
  }
};
