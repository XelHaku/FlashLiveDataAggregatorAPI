const express = require("express");
const newsController = require("../controllers/newsController");

const router = express.Router();

// Auxiliary route as a child of the main route
// const upcomingRouter = express.Router({ mergeParams: true });
router.route("/").get(newsController.getNewsBySportId);

// const upcomingRouter = express.Router({ mergeParams: true });
router.route("/:count").get(newsController.getNewestNews);

module.exports = router;

// ##############################

// // Auxiliary route as a child of the main route
// const upcomingRouter = express.Router({ mergeParams: true });
// upcomingRouter.get("/:sportId", eventController.getUpcomingEventsBySportId);
// upcomingRouter.get(
//   "/:sportId/:countryId",
//   eventController.getUpcomingEventsBySportIdAndCountryId
// );
// router.use("/upcoming", upcomingRouter);

// // Main route with primary path
// router.route("/:tournamentId/:days").get(eventController.getEventsByTournament);
// router.route("/:eventId").get(eventController.getEventById);
