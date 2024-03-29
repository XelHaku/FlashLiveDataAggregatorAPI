const mongoose = require("mongoose");

const blockchainConfigSchema = new mongoose.Schema({
  name: String,
  chainId: Number,
  rpcUrl: String,
  faucetLink: String,
  testnet: Boolean,
  blockExplorer: String,
  usdcAddress: String,
  usdcStartBlock: Number,
  usdtAddress: String,
  usdtStartBlock: Number,
  daiAddress: String,
  daiStartBlock: Number,
  testnetAddress: String,
  testnetStartBlock: Number,
  atonAddress: String,
  atonStartBlock: Number,
  vaultAddress: String,
  vaultStartBlock: Number,
  arenatonAddress: String,
  arenatonStartBlock: Number,
  swapAddress: String,
  swapStartBlock: Number,
  pvtAddress: String,
  pvtStartBlock: Number,
  canvasAddress: String,
  canvasStartBlock: Number,
});

const BlockchainConfig = mongoose.model(
  "BlockchainConfig",
  blockchainConfigSchema
);

module.exports = BlockchainConfig;
