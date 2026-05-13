const { Task, Project, User, ProjectMember } = require('../models');
const { Op } = require('sequelize');

const getDashboard = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const userId = req.user.id;

    const taskWhere = isAdmin ? {} : { assignedToId: userId };

    const todoCount = await Task.count({ where: { ...taskWhere, status: 'todo' } });
    const inProgressCount = await Task.count({ where: { ...taskWhere, status: 'in-progress' } });
    const doneCount = await Task.count({ where: { ...taskWhere, status: 'done' } });
    
    const totalTasks = todoCount + inProgressCount + doneCount;

    const overdueTasks = await Task.findAll({
      where: {
        ...taskWhere,
        status: { [Op.ne]: 'done' },
        dueDate: { [Op.lt]: new Date(), [Op.ne]: null },
      },
      include: [
        { model: User, as: 'assignedTo', attributes: ['id', 'name', 'email', 'avatar'] },
        { model: Project, as: 'project', attributes: ['id', 'name', 'color'] }
      ],
      order: [['dueDate', 'ASC']],
      limit: 10
    });

    const recentTasks = await Task.findAll({
      where: taskWhere,
      include: [
        { model: User, as: 'assignedTo', attributes: ['id', 'name', 'email', 'avatar'] },
        { model: Project, as: 'project', attributes: ['id', 'name', 'color'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    const highPriority = await Task.count({ where: { ...taskWhere, priority: 'high', status: { [Op.ne]: 'done' } } });
    const mediumPriority = await Task.count({ where: { ...taskWhere, priority: 'medium', status: { [Op.ne]: 'done' } } });
    const lowPriority = await Task.count({ where: { ...taskWhere, priority: 'low', status: { [Op.ne]: 'done' } } });

    let projectCount;
    if (isAdmin) {
      projectCount = await Project.count();
    } else {
      projectCount = await ProjectMember.count({ where: { userId } });
    }

    let teamCount = 0;
    if (isAdmin) {
      teamCount = await User.count();
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
