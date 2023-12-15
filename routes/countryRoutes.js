const express = require("express");
const countryController = require("../controllers/countryController");

const router = express.Router();

router.route("/").get(countryController.getCountries);
// router.route("/:sportId").get(countryController.getCountriesWithUpcomingcountrys);

module.exports = router;
