/* eslint-disable no-console */
const ck = require("ckey");
const mongoose = require("mongoose");
const app = require("./app");
const { getEvents } = require("./flashLive/getEvents");
const { callOracle } = require("./utils/callOracle");
const {
  updateUnfinishedEvents,
} = require("./flashLive/updateUnfinishedEvents");

const nodeCron = require("node-cron");

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});

// Mongoose connection with error handling
mongoose
  .connect(ck.CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true, // Use the new connection management engine
    dbName: "ArenatonDB",
  })
  .then(() => console.log("DB connection successful!"))
  .catch((err) => {
    console.error("DB connection error:", err);
    process.exit(1); // Exit process if DB connection fails
  });

// Start the server
const server = app.listen(ck.PORT, () => {
  console.log(`App running on port: ${ck.PORT}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION! 💥 Shutting down...");
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});





// Initial data fetching
(async () => {
  try {
    await getEvents();
    await updateUnfinishedEvents();
    await callOracle();
  } catch (err) {
    console.error("Error during initial data fetching:", err);
  }
})();

// Schedule tasks using node-cron
nodeCron.schedule("0 * * * *", async () => {
  // Runs at the top of every hour
  try {
    await getEvents();
    console.log("getEvents executed successfully.");
  } catch (err) {
    console.error("Error executing getEvents:", err);
  }
});

// Schedule tasks using node-cron, every 5 minutes

nodeCron.schedule("5 * * * *", async () => {
  // Runs at the top of every hour
  try {
    await callOracle();
    console.log("getEvents executed successfully.");
  } catch (err) {
    console.error("Error executing getEvents:", err);
  }
});

nodeCron.schedule("0 */4 * * *", async () => {
  // Runs every 4 hours
  try {
    await updateUnfinishedEvents();
    console.log("updateUnfinishedEvents executed successfully.");
  } catch (err) {
    console.error("Error executing updateUnfinishedEvents:", err);
  }
});

// Graceful shutdown on SIGTERM
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM RECEIVED. Shutting down gracefully...");
  server.close(() => {
    console.log("💥 Process terminated!");
  });
});
