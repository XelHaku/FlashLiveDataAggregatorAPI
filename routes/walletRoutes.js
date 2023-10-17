const express = require("express");
const walletController = require("../controllers/walletController");

const router = express.Router();

//basic route
// router.route("/").get(bController.getEarningsByPlayer);

//add player to a router
// const playerRouter = express.Router({ mergeParams: true });
// playerRouter.get("/", walletController.getEarningsByPlayer);
// router.use("/player", playerRouter);

const _walletController = express.Router({ mergeParams: true });
_walletController.get("/", walletController.getTotalEvents);
router.use("/totalEvents", _walletController);

const _walletRouter = express.Router({ mergeParams: true });
_walletRouter.get("/", walletController.getPlayerROIFromEarnings);
router.use("/PlayerROI", _walletRouter);
module.exports = router;
