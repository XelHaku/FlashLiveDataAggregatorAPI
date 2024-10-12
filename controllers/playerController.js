const { playerSummary } = require("../utils/playerSummary");
const { verifyMessage, ethers } = require("ethers"); // Import ethers for utils
const Player = require("../models/playerModel");

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

exports.postLogin = async (req, res) => {
  const { idToken, typeOfLogin, signature, playerAddress } = req.body; // Use req.body for POST requests

  try {
    const message = `Login ${playerAddress} ${idToken} ${typeOfLogin}`;

    // Validate the signature using ethers
    const signerAddress = verifyMessage(message, signature);

    // Check if the recovered address matches the player's address
    if (signerAddress.toLowerCase() !== playerAddress.toLowerCase()) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid signature" });
    }

    // Find the player by playerAddress, or create a new one if it doesn't exist
    let player = await Player.findOne({ playerAddress });

    if (player) {
      // If player exists, update the lastLogin
      player.lastLogin = new Date();
      player.idToken = idToken;
      player.typeOfLogin = typeOfLogin;
      player.signature = signature;
    } else {
      // If player doesn't exist, create a new one
      player = new Player({
        idToken,
        typeOfLogin,
        signature,
        playerAddress,
        lastLogin: new Date(),
      });
    }

    // Save the player data
    await player.save();

    // Respond with success message
    res.status(200).json({
      status: "success",
      message: "Login successful",
      data: {
        playerAddress: player.playerAddress,
        lastLogin: player.lastLogin,
      },
    });
  } catch (error) {
    console.error("Error in postLogin: ", error);
    res.status(500).json({
      status: "error",
      message: "Error processing login",
    });
  }
};