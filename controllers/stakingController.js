const SmartContractEvent = require("../models/SmartContractEventModel");

exports.getAllEventStakings = async (req, res) => {
  // Extract player from query params
  const { player } = req.query;

  // If player is not provided in the query params, send a bad request response
  if (!player) {
    return res.status(400).json({
      status: "error",
      message: "Player parameter is missing from the query.",
    });
  }
  // Query the database using the player parameter
  let earningsList;

  // [
  //   "Approval",
  //   "Transfer",
  //   "Accumulate",
  //   "Commission",
  //   "Earnings",
  //   "EventClosed",
  //   "StakeAdded",
  //   "StakeCanceled",
  //   "Swap",
  //   "Approval",
  //   "Transfer",
  // ];

  if (player) {
    earningsList = await SmartContractEvent.find({
      EventName: "StakeAdded",
      "Args.player": player,
    }).lean();
  }

  res.status(200).json({
    status: "success getAllEventStakings",
    data: earningsList,
  });
};
exports.getAllEventStakings = async (req, res) => {};
