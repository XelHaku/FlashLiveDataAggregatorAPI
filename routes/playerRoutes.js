const express = require("express");
const playerController = require("../controllers/playerController");

const router = express.Router();

router.route("/").get(playerController.getPlayerSummary);
router.route("/login").get(playerController.postLogin);
module.exports = router;
