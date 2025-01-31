const fetch = require("node-fetch");
const ethers = require("ethers");

async function addEvent(_eventId, startDate) {
  try {
    const sport = 1;

    const response = await fetch(
      "https://api.syndicate.io/transact/sendTransaction",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SYNDICATE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: process.env.SYNDICATE_PROJECT_ID,
          contractAddress: process.env.ARENATON_CONTRACT,
          chainId: 42161,
          functionSignature:
            "addEvent(string _eventId,uint256 _startDate,uint8 _sport)", // Ensure the function signature matches exactly what's in the contract
          args: { _eventId: _eventId, _startDate: startDate, _sport: sport }, // This is correct if no arguments are needed for the function
        }),
      }
    );

    const syndicateData = await response.json(); // Directly parse response to JSON
    console.log("\n\nSyndicate API Response:", syndicateData);

    return true; // Return true to indicate success
  } catch (error) {
    console.error("Error calling addEvent:", error);
    return false; // Return false to indicate failure
  }
}

module.exports = { addEvent };