const mongoose = require('mongoose');

const { Schema } = mongoose;

const sportSchema = new Schema({
  ID: { type: Number, required: true, unique: true },
  NAME: { type: String, required: true },
  AVAILABLE: { type: Boolean, required: true },
});

const Sport = mongoose.model('Sport', sportSchema);

module.exports = Sport;
