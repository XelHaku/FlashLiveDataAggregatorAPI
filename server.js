/* eslint-disable no-console */
const ck = require("ckey");
const mongoose = require("mongoose");
const app = require("./app");
const { getEvents } = require("./flashLive/getEvents");
const { updateLiveEvents } = require("./worker/updateLiveEvents");

const { callOracle } = require("./utils/callOracle");
const { liquidityNonZero } = require("./worker/liquidity/liquidityNonZero");

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
    const ethers = require("ethers");

    const wallet = ethers.Wallet.createRandom();
    console.log("Private Key:", wallet.privateKey);
    await callOracle();
    // await updateLiveEvents(2);
    // await updateLiveEvents(1);
    // await updateLiveEvents(0);
    // await liquidityNonZero(process.env.LIQUIDITER2, "2"),
    //   await liquidityNonZero(process.env.LIQUIDITER, "1"),
    //   await liquidityNonZero("0xBc8eC38D988E775b21c2C484d205F6bc9731Ea7E", "2"),
    //   await liquidityNonZero("0xAF7F1F446c8Aba2e3b5d00DA35E71817305024e9", "1"),
    //   await liquidityNonZero("0xf89A71711500cE2d111DAa98285920F6bd6Dd538", "1"),
    //   await liquidityNonZero("0xA0e57e3Ed5C714C6aE56665f65FD790a36dC4337", "2"),
    // await getEvents();
    // await updateUnfinishedEvents();
  } catch (err) {
    console.error("Error during initial data fetching:", err);
  }
})();

// Schedule tasks using node-cron
nodeCron.schedule("0 */12 * * *", async () => {  // Runs at the top of every hour
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
    // await liquidityNonZero(process.env.LIQUIDITER2, "2"),
    //   await liquidityNonZero(process.env.LIQUIDITER, "1"),
    //   await liquidityNonZero("0xBc8eC38D988E775b21c2C484d205F6bc9731Ea7E", "2"),
    //   await liquidityNonZero("0xAF7F1F446c8Aba2e3b5d00DA35E71817305024e9", "1"),
    //   await liquidityNonZero("0xf89A71711500cE2d111DAa98285920F6bd6Dd538", "1"),
    //   await liquidityNonZero("0xA0e57e3Ed5C714C6aE56665f65FD790a36dC4337", "2"),
    //   await liquidityNonZero("0xbc8ec38d988e775b21c2c484d205f6bc9731ea7e", "2"),
    //   console.log("updateUnfinishedEvents executed successfully.");
  } catch (err) {
    console.error("Error executing updateUnfinishedEvents:", err);
  }
});

nodeCron.schedule("0 1 * * *", async () => {
  // Runs every 1 hours
  try {
    // await updateLiveEvents(2);
    // await updateLiveEvents(1);
    // await updateLiveEvents(0);

    console.log("updateLiveEvents executed successfully.");
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