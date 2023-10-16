const express = require("express");
const earningsController = require("../controllers/earningsController");

const router = express.Router();

// Auxiliary route as a child of the main route
const upcomingRouter = express.Router({ mergeParams: true });
// upcomingRouter.get("/:sportId", eventController.getUpcomingEventsBySportId);
// upcomingRouter.get(
//   "/:sportId/:countryId",
//   eventController.getUpcomingEventsBySportIdAndCountryId
// );
// router.use("/upcoming", upcomingRouter);

// Main route with primary path
// router.route("/:tournamentId/:days").get(eventController.getEventsByTournament);
// router.route("/:player").get(earningsController.getAllPlayerEarnings);
router.route("/").get(earningsController.getAllPlayerEarnings);
module.exports = router;
