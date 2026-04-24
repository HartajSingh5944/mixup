const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Report = require('../models/Report');
const User = require('../models/User');
const { idsEqual } = require('../utils/moderation');

const REPORT_CATEGORIES = ['harassment', 'spam', 'hate_speech', 'scam', 'threat', 'sexual_content', 'other'];

const buildTranscriptSnapshot = async (conversationId) => {
  const messages = await Message.find({ conversation: conversationId })
    .populate('sender', 'name')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return messages.reverse().map((message) => ({
    sender: message.sender?._id || message.sender,
    senderName: message.sender?.name || 'Unknown user',
    text: message.text,
    createdAt: message.createdAt,
  }));
};

const createReport = async (req, res) => {
  try {
    const { conversationId, reportedUserId, category, details = '' } = req.body;

    if (!conversationId || !reportedUserId || !category) {
      return res.status(400).json({ message: 'conversationId, reportedUserId, and category are required' });
    }

    if (!REPORT_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: 'Invalid report category' });
    }

    if (idsEqual(reportedUserId, req.user._id)) {
      return res.status(400).json({ message: 'You cannot report yourself' });
    }

    const conversation = await Conversation.findById(conversationId).lean();
    if (!conversation || !conversation.participants.some((id) => idsEqual(id, req.user._id))) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.participants.some((id) => idsEqual(id, reportedUserId))) {
      return res.status(400).json({ message: 'Reported user is not part of this conversation' });
    }

    const reportedUser = await User.findById(reportedUserId).select('_id');
    if (!reportedUser) {
      return res.status(404).json({ message: 'Reported user not found' });
    }

    const transcriptSnapshot = await buildTranscriptSnapshot(conversation._id);

    const report = await Report.create({
      reporter: req.user._id,
      reportedUser: reportedUserId,
      conversation: conversation._id,
      match: conversation.match,
      category,
      details,
      transcriptSnapshot,
    });

    await report.populate([
      { path: 'reporter', select: 'name email' },
      { path: 'reportedUser', select: 'name email' },
    ]);

    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: 'Could not submit report', error: error.message });
  }
};

const listReports = async (req, res) => {
  try {
    const filter = req.query.status ? { status: req.query.status } : {};
    const reports = await Report.find(filter)
      .populate('reporter', 'name email')
      .populate('reportedUser', 'name email ban')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch reports', error: error.message });
  }
};

const reviewReport = async (req, res) => {
  try {
    const { status, resolutionNotes = '', actionTaken } = req.body;
    const allowedStatuses = ['open', 'reviewing', 'actioned', 'dismissed'];
    const allowedActions = ['none', 'warned', 'banned'];

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid review status' });
    }

    if (actionTaken && !allowedActions.includes(actionTaken)) {
      return res.status(400).json({ message: 'Invalid actionTaken value' });
    }

    const report = await Report.findById(req.params.reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (status) {
      report.status = status;
    }

    if (actionTaken) {
      report.actionTaken = actionTaken;
    }

    report.resolutionNotes = resolutionNotes;
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();
    await report.save();

    await report.populate([
      { path: 'reporter', select: 'name email' },
      { path: 'reportedUser', select: 'name email ban' },
      { path: 'reviewedBy', select: 'name email' },
    ]);

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Could not review report', error: error.message });
  }
};

const banUserFromReport = async (req, res) => {
  try {
    const { reason = '' } = req.body;
    const report = await Report.findById(req.params.reportId);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const bannedUser = await User.findByIdAndUpdate(
      report.reportedUser,
      {
        $set: {
          'ban.isBanned': true,
          'ban.reason': reason || `Banned after moderation review for report ${report._id}`,
          'ban.bannedAt': new Date(),
        },
      },
      { returnDocument: 'after' }
    ).select('name email ban');

    report.status = 'actioned';
    report.actionTaken = 'banned';
    report.resolutionNotes = reason || report.resolutionNotes;
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();
    await report.save();

    res.json({
      message: `${bannedUser?.name || 'User'} has been banned`,
      bannedUser,
      reportId: report._id,
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not ban user', error: error.message });
  }
};

module.exports = {
  banUserFromReport,
  createReport,
  listReports,
  reviewReport,
};
