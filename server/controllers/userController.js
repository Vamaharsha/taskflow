const User = require('../models/User');

// @desc    Get all users (for member selection dropdowns)
// @route   GET /api/users
// @access  Private (Admin)
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('name email role avatar').sort('name');
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private (Admin)
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!['admin', 'member'].includes(role)) {
      const error = new Error('Invalid role. Must be admin or member');
      error.statusCode = 400;
      throw error;
    }

    // Prevent changing own role
    if (req.params.id === req.user.id) {
      const error = new Error('You cannot change your own role');
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('name email role avatar');

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, updateUserRole };
