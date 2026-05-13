const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');

// @desc    Get dashboard stats
// @route   GET /api/dashboard
// @access  Private
const getDashboard = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const userId = req.user.id;

    // Base filter: admins see everything, members see only their tasks
    const taskFilter = isAdmin ? {} : { assignedTo: userId };

    // Task counts by status
    const [todoCount, inProgressCount, doneCount] = await Promise.all([
      Task.countDocuments({ ...taskFilter, status: 'todo' }),
      Task.countDocuments({ ...taskFilter, status: 'in-progress' }),
      Task.countDocuments({ ...taskFilter, status: 'done' }),
    ]);

    const totalTasks = todoCount + inProgressCount + doneCount;

    // Overdue tasks
    const overdueTasks = await Task.find({
      ...taskFilter,
      status: { $ne: 'done' },
      dueDate: { $lt: new Date(), $ne: null },
    })
      .populate('assignedTo', 'name email avatar')
      .populate('project', 'name color')
      .sort('dueDate')
      .limit(10);

    // Recent tasks
    const recentTasks = await Task.find(taskFilter)
      .populate('assignedTo', 'name email avatar')
      .populate('project', 'name color')
      .sort('-createdAt')
      .limit(5);

    // Tasks by priority
    const [highPriority, mediumPriority, lowPriority] = await Promise.all([
      Task.countDocuments({ ...taskFilter, priority: 'high', status: { $ne: 'done' } }),
      Task.countDocuments({ ...taskFilter, priority: 'medium', status: { $ne: 'done' } }),
      Task.countDocuments({ ...taskFilter, priority: 'low', status: { $ne: 'done' } }),
    ]);

    // Project count
    let projectCount;
    if (isAdmin) {
      projectCount = await Project.countDocuments();
    } else {
      projectCount = await Project.countDocuments({ 'members.user': userId });
    }

    // Team member count (admin only)
    let teamCount = 0;
    if (isAdmin) {
      teamCount = await User.countDocuments();
    }

    res.json({
      success: true,
      data: {
        stats: {
          totalTasks,
          todo: todoCount,
          inProgress: inProgressCount,
          done: doneCount,
          overdue: overdueTasks.length,
          projectCount,
          teamCount,
        },
        priority: {
          high: highPriority,
          medium: mediumPriority,
          low: lowPriority,
        },
        overdueTasks,
        recentTasks,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard };
