/* eslint-disable no-console */
/* eslint-disable no-restricted-syntax */
const Sport = require("../models/sportModel");
const Event = require("../models/eventModel");
const { getWeekEventsBySport } = require("./getWeekEventsBySport");
const { scorePartValidation } = require("./scorePartValidation");

// Configuration
const config = {
  BATCH_SIZE: 100,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  PARALLEL_SPORTS: 3
};

// Metrics for monitoring
const metrics = {
  startTime: null,
  endTime: null,
  totalEvents: 0,
  successfulUpdates: 0,
  failedUpdates: 0,
  errors: [],
  sportMetrics: {}
};

const sportsList = [
  { id: 1, name: "Football" },
  { id: 2, name: "Tennis" },
  { id: 3, name: "Basketball" },
  { id: 4, name: "Hockey" },
  { id: 5, name: "American Football" },
  { id: 6, name: "Baseball" },
  { id: 7, name: "Handball" },
  { id: 8, name: "Rugby Union" },
  { id: 9, name: "Floorball" },
  { id: 10, name: "Bandy" },
  { id: 11, name: "Futsal" },
  { id: 12, name: "Volleyball" },
  { id: 13, name: "Cricket" },
  { id: 14, name: "Darts" },
  { id: 15, name: "Snooker" },
  { id: 16, name: "Boxing" },
  { id: 17, name: "Beach Volleyball" },
  { id: 18, name: "Aussie Rules" },
  { id: 19, name: "Rugby League" },
  { id: 21, name: "Badminton" },
  { id: 22, name: "Water Polo" },
  { id: 23, name: "Golf" },
  { id: 24, name: "Field Hockey" },
  { id: 25, name: "Table Tennis" },
  { id: 26, name: "Beach Football" },
  { id: 28, name: "MMA" },
  { id: 29, name: "Netball" },
  { id: 30, name: "Pesapallo" },
  { id: 36, name: "Esports" },
  { id: 42, name: "Kabadi" }
];

// Helper function to chunk array into batches
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Helper function for delayed retry
async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Retry mechanism for operations
async function retryOperation(operation, sportName, maxRetries = config.MAX_RETRIES) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempt}/${maxRetries} failed for ${sportName}:`, error.message);
      
      if (attempt === maxRetries) {
        metrics.errors.push({
          sport: sportName,
          error: error.message,
          timestamp: new Date()
        });
        throw lastError;
      }
      
      await delay(config.RETRY_DELAY * attempt);
    }
  }
}

// Process single sport
async function processSport(sportItem) {
  const sportMetric = {
    startTime: Date.now(),
    eventsProcessed: 0,
    successful: 0,
    failed: 0
  };
  
  metrics.sportMetrics[sportItem.name] = sportMetric;
  
  try {
    console.log(`Processing sport: ${sportItem.name} (ID: ${sportItem.id})`);
    
    const events = await retryOperation(
      () => getWeekEventsBySport(sportItem.id),
      sportItem.name
    );
    
    if (!events?.length) {
      console.log(`No events found for ${sportItem.name}`);
      return;
    }
    
    sportMetric.eventsProcessed = events.length;
    metrics.totalEvents += events.length;
    
    // Process events in batches
    const batches = chunkArray(events, config.BATCH_SIZE);
    
    for (const batch of batches) {
      const bulkOps = batch.map(event => {
        const validatedEvent = scorePartValidation(event);
        return {
          updateOne: {
            filter: { EVENT_ID: validatedEvent.EVENT_ID },
            update: { $set: validatedEvent },
            upsert: true
          }
        };
      });
      
      try {
        const result = await retryOperation(
          () => Event.bulkWrite(bulkOps, { ordered: false }),
          `${sportItem.name} batch`
        );
        
        sportMetric.successful += result.modifiedCount + result.upsertedCount;
        metrics.successfulUpdates += result.modifiedCount + result.upsertedCount;
        
        console.log(`Batch processed for ${sportItem.name}:`, {
          matched: result.matchedCount,
          modified: result.modifiedCount,
          upserted: result.upsertedCount
        });
      } catch (error) {
        sportMetric.failed += batch.length;
        metrics.failedUpdates += batch.length;
        console.error(`Error processing batch for ${sportItem.name}:`, error);
      }
    }
    
  } catch (error) {
    console.error(`Failed to process sport ${sportItem.name}:`, error);
    sportMetric.failed += sportMetric.eventsProcessed;
    metrics.failedUpdates += sportMetric.eventsProcessed;
  } finally {
    sportMetric.endTime = Date.now();
    sportMetric.duration = (sportMetric.endTime - sportMetric.startTime) / 1000;
  }
}

// Main function to get events
async function getEvents() {
  metrics.startTime = Date.now();
  
  try {
    // Process sports in parallel with limited concurrency
    const chunks = chunkArray(sportsList, config.PARALLEL_SPORTS);
    
    for (const chunk of chunks) {
      await Promise.all(chunk.map(processSport));
    }
    
  } catch (error) {
    console.error("Error in main getEvents process:", error);
    throw error;
  } finally {
    metrics.endTime = Date.now();
    printMetrics();
  }
}

// Print metrics summary
function printMetrics() {
  const duration = (metrics.endTime - metrics.startTime) / 1000;
  
  console.log('\nPerformance Metrics:');
  console.log('-----------------');
  console.log(`Total Duration: ${duration.toFixed(2)}s`);
  console.log(`Total Events: ${metrics.totalEvents}`);
  console.log(`Successful Updates: ${metrics.successfulUpdates}`);
  console.log(`Failed Updates: ${metrics.failedUpdates}`);
  console.log(`Success Rate: ${((metrics.successfulUpdates / metrics.totalEvents) * 100).toFixed(2)}%`);
  
  console.log('\nPer Sport Metrics:');
  console.log('-----------------');
  Object.entries(metrics.sportMetrics).forEach(([sport, sportMetric]) => {
    console.log(`\n${sport}:`);
    console.log(`  Duration: ${sportMetric.duration.toFixed(2)}s`);
    console.log(`  Events Processed: ${sportMetric.eventsProcessed}`);
    console.log(`  Successful: ${sportMetric.successful}`);
    console.log(`  Failed: ${sportMetric.failed}`);
  });
  
  if (metrics.errors.length > 0) {
    console.log('\nErrors:');
    console.log('-----------------');
    metrics.errors.forEach(error => {
      console.log(`${error.sport}: ${error.error} (${error.timestamp})`);
    });
  }
}

// Cleanup function
async function cleanup() {
  console.log('\nCleaning up...');
  // Add any cleanup logic here (e.g., closing connections)
  process.exit(0);
}

// Handle process termination
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Export functions
module.exports = {
  getEvents,
  processSport,
  metrics,
  config
};