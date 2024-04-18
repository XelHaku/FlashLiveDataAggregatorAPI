const express = require("express");
const alchemySignerController = require("../controllers/alchemySignerController");

const router = express.Router();


router.get("/", alchemySignerController.getAlchemySigner);


module.exports = router;




