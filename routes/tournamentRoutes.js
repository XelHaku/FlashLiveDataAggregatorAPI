const express = require("express");
const tournamentController = require("../controllers/tournamentController");

const router = express.Router();

// router.route("/:sportId/:days").get(tournamentController.getTournaments);
// router
//   .route("/:sportId/:countryId/:days")
//   .get(tournamentController.getTournamentsByCountry);

module.exports = router;
