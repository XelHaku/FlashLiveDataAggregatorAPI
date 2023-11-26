const express = require("express");
const networkController = require("../controllers/networkController");
const sportController = require("../controllers/sportController");

const router = express.Router();

router.route("/").get(networkController.getAllNetworks);

module.exports = router;
