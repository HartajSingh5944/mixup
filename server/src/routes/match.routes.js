const express = require('express');
const { getCandidates, likeUser } = require('../controllers/match.controller');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);
router.get('/candidates', getCandidates);
router.post('/like', likeUser);

module.exports = router;

