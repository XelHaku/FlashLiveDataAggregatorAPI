const express = require("express");
const earningsController = require("../controllers/earningsController");

const router = express.Router();

// Auxiliary route as a child of the main route
const playerRouter = express.Router({ mergeParams: true });
playerRouter.get("/", earningsController.getEarningsByPlayer);
router.use("/player", playerRouter);

const topGladiatorsRouter = express.Router({ mergeParams: true });
topGladiatorsRouter.get("/", earningsController.getTopGladiators);
router.use("/topGladiators", topGladiatorsRouter);

// router.route("/").get(earningsController.getEarningsByPlayer);
module.exports = router;
