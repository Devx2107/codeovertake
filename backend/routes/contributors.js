const express = require('express');
const router = express.Router();
const contributorController = require('../controllers/contributorController');

router.get('/', contributorController.getContributors);

module.exports = router;