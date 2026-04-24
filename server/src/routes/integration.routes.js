const express = require('express');
const auth = require('../middleware/auth');
const { getGoogleEvents } = require('../controllers/integration.controller');

const router = express.Router();

router.get('/google-events', auth, getGoogleEvents);

module.exports = router;
