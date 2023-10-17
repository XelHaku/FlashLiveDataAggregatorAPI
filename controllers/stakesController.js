const SmartContractEvent = require("../models/SmartContractEventModel");

exports.getAllPlayerStakes = async (req, res) => {
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
    status: "success getAllPlayerStakes",
    data: earningsList,
  });
};

exports.getEventIdStakesGraph = async (req, res) => {
  try {
    // 1. Extract eventId and chainId from the request parameters:
    const eventId = req.query.eventId;
    const chainId = Number(req.query.chainId);

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
