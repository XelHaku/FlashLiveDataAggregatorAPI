const express = require("express");
const eventController = require("../controllers/eventController");

const router = express.Router();

router.route("/").get(eventController.getCountries);
router.route("/:sportId").get(eventController.getCountriesBySport);

module.exports = router;
