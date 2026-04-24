const User = require('../models/User');

const idsEqual = (left, right) => left?.toString() === right?.toString();

const getBlockState = async (currentUserId, otherUserId) => {
  const [currentUser, otherUser] = await Promise.all([
    User.findById(currentUserId).select('blockedUsers'),
    User.findById(otherUserId).select('blockedUsers ban'),
  ]);

  if (!currentUser || !otherUser) {
    return {
      blockedByCurrentUser: false,
      blockedCurrentUser: false,
      isBlocked: false,
      targetIsBanned: false,
    };
  }

  const blockedByCurrentUser = currentUser.blockedUsers.some((id) => idsEqual(id, otherUserId));
  const blockedCurrentUser = otherUser.blockedUsers.some((id) => idsEqual(id, currentUserId));

  return {
    blockedByCurrentUser,
    blockedCurrentUser,
    isBlocked: blockedByCurrentUser || blockedCurrentUser,
    targetIsBanned: Boolean(otherUser.ban?.isBanned),
  };
};

module.exports = { getBlockState, idsEqual };
