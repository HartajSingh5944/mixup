const Conversation = require('../models/Conversation');
const Match = require('../models/Match');
const Message = require('../models/Message');
const User = require('../models/User');
const { getBlockState, idsEqual } = require('../utils/moderation');

const getId = (value) => (value?._id || value).toString();

const getOtherParticipant = (conversation, currentUserId) =>
  conversation.participants.find((participant) => getId(participant) !== currentUserId.toString());

const ensureParticipant = (conversation, userId) =>
  conversation.participants.some((participant) => getId(participant) === userId.toString());

const buildConversationResponse = async (conversation, currentUserId) => {
  const latestMessage = await Message.findOne({
    conversation: conversation._id,
    deletedFor: { $ne: currentUserId },
  })
    .sort({ createdAt: -1 })
    .select('text sender createdAt')
    .lean();

  const otherUser = getOtherParticipant(conversation, currentUserId);
  const blockState = otherUser ? await getBlockState(currentUserId, getId(otherUser)) : null;

  return {
    _id: conversation._id,
    match: conversation.match,
    otherUser,
    leftByCurrentUser: conversation.leftBy.some((id) => id.toString() === currentUserId.toString()),
    deletedByCurrentUser: conversation.deletedBy.some((id) => id.toString() === currentUserId.toString()),
    blockedByCurrentUser: Boolean(blockState?.blockedByCurrentUser),
    blockedCurrentUser: Boolean(blockState?.blockedCurrentUser),
    isBlocked: Boolean(blockState?.isBlocked),
    latestMessage,
    lastMessageAt: conversation.lastMessageAt,
    updatedAt: conversation.updatedAt,
  };
};

const getConversations = async (req, res) => {
  try {
    await backfillConversationsForUser(req.user._id);

    const conversations = await Conversation.find({
      participants: req.user._id,
      deletedBy: { $ne: req.user._id },
    })
      .populate('participants', 'name bio city state interests')
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    const response = await Promise.all(
      conversations.map((conversation) => buildConversationResponse(conversation, req.user._id))
    );

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch conversations', error: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId).populate(
      'participants',
      'name bio city state interests'
    );

    if (!conversation || !ensureParticipant(conversation, req.user._id)) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (conversation.deletedBy.some((id) => id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Conversation was deleted for this user' });
    }

    const messages = await Message.find({
      conversation: conversation._id,
      deletedFor: { $ne: req.user._id },
    })
      .populate('sender', 'name')
      .sort({ createdAt: 1 });

    res.json({
      conversation: await buildConversationResponse(conversation, req.user._id),
      messages,
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch messages', error: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const cleanText = text?.trim();

    if (!cleanText) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation || !ensureParticipant(conversation, req.user._id)) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const otherParticipant = getOtherParticipant(conversation, req.user._id);
    const blockState = otherParticipant
      ? await getBlockState(req.user._id, getId(otherParticipant))
      : { isBlocked: false };

    if (blockState.isBlocked) {
      return res.status(403).json({ message: 'This chat is blocked and can no longer receive messages' });
    }

    if (conversation.leftBy.length > 0) {
      return res.status(403).json({ message: 'This chat has been left by one or more users' });
    }

    conversation.deletedBy = conversation.deletedBy.filter((id) => id.toString() !== req.user._id.toString());
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      text: cleanText,
    });

    await message.populate('sender', 'name');

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Could not send message', error: error.message });
  }
};

const leaveConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation || !ensureParticipant(conversation, req.user._id)) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    await Conversation.findByIdAndUpdate(conversation._id, {
      $addToSet: { leftBy: req.user._id },
    });

    res.json({ message: 'Chat left' });
  } catch (error) {
    res.status(500).json({ message: 'Could not leave chat', error: error.message });
  }
};

const deleteConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation || !ensureParticipant(conversation, req.user._id)) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    await Conversation.findByIdAndUpdate(conversation._id, {
      $addToSet: { deletedBy: req.user._id },
    });
    await Message.updateMany(
      { conversation: conversation._id },
      { $addToSet: { deletedFor: req.user._id } }
    );

    res.json({ message: 'Chat deleted for you' });
  } catch (error) {
    res.status(500).json({ message: 'Could not delete chat', error: error.message });
  }
};

const getOrCreateConversationForMatch = async (match) => {
  let conversation = await Conversation.findOne({ match: match._id });

  if (!conversation) {
    conversation = await Conversation.create({
      match: match._id,
      participants: [match.userA, match.userB],
      lastMessageAt: new Date(),
    });
  }

  return conversation;
};

const blockUser = async (req, res) => {
  try {
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ message: 'targetUserId is required' });
    }

    if (idsEqual(targetUserId, req.user._id)) {
      return res.status(400).json({ message: 'You cannot block yourself' });
    }

    const targetUser = await User.findById(targetUserId).select('_id name ban');
    if (!targetUser || targetUser.ban?.isBanned) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { blockedUsers: targetUserId },
    });

    res.json({
      message: `You blocked ${targetUser.name}. They can no longer message you.`,
      targetUserId,
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not block user', error: error.message });
  }
};

const unblockUser = async (req, res) => {
  try {
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ message: 'targetUserId is required' });
    }

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { blockedUsers: targetUserId },
    });

    res.json({ message: 'User unblocked', targetUserId });
  } catch (error) {
    res.status(500).json({ message: 'Could not unblock user', error: error.message });
  }
};

const backfillConversationsForUser = async (userId) => {
  const matches = await Match.find({
    $or: [{ userA: userId }, { userB: userId }],
    userALikesB: true,
    userBLikesA: true,
  });

  await Promise.all(matches.map((match) => getOrCreateConversationForMatch(match)));
};

module.exports = {
  backfillConversationsForUser,
  deleteConversation,
  getConversations,
  getMessages,
  getOrCreateConversationForMatch,
  blockUser,
  leaveConversation,
  sendMessage,
  unblockUser,
};
