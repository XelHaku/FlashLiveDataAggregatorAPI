const express = require('express');
const sportController = require('../controllers/sportController');

const router = express.Router();

router.route('/').get(sportController.getAllSports);

module.exports = router;
