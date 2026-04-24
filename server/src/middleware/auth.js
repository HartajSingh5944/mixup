const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { resolveUserRole } = require('../utils/userRoles');

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const [, token] = header.split(' ');

    if (!token) {
      return res.status(401).json({ message: 'Missing auth token' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.userId).select('-passwordHash');

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    if (user.ban?.isBanned) {
      return res.status(403).json({ message: 'This account has been banned from MixUp' });
    }

    user.role = resolveUserRole(user);

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = auth;
