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

    // Convert the address to an array if it's a single address (for consistency)
    const addresses = Array.isArray(address) ? address : [address];

    // Fetch the player summary using the utility function
    const playerSummaryData = await playerSummary(addresses);

    // Prepare the JSON object with the required structure, including additional details
    const response = {
      status: "success",
      data: {
        accounts: playerSummaryData.accounts.map((account) => ({
          level: account.level,
          ethBalance: account.ethBalance,
          atonBalance: account.atonBalance,
          unclaimedCommission: account.unclaimedCommission,
          claimedCommission: account.claimedCommission,
          address: account.address,
          shortAddress: account.shortAddress,
          ethShortBalance: account.ethShortBalance,
          atonShortBalance: account.atonShortBalance,
        })),
        totalCommission: playerSummaryData.totalCommission,
        accumulatedCommission: playerSummaryData.accumulatedCommission,
        totalSupply: playerSummaryData.totalSupply,
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
