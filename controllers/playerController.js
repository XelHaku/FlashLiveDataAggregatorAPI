const { playerSummary } = require("../utils/playerSummary");

exports.getPlayerSummary = async (req, res) => {
  const { address } = req.query; // Retrieve address from query parameters

  try {
    // Check if the address parameter is provided
    if (!address) {
      return res.status(400).json({
        status: "error",
        message: "Address parameter is required",
      });
    }

    // Fetch the player summary using the utility function
    const playerSummaryData = await playerSummary(address);

    // Prepare the JSON object with the required structure
    const response = {
      status: "success",
      data: {
        level: playerSummaryData.level,
        ethBalance: playerSummaryData.ethBalance,
        atonBalance: playerSummaryData.atonBalance,
        unclaimedCommission: playerSummaryData.unclaimedCommission,
        claimedCommission: playerSummaryData.claimedCommission,
        address: playerSummaryData.address,
        shortAddress: playerSummaryData.shortAddress,
        ethShortBalance: playerSummaryData.ethShortBalance,
        atonShortBalance: playerSummaryData.atonShortBalance,
        totalCommission: playerSummaryData.totalCommission,
        accumulatedCommission: playerSummaryData.accumulatedCommission,
      },
    };

    // Respond with the player summary data
    res.status(200).json(response);
  } catch (error) {
    console.error("Error in getPlayerSummary: ", error);
    res.status(500).json({
      status: "error",
      message: "Error fetching player summary",
    });
  }
};
