const mongoose = require('mongoose');
const { getOrCreateConversationForMatch } = require('./chat.controller');
const Match = require('../models/Match');
const User = require('../models/User');
const { getBlockState } = require('../utils/moderation');

const normalizePair = (currentUserId, targetUserId) => {
  const current = currentUserId.toString();
  const target = targetUserId.toString();

  return current < target
    ? { userA: current, userB: target, currentIsA: true }
    : { userA: target, userB: current, currentIsA: false };
};

const getCandidates = async (req, res) => {
  try {
    const currentUser = req.user;
    const currentUserId = currentUser._id;
    const { interest, radius } = req.query;
    const maxDistance = radius ? Number(radius) : null;

    const seenMatches = await Match.find({
      $or: [
        { userA: currentUserId, userALikesB: { $exists: true } },
        { userB: currentUserId, userBLikesA: { $exists: true } },
      ],
    });

    const seenIds = seenMatches.map((match) =>
      match.userA.equals(currentUserId) ? match.userB : match.userA
    );
    const usersWhoBlockedCurrentUser = await User.find({ blockedUsers: currentUserId }).select('_id').lean();
    const excludedIds = [
      ...seenIds.map((id) => id.toString()),
      ...(currentUser.blockedUsers || []).map((id) => id.toString()),
      ...usersWhoBlockedCurrentUser.map((user) => user._id.toString()),
    ];
    const sharedInterests = interest ? [interest] : currentUser.interests;
    const baseMatch = {
      _id: {
        $ne: currentUserId,
        $nin: excludedIds.map((id) => new mongoose.Types.ObjectId(id)),
      },
      interests: { $in: sharedInterests },
      'ban.isBanned': { $ne: true },
    };

    const hasUsableLocation =
      Array.isArray(currentUser.location?.coordinates) &&
      currentUser.location.coordinates.length === 2 &&
      !(currentUser.location.coordinates[0] === 0 && currentUser.location.coordinates[1] === 0);
    const useGeoNear = maxDistance && maxDistance > 0 && hasUsableLocation;
    const firstStage = useGeoNear
      ? {
          $geoNear: {
            near: currentUser.location,
            distanceField: 'distanceMeters',
            maxDistance,
            spherical: true,
            query: baseMatch,
          },
        }
      : { $match: baseMatch };

    const candidates = await User.aggregate([
      firstStage,
      {
        $addFields: {
          mutualInterests: { $setIntersection: ['$interests', currentUser.interests] },
        },
      },
      {
        $addFields: {
          mutualInterestsCount: { $size: '$mutualInterests' },
        },
      },
      {
        $project: {
          passwordHash: 0,
          email: 0,
          __v: 0,
        },
      },
      { $sort: useGeoNear ? { mutualInterestsCount: -1, distanceMeters: 1 } : { mutualInterestsCount: -1, createdAt: -1 } },
      { $limit: 30 },
    ]);

    res.json(candidates);
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch match candidates', error: error.message });
  }
};

const likeUser = async (req, res) => {
  try {
    const { targetUserId, action } = req.body;

    if (!targetUserId || !['like', 'pass'].includes(action)) {
      return res.status(400).json({ message: 'targetUserId and action "like" or "pass" are required' });
    }

    if (targetUserId === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot match with yourself' });
    }

    const targetExists = await User.exists({ _id: targetUserId });
    if (!targetExists) {
      return res.status(404).json({ message: 'Target user not found' });
    }

    const blockState = await getBlockState(req.user._id, targetUserId);
    if (blockState.targetIsBanned) {
      return res.status(403).json({ message: 'This user is not available for matching' });
    }

    if (blockState.isBlocked) {
      return res.status(403).json({ message: 'You cannot interact with a blocked user' });
    }

    const pair = normalizePair(req.user._id, targetUserId);
    const likeValue = action === 'like';
    const update = pair.currentIsA
      ? { userALikesB: likeValue }
      : { userBLikesA: likeValue };

    const match = await Match.findOneAndUpdate(
      { userA: pair.userA, userB: pair.userB },
      { $set: update, $setOnInsert: { userA: pair.userA, userB: pair.userB } },
      { returnDocument: 'after', upsert: true }
    );

    // A full match exists when both directional booleans are true.
    const isMutual = Boolean(match.userALikesB && match.userBLikesA);
    const conversation = isMutual ? await getOrCreateConversationForMatch(match) : null;

    res.json({ match, isMutual, conversation });
  } catch (error) {
    res.status(500).json({ message: 'Could not save match action', error: error.message });
  }
};

module.exports = { getCandidates, likeUser };
