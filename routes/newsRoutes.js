const express = require("express");
const eventController = require("../controllers/eventController");

const router = express.Router();

// Auxiliary route as a child of the main route
// const upcomingRouter = express.Router({ mergeParams: true });
router.route("/").get(eventController.getRecentNews);

// upcomingRouter.get("/", eventController.getRecentNews);

module.exports = router;
