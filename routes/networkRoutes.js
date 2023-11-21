const express = require("express");
const networkController = require("../controllers/networkController");
const sportController = require("../controllers/sportController");

const router = express.Router();

router.route("/").get(networkController.getAllNetworks);
// router.route("/").get(sportController.getAllSports);

module.exports = router;
