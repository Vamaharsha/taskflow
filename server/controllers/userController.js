const { User } = require('../models');

const getUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'avatar'],
      order: [['name', 'ASC']]
    });
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!['admin', 'member'].includes(role)) {
      const error = new Error('Invalid role. Must be admin or member');
      error.statusCode = 400;
      throw error;
    }

    if (req.params.id === req.user.id) {
      const error = new Error('You cannot change your own role');
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    await user.update({ role });
    
    // Fetch fresh without password
    const updated = await User.findByPk(user.id, { attributes: ['id', 'name', 'email', 'role', 'avatar'] });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, updateUserRole };
