const express = require("express");
const playerController = require("../controllers/playerController");
;
const router = express.Router();

// GET request for player summary
router.get("/", playerController.getPlayerSummary);

// POST request for player login
router.post("/login", playerController.postLogin);
router.post("/events", playerController.getPlayerEventsSummary);
router.get("/airdrop", playerController.getAirdropX);


module.exports = router;
