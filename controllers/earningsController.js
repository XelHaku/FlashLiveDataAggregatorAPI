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
  try {
    // First, compute total staked amounts for each player
    const stakedAmounts = await SmartContractEvent.aggregate([
      {
        $match: {
          EventName: "StakeAdded",
        },
      },
      {
        $group: {
          _id: "$Args.player",
          totalStaked: {
            $sum: { $toDouble: "$Args.amountVUND" },
          },
        },
      },
    ]);

    // Then, compute total earnings for each player
    const earnings = await SmartContractEvent.aggregate([
      {
        $match: {
          EventName: "Earnings",
        },
      },
      {
        $group: {
          _id: "$Args.player",
          totalEarnings: {
            $sum: { $toDouble: "$Args.amountVUND" },
          },
        },
      },
    ]);

    // Merge the two arrays based on player and calculate ROI
    const combinedData = stakedAmounts.map((stake) => {
      const earningsData = earnings.find(
        (earning) => earning._id === stake._id
      ) || { totalEarnings: 0 };
      const roi = earningsData.totalEarnings / stake.totalStaked || 0;
      return {
        player: stake._id,
        totalStaked: stake.totalStaked,
        totalEarnings: earningsData.totalEarnings,
        roi: roi,
      };
    });

    // Sort the array based on ROI
    combinedData.sort((a, b) => b.roi - a.roi);

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
