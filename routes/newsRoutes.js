const express = require("express");
const newsController = require("../controllers/newsController");

const router = express.Router();

// Auxiliary route as a child of the main route
// const upcomingRouter = express.Router({ mergeParams: true });
router.route("/").get(newsController.getNewsBySportId);

// const upcomingRouter = express.Router({ mergeParams: true });
router.route("/:count").get(newsController.getNewestNews);

module.exports = router;

