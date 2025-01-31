const fetch = require("node-fetch");

async function terminateEvent(_eventId, winner) {
  try {
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
            "terminateEvent(string eventId,int8 _winner,uint8 _batchSize)", // Ensure the function signature matches exactly what's in the contract
          args: {
            eventId: _eventId,
            _winner: winner,
            _batchSize: 100,
          },
        }),
      }
    );

    const syndicateData = await response.json(); // Parse response to JSON
    console.log("\n\nSyndicate API Response:", syndicateData);
    return true; // Return true to indicate success
  } catch (error) {
    console.error("Error calling terminateEvent:", error);
    return false; // Return false to indicate failure
  }
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

module.exports = { terminateEvent, sleep };