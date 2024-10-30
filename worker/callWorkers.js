// If you're using Node.js version 18 or above, fetch is available globally.
// For Node.js versions below 18, you need to install and import 'node-fetch'.
// Uncomment the following line if using Node.js below v18:
// const fetch = require('node-fetch'); // Uncomment if Node.js version < 18

const { activeEventsSummary } = require("./activeEventsSummary");

async function callWorkers() {
  try {
    const _summary = activeEventsSummary("3");
    console.log("activeEventsSummary:", _summary);
  } catch (error) {
    console.error("Error calling oracle:", error);
  } finally {
    // If you need to close any resources, do it here
    // For example, close database connections if necessary
    // mongoose.connection.close(); // Uncomment if needed
  }
}

// Export the function so it can be used elsewhere
module.exports = { callWorkers };
callWorkers();
