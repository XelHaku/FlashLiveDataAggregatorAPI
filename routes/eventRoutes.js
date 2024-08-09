const express = require("express");
const eventController = require("../controllers/eventController");

const router = express.Router();

router.route("/").get(eventController.getEvents);
router.route("/search").get(eventController.getSearchEvents);
module.exports = router;
