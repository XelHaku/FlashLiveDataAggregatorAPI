const mongoose = require("mongoose");

const { Schema } = mongoose;

const playerSchema = new Schema(
  {
    idToken: {
      type: String,
      required: true,
      unique: true,
    },
    typeOfLogin: {
      type: String,
      required: true,
    },
    signature: String,
    playerAddress: {
      type: String,
      required: true,
      unique: true,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    airdropClaimed: {
      type: Boolean,
      default: false,
    },
    atonBalance: {
      type: String,
      default: "0",
      required: false,
    },
  },
  {
    timestamps: true, // Esto añadirá automáticamente createdAt y updatedAt
  }
);

const Player = mongoose.model("Player", playerSchema);

module.exports = Player;
