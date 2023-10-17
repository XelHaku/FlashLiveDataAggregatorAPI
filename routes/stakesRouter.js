const express = require("express");
const stakesController = require("../controllers/stakesController");

const router = express.Router();

// Auxiliary route as a child of the main route
const playerRouter = express.Router({ mergeParams: true });
playerRouter.get("/", stakesController.getAllPlayerStakes);
router.use("/player", playerRouter);

const eventRouter = express.Router({ mergeParams: true });
eventRouter.get("/", stakesController.getEventIdStakesGraph);
router.use("/event", eventRouter);

// router.route("/").get(stakesController.getAllPlayerStakes);
module.exports = router;

// const router = express.Router();

// // Auxiliary route as a child of the main route
// const playerRouter = express.Router({ mergeParams: true });
// playerRouter.get("/", earningsController.getEarningsByPlayer);
// router.use("/player", playerRouter);

// const topGladiatorsRouter = express.Router({ mergeParams: true });
// topGladiatorsRouter.get("/", earningsController.getTopGladiators);
// router.use("/topGladiators", topGladiatorsRouter);

// // router.route("/").get(earningsController.getEarningsByPlayer);
// module.exports = router;
