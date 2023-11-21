const BlockchainConfig = require("../models/blockchainConfigModel"); // Import your BlockchainConfig model

exports.getAllNetworks = async (req, res) => {
  try {
    const blockchainConfigs = await BlockchainConfig.find().lean();

    // Check if any configurations are found
    if (!blockchainConfigs || blockchainConfigs.length === 0) {
      // No records found, send 404 response
      return res.status(404).json({
        status: "not found",
        message: "No blockchain configurations found.",
      });
    }

    const transformedConfigs = blockchainConfigs.map((config) => {
      delete config._id;
      delete config.__v;
      // Add any additional transformations here
      return config;
    });

    res.status(200).json({
      status: "success",
      data: transformedConfigs,
    });
  } catch (error) {
    // Handle unexpected errors with a 500 response
    res.status(500).json({
      status: "error",
      message: "An error occurred while fetching blockchain configurations",
      error: error.message,
    });
  }
};
