const {
  getUnfinishedEvents,
  deleteEventById,
} = require("./getUnfinishedEvents");
const ck = require("ckey");
const Event = require("../models/eventModel");
const { EventById } = require("./EventById");
const { scorePartValidation } = require("./scorePartValidation");
const { NewsByEventId } = require("./NewsByEventId");
const { VideosByEventId } = require("./VideosByEventId");
const { MatchOddsByEventId } = require("./MatchOddsByEventId");

/**
 * @typedef {Object} EventData
 * @property {string} EVENT_ID - Unique identifier for the event
 * @property {Array} [NEWS] - Array of news items related to the event
 * @property {Array} [VIDEOS] - Array of videos related to the event
 * @property {Array} [ODDS] - Array of match odds
 * @property {number} lastUpdated - Timestamp of last update
 */

/**
 * Updates event information with news, videos, and odds
 * @param {string} eventId - The ID of the event to update
 * @param {Object} [options] - Optional configuration parameters
 * @param {boolean} [options.validateData=true] - Whether to validate the event data
 * @param {number} [options.timeout=30000] - Timeout in milliseconds for API calls
 * @returns {Promise<EventData|null>} Updated event data or null if event not found/invalid
 * @throws {Error} If there's a critical error during the update process
 */
async function updateEventFlash(eventId, options = {}) {
  // Input validation
  if (!eventId || typeof eventId !== "string") {
    throw new Error("Invalid eventId provided");
  }

  // Default options
  const { validateData = true, timeout = 30000 } = options;

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // Fetch base event data
    const newEvent = await EventById(eventId);

    // Early return if event not found
    if (newEvent === 404 || !newEvent) {
      console.warn(`Event not found for ID: ${eventId}`);
      return null;
    }

    // Validate score data if validation is enabled
    const validatedEvent = validateData
      ? scorePartValidation(newEvent)
      : newEvent;

    // Parallel fetch of additional data with error handling for each
    const [news, videos, matchOdds] = await Promise.allSettled([
      NewsByEventId(eventId).catch((error) => {
        console.error(`Failed to fetch news for event ${eventId}:`, error);
        return null;
      }),
      VideosByEventId(eventId).catch((error) => {
        console.error(`Failed to fetch videos for event ${eventId}:`, error);
        return null;
      }),
      MatchOddsByEventId(eventId).catch((error) => {
        console.error(`Failed to fetch odds for event ${eventId}:`, error);
        return null;
      }),
    ]);

    // Safely add additional data if available
    if (news.status === "fulfilled" && news.value) {
      validatedEvent.NEWS = news.value;
    }
    if (videos.status === "fulfilled" && videos.value) {
      validatedEvent.VIDEOS = videos.value;
    }
    if (matchOdds.status === "fulfilled" && matchOdds.value) {
      validatedEvent.ODDS = matchOdds.value;
    }

    // Add metadata
    validatedEvent.EVENT_ID = eventId;
    validatedEvent.lastUpdated = Math.floor(Date.now() / 1000);

    // Validate final event object
    if (!isValidEventObject(validatedEvent)) {
      throw new Error(`Invalid event data structure for event ${eventId}`);
    }

    await Event.findOneAndUpdate({ EVENT_ID: eventId }, validatedEvent, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });

    return validatedEvent;
  } catch (error) {
    // Handle specific error types
    if (error.name === "AbortError") {
      throw new Error(
        `Operation timed out after ${timeout}ms for event ${eventId}`
      );
    }

    // Log error and rethrow with context
    console.error(`Error updating event ${eventId}:`, error);
    throw new Error(`Failed to update event ${eventId}: ${error.message}`);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Validates the structure of an event object
 * @param {Object} event - The event object to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidEventObject(event) {
  return Boolean(
    event &&
      typeof event === "object" &&
      typeof event.EVENT_ID === "string" &&
      typeof event.lastUpdated === "number" &&
      (!event.NEWS || Array.isArray(event.NEWS)) &&
      (!event.VIDEOS || Array.isArray(event.VIDEOS)) &&
      (!event.ODDS || Array.isArray(event.ODDS))
  );
}

/**
 * Retry wrapper for updateEventFlash
 * @param {string} eventId - The ID of the event to update
 * @param {Object} options - Options for the update
 * @param {number} [options.retries=3] - Number of retry attempts
 * @param {number} [options.delay=1000] - Delay between retries in ms
 * @returns {Promise<EventData|null>} Updated event data or null
 */
async function updateEventFlashWithRetry(eventId, options = {}) {
  const { retries = 3, delay = 1000, ...updateOptions } = options;
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await updateEventFlash(eventId, updateOptions);
      return result;
    } catch (error) {
      lastError = error;
      console.warn(
        `Attempt ${attempt}/${retries} failed for event ${eventId}:`,
        error.message
      );

      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
      }
    }
  }

  console.error(`All retry attempts failed for event ${eventId}`);
  throw lastError;
}

module.exports = {
  updateEventFlash,
  updateEventFlashWithRetry,
};
