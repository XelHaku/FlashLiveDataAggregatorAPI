const express = require('express');
const eventController = require('../controllers/eventController');

const router = express.Router();

router.route('/:sportId/:days').get(eventController.getTournaments);

module.exports = router;
