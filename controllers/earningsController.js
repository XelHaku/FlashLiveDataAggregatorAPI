const SmartContractEvent = require("../models/SmartContractEventModel");

exports.getEarnings = async (req, res) => {
  // Extract player from query params
  const { player } = req.query;
  const { category } = req.query;
  const { eventId } = req.query;
  if (!category) {
  }
  // If player is not provided in the query params, send a bad request response
  if (!player) {
    return res.status(400).json({
      status: "error",
      message: "Player parameter is missing from the query.",
    });
  }

  // Query the database using the player parameter
  let earningsList;
  if (player && !category) {
    earningsList = await SmartContractEvent.find({
      EventName: "Earnings",
      "Args.player": player,
    }).lean();
  } else if (player && category) {
    earningsList = await SmartContractEvent.find({
      EventName: "Earnings",
      "Args.player": player,
      "Args.category": category,
    }).lean();
  }

  res.status(200).json({
    status: "success getEarnings",
    data: earningsList,
  });
};
exports.getAllEventEarnings = async (req, res) => {};
