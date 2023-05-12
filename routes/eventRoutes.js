const express = require('express');
const eventController = require('../controllers/eventController');

const router = express.Router();
router.route('/:tournamentId/:days').get(eventController.getEventsByTournament);

router.route('/:eventId').get(eventController.getEventById);

module.exports = router;
