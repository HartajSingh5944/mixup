const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { resolveUserRole } = require('../utils/userRoles');

const signToken = (user) =>
  jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const toPublicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  bio: user.bio,
  state: user.state,
  city: user.city,
  interests: user.interests,
  location: user.location,
  role: resolveUserRole(user),
});

const register = async (req, res) => {
  try {
    const { name, email, password, interests = [], cityLocation, bio = '', state = '', city = '' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const location = cityLocation
      ? {
          type: 'Point',
          coordinates: [Number(cityLocation.lng), Number(cityLocation.lat)],
        }
      : undefined;

    const user = await User.create({
      name,
      email,
      passwordHash,
      bio,
      state,
      city,
      interests,
      role: resolveUserRole({ email }),
      ...(location ? { location } : {}),
    });

    res.status(201).json({ token: signToken(user), user: toPublicUser(user) });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.ban?.isBanned) {
      return res.status(403).json({ message: 'This account has been banned from MixUp' });
    }

    res.json({ token: signToken(user), user: toPublicUser(user) });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

const getMe = async (req, res) => {
  res.json({ user: toPublicUser(req.user) });
};

const updateMe = async (req, res) => {
  try {
    const { name, bio = '', interests = [], state = '', city = '', cityLocation } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const update = {
      name,
      bio,
      interests,
      state,
      city,
    };

    if (cityLocation?.lat !== undefined && cityLocation?.lng !== undefined) {
      update.location = {
        type: 'Point',
        coordinates: [Number(cityLocation.lng), Number(cityLocation.lat)],
      };
    }

    const user = await User.findByIdAndUpdate(req.user._id, update, {
      returnDocument: 'after',
      runValidators: true,
    });

    res.json({ user: toPublicUser(user) });
  } catch (error) {
    res.status(500).json({ message: 'Profile update failed', error: error.message });
  }
};

module.exports = { register, login, getMe, updateMe };
