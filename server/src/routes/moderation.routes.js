const express = require('express');
const {
  banUserFromReport,
  createReport,
  listReports,
  reviewReport,
} = require('../controllers/moderation.controller');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const router = express.Router();

router.use(auth);
router.post('/reports', createReport);
router.get('/reports', admin, listReports);
router.patch('/reports/:reportId', admin, reviewReport);
router.post('/reports/:reportId/ban', admin, banUserFromReport);

module.exports = router;
