const BlockchainConfig = require("../models/blockchainConfigModel"); // Import your BlockchainConfig model

exports.getAllBlockchainConfigs = async (req, res) => {
  try {
    const blockchainConfigs = await BlockchainConfig.find().lean(); // Retrieve all documents

    // Optional: Transform the data if needed (e.g., formatting or removing certain fields)
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
    res.status(500).json({
      status: "error",
      message: "An error occurred while fetching blockchain configurations",
      error: error.message,
    });
  }
};
