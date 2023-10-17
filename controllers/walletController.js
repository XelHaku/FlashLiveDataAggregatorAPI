const SmartContractEvent = require("../models/SmartContractEventModel");

exports.getTotalEvents = async (req, res) => {
  const { chainId } = req.query;
  if (!chainId) {
    return res.status(400).json({
      status: "error",
      message: " ChainId parameter is missing from the query.",
    });
  }

  try {
    const totalStakeAddedEvents = await SmartContractEvent.countDocuments({
      EventName: "StakeAdded",
    });

    // 5. Send the created array as a response
    res.status(200).json({
      status: "success getStakeGraph",
      data: totalStakeAddedEvents,
    });
    // return totalEvents;
  } catch (err) {
    console.error("Error executing query:", err);
    res.status(500).json({
      status: "error",
      message: "An error occurred while fetching Totla Events.",
    });
  }
};

exports.getPlayerROIFromEarnings = async (req, res) => {
  const playerName = req.params.playerName; // Get the player name from the request parameters

  try {
    const earningsEvents = await SmartContractEvent.find({
      EventName: "Earnings",
      "Args.Player": playerName,
    });

    const stakeAddedEvents = await SmartContractEvent.find({
      EventName: "StakeAdded",
      "Args.player": playerName,
    });

    let totalInvestment = 0;
    let totalReturns = 0;

    stakeAddedEvents.forEach((event) => {
      const investment = parseFloat(event.Args.amountVUND);

      if (!isNaN(investment)) {
        totalInvestment += investment;
      }
    });

    earningsEvents.forEach((event) => {
      const returns = parseFloat(event.Args.amountVUND);

      if (!isNaN(returns)) {
        totalReturns += returns;
      }
    });

    if (totalInvestment === 0) {
      return res.status(200).json({
        status: "success getPlayerROIFromEarnings",
        data: {
          playerROI: 0,
        },
      });
    }

    const roi = ((totalReturns - totalInvestment) / totalInvestment) * 100;

    res.status(200).json({
      status: "success getPlayerROIFromEarnings",
      data: {
        playerROI: roi,
      },
    });
  } catch (err) {
    console.error("Error executing query:", err);
    res.status(500).json({
      status: "error",
      message: "An error occurred while calculating player ROI.",
    });
  }
};
