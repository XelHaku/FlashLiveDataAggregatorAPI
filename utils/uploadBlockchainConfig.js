const BlockchainConfigModel = require("../models/blockchainConfigModel");
const ck = require("ckey");
const mongoose = require("mongoose");
const fs = require("fs").promises; // Ensure you're using the promises version of fs

async function readJsonFile(filePath) {
  try {
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    throw err;
  }
}

async function uploadBlockchainConfig() {
  try {
    await mongoose.connect(ck.CONNECTION_STRING, {
      useNewUrlParser: true,
      dbName: "flashLiveDB",
    });
    console.log("DB connection successful!");

    const blockchainConfigParameters = await readJsonFile(
      "./parameters/parameters80001.json"
    );

    // const blockchainConfigParameters = await readJsonFile(
    //   "./parameters/parameters421614.json"
    // );

    // const blockchainConfigParameters = await readJsonFile(
    //   "./parameters/parameters421614.json"
    // );

    // const blockchainConfigParameters = await readJsonFile(
    //   "./parameters/parameters11155111.json"
    // );

    // Check if a document with the same chainId already exists
    const existingConfig = await BlockchainConfigModel.findOne({
      chainId: blockchainConfigParameters.chainId,
    });

    if (existingConfig) {
      // Update the existing document
      await BlockchainConfigModel.updateOne(
        { chainId: blockchainConfigParameters.chainId },
        blockchainConfigParameters
      );
      console.log(
        `BlockchainConfig with chainId ${blockchainConfigParameters.chainId} updated.`
      );
    } else {
      // Create a new document
      const newBlockchainConfig = new BlockchainConfigModel(
        blockchainConfigParameters
      );
      await newBlockchainConfig.save();
      console.log(
        `New BlockchainConfig with chainId ${blockchainConfigParameters.chainId} created.`
      );
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    // Close the DB connection
    mongoose.connection.close();
  }
}

uploadBlockchainConfig();
