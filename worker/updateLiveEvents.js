const ckey = require("ckey");
const { getArenatonEvents } = require("../utils/getArenatonEvents");
const { updateEventFlash } = require("../flashLive/updateEventFlash");

/**
 * Formats time duration into a human-readable string
 * @param {number} milliseconds - Time in milliseconds
 * @returns {string} Formatted time string
 */
function formatTimeUntilStart(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Parses event date from bigint or string to number
 * @param {bigint | string} date - The event date
 * @returns {number} Parsed date in milliseconds
 */
function parseEventDate(date) {
  if (typeof date === "bigint") {
    return Number(date) * 1000; // Convert seconds to milliseconds
  }
  return parseInt(date) * 1000;
}

/**
 * Updates live events by fetching and processing them
 * @throws {Error} If there's an error fetching or processing events
 */
async function updateLiveEvents(step) {
  try {
    // Get events
    const result = await getArenatonEvents(
      "-1",
      step,
      "0xBc8eC38D988E775b21c2C484d205F6bc9731Ea7E",
      0,
      1,
      1000
    );

    const events = result.events || [];
    console.log("\n\nEvents:");
    const now = Date.now();

    // Process events
    for (const event of events) {
      try {
        const startDate = parseEventDate(event.startDate);
        if (startDate < now) {
          console.log({
            id: event.eventId,
            startDate: new Date(startDate).toISOString(),
            winner: event.winner,
            timeUntilStart: formatTimeUntilStart(startDate - now),
          });

          // Update event
          const eventFlash = await updateEventFlash(event.eventId);
          console.log("eventFlash:", eventFlash);
        }
      } catch (eventError) {
        console.error(`Error processing event ${event.id}:`, eventError);
        // Continue processing other events
      }
    }
  } catch (error) {
    console.error("Error in updateLiveEvents function:", error);
    throw error; // Re-throw to allow handling by caller
  }
}

// Export the functions
module.exports = {
  updateLiveEvents,
  formatTimeUntilStart, // Exported for testing
  parseEventDate, // Exported for testing
};

// Execute if running directly
if (require.main === module) {
  Promise.all([updateLiveEvents()]).catch((error) => {
    console.error("Error in main execution:", error);
    process.exit(1);
  });
}
