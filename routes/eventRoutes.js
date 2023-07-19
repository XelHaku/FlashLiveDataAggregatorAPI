const express = require("express");
const eventController = require("../controllers/eventController");

const router = express.Router();

// Auxiliary route as a child of the main route
const upcomingRouter = express.Router({ mergeParams: true });
upcomingRouter.get("/:sportId", eventController.getUpcomingEventsBySportId);
router.use("/upcoming", upcomingRouter);

// Main route with primary path
router.route("/:tournamentId/:days").get(eventController.getEventsByTournament);
router.route("/:eventId").get(eventController.getEventById);
module.exports = router;
