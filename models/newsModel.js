const mongoose = require("mongoose");

const NewsSchema = new mongoose.Schema({
  SPORT: String,
  TOURNAMENT_ID: String,
  COUNTRY_ID: String,
  EVENT_ID: String,
  ID: { type: String, required: true },
  TITLE: { type: String, required: true },
  LINK: { type: String, required: true },
  PUBLISHED: { type: Number, required: true },
  PROVIDER_NAME: { type: String, required: true },
  CATEGORY_NAME: { type: String, required: true },
  LINKS: [
    {
      IMAGE_VARIANT_ID: { type: Number, required: true },
      IMAGE_VARIANT_URL: { type: String, required: true },
    },
  ],
});

module.exports = mongoose.model("News", NewsSchema);
