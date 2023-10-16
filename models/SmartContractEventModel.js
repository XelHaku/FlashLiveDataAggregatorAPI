const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  BlockNumber: Number,
  DateTime: Number,
  Address: String,
  TransactionHash: String,
  EventName: String,
  Args: {
    owner: String,
    spender: String,
    value: String, // or Number, depending on how you're storing BigNumbers
    // Add other possible fields for different event types
    from: String,
    to: String,

    eventId: String,
    player: String,
    amountVUND: String, // Assuming you want to convert the BigNumber to string
    amountATON: String,
    category: String,
    sport: String,
    startTime: String,
    tokenIn: String,
    tokenOut: String,
    amountIn: String,
    amountOut: String,

    newCommissionVUND: String,
    accumulatedCommissionPerToken: String,
    totalCommissionVUND: String,

    // ...
  },
  ChainId: Number,
});

const SmartContractEvent = mongoose.model("SmartContractEvents", eventSchema);

module.exports = SmartContractEvent;
