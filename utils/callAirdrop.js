// If you're using Node.js version 18 or above, fetch is available globally.
// For Node.js versions below 18, you need to install and import 'node-fetch'.
// Uncomment the following line if using Node.js below v18:
// const fetch = require('node-fetch'); // Uncomment if Node.js version < 18

async function callAirdrop() {
  try {
    const response = await fetch(
      "https://flashdataapi.com/api/v1/player/airdrop"
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Oracle response:", data);
  } catch (error) {
    console.error("Error calling oracle:", error);
  } finally {
    // If you need to close any resources, do it here
    // For example, close database connections if necessary
    // mongoose.connection.close(); // Uncomment if needed
  }
}

// Export the function so it can be used elsewhere
module.exports = { callAirdrop };
