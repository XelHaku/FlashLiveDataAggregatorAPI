const express = require("express");
const eventController = require("../controllers/eventController");

const router = express.Router();

router.route("/:sportId/:days").get(eventController.getTournaments);
router
  .route("/:sportId/:countryId/:days")
  .get(eventController.getTournamentsByCountry);

module.exports = router;
