const express = require('express');
const {
  blockUser,
  deleteConversation,
  getConversations,
  getMessages,
  leaveConversation,
  sendMessage,
  unblockUser,
} = require('../controllers/chat.controller');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);
router.get('/conversations', getConversations);
router.get('/conversations/:conversationId/messages', getMessages);
router.post('/conversations/:conversationId/messages', sendMessage);
router.post('/blocks', blockUser);
router.delete('/blocks', unblockUser);
router.post('/conversations/:conversationId/leave', leaveConversation);
router.delete('/conversations/:conversationId', deleteConversation);

module.exports = router;
