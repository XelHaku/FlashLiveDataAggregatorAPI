const SmartContractEvent = require("../models/SmartContractEventModel");

exports.getEarningsByPlayer = async (req, res) => {
  // Extract player from query params
  const { player } = req.query;
  const { category } = req.query;
  const { chainId } = req.query;
  // const { eventId } = req.query;

  if (!chainId) {
    return res.status(400).json({
      status: "error",
      message: " ChainId parameter is missing from the query.",
    });
  }
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
exports.getTopGladiators = async (req, res) => {
  const start = Math.floor(Date.now());

  try {
    const { chainId } = req.query;

    if (!chainId) {
      return res.status(400).json({
        status: "error",
        message: " ChainId parameter is missing from the query.",
      });
    }
    const chainIdNumber = parseInt(chainId, 10); // Convert the chainId string to a number

    // Extract the number of top gladiators to return from the query parameters
    const gladiatorsQty = req.query.gladiatorsQty
      ? parseInt(req.query.gladiatorsQty, 10)
      : 20;

    // Combine the aggregation pipelines
    const combinedData = await SmartContractEvent.aggregate([
      {
        $match: {
          ChainId: chainIdNumber,
          EventName: { $in: ["StakeAdded", "Earnings"] },
        },
      },
      {
        $group: {
          _id: "$Args.player",
          totalStaked: {
            $sum: {
              $cond: [
                { $eq: ["$EventName", "StakeAdded"] },
                { $toDouble: "$Args.amountVUND" },
                0,
              ],
            },
          },
          totalEarnings: {
            $sum: {
              $cond: [
                { $eq: ["$EventName", "Earnings"] },
                { $toDouble: "$Args.amountVUND" },
                0,
              ],
            },
          },
          totalAmountATON: {
            $sum: {
              $cond: [
                { $eq: ["$EventName", "Earnings"] },
                { $toDouble: "$Args.amountATON" },
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          player: "$_id",
          totalStaked: 1,
          totalEarnings: 1,
          totalAmountATON: 1,
          roi: {
            $cond: [
              { $eq: ["$totalStaked", 0] },
              0,
              { $divide: ["$totalEarnings", "$totalStaked"] },
            ],
          },
        },
      },
      { $sort: { roi: -1 } },
      { $limit: gladiatorsQty },
    ]);
    console.log("END: ", Math.floor(Date.now()) - start);

    res.status(200).json({
      status: "success getTopGladiators",
      data: combinedData,
    });
  } catch (err) {
    console.error("Error executing query:", err);
    res.status(500).json({
      status: "error",
      message: "An error occurred while fetching top gladiators.",
    });
  }
};

exports.getStakeGraph = async (req, res) => {
  try {
    // 1. Extract eventId and chainId from the request parameters:
    const eventId = req.params.eventId;
    const chainId = Number(req.params.chainId);

    // 2. Check if eventId and chainId are provided. If not, return error response.
    if (!eventId || !chainId) {
      return res.status(400).json({
        status: "error",
        message: "Both eventId and chainId are required.",
      });
    }

    // 3. Query the database
    const stakeEvents = await SmartContractEvent.find({
      "Args.eventId": eventId,
      ChainId: chainId,
      EventName: "StakeAdded",
    });

    // Sort stakeEvents by datetime
    stakeEvents.sort((a, b) => a.DateTime - b.DateTime);

    let cumulativeSum = 0;
    const graphData = stakeEvents.map((event) => {
      const amountVUND = Number(event.Args.amountVUND);

      // If team = '0', add the amountVUND to cumulativeSum, else subtract it
      cumulativeSum += event.Args.team === "0" ? amountVUND : -amountVUND;

      return {
        datetime: event.DateTime,
        team: event.Args.team,
        cumulativeAmountVUND: cumulativeSum,
      };
    });

    // 5. Send the created array as a response
    res.status(200).json({
      status: "success getStakeGraph",
      data: graphData,
    });
  } catch (err) {
    // 6. Handle any errors
    console.error("Error fetching stake graph data:", err);
    res.status(500).json({
      status: "error",
      message: "An error occurred while fetching stake graph data.",
    });
  }
};

exports.getCategorySumFromEarningsForPlayer = async (req, res) => {
  // Extract player from query params
  const { player } = req.query;
  const { category } = req.query;
  const { chainId } = req.query;
  // const { eventId } = req.query;

  if (!chainId) {
    return res.status(400).json({
      status: "error",
      message: " ChainId parameter is missing from the query.",
    });
  }
  if (!category) {
  }
  // If player is not provided in the query params, send a bad request response
  if (!player) {
    return res.status(400).json({
      status: "error",
      message: "Player parameter is missing from the query.",
    });
  }

  try {
    const result = await SmartContractEvent.aggregate([
      {
        $match: {
          EventName: "Earnings",
          "Args.player": player,
        },
      },
      {
        $group: {
          _id: "$Args.category", // Group by category
          totalAmountVUND: {
            $sum: { $toDouble: "$Args.amountVUND" }, // Sum of amountVUND within each category
          },
        },
      },
    ]);

    res.status(200).json({
      status: "success getCategorySumFromEarningsForPlayer",
      data: result,
    });
  } catch (err) {
    console.error("Error executing query:", err);
    res.status(500).json({
      status: "error",
      message:
        "An error occurred while calculating category sums for Earnings.",
    });
  }
};
