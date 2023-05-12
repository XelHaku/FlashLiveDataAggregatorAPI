const express = require('express');
const eventController = require('../controllers/eventController');

const router = express.Router();

router.route('/').get(eventController.getCountries);

module.exports = router;
