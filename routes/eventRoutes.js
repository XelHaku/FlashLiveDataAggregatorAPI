const express = require("express");
const eventController = require("../controllers/eventController");

const router = express.Router();

// Auxiliary route as a child of the main route
const upcomingRouter = express.Router({ mergeParams: true });
upcomingRouter.get("/:sportId", eventController.getUpcomingEventsBySportId);
upcomingRouter.get(
  "/:sportId/:countryId",
  eventController.getUpcomingEventsBySportIdAndCountryId
);
router.use("/upcoming", upcomingRouter);

// Auxiliary route as a child of the main route
const listRouter = express.Router({ mergeParams: true });
listRouter.get("/", eventController.getEventsByList);
router.use("/list", listRouter);

// Main route with primary path
router.route("/:tournamentId/:days").get(eventController.getEventsByTournament);
router.route("/:eventId").get(eventController.getEventById);
module.exports = router;
