const express = require('express');
const {
  createEvent,
  getNearbyEvents,
  getMyHostedEvents,
  updateHostedEvent,
  deleteHostedEvent,
} = require('../controllers/event.controller');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);
router.get('/mine', getMyHostedEvents);
router.post('/', createEvent);
router.get('/near', getNearbyEvents);
router.put('/:id', updateHostedEvent);
router.delete('/:id', deleteHostedEvent);

module.exports = router;
