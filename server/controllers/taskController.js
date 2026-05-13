const { Task, Project, User, ProjectMember } = require('../models');

const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate } = req.body;
    const projectId = req.body.project || req.body.projectId;
    const assignedToId = req.body.assignedTo || req.body.assignedToId;

    const projectDoc = await Project.findByPk(projectId, { include: [{ model: ProjectMember, as: 'projectMembers' }] });
    if (!projectDoc) {
      const error = new Error('Project not found');
      error.statusCode = 404;
      throw error;
    }

    if (assignedToId) {
      const isMember = projectDoc.projectMembers.some(m => m.userId === assignedToId);
      if (!isMember) {
        const error = new Error('Assigned user is not a member of this project');
        error.statusCode = 400;
        throw error;
      }
    }

    const task = await Task.create({
      title,
      description,
      status,
      priority,
      projectId,
      assignedToId,
      createdById: req.user.id,
      dueDate,
    });

    const populated = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'assignedTo', attributes: ['id', 'name', 'email', 'avatar'] },
        { model: User, as: 'createdBy', attributes: ['id', 'name', 'email', 'avatar'] },
        { model: Project, as: 'project', attributes: ['id', 'name', 'color'] }
      ]
    });

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

const getTasks = async (req, res, next) => {
  try {
    const projectId = req.query.project || req.query.projectId;
    const assignedToId = req.query.assignedTo || req.query.assignedToId;
    const { status, priority } = req.query;
    const where = {};

    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (assignedToId) where.assignedToId = assignedToId;
    if (priority) where.priority = priority;

    if (req.user.role !== 'admin') {
      where.assignedToId = req.user.id;
    }

    const tasks = await Task.findAll({
      where,
      include: [
        { model: User, as: 'assignedTo', attributes: ['id', 'name', 'email', 'avatar'] },
        { model: User, as: 'createdBy', attributes: ['id', 'name', 'email', 'avatar'] },
        { model: Project, as: 'project', attributes: ['id', 'name', 'color'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, data: tasks, count: tasks.length });
  } catch (error) {
    next(error);
  }
};

const getTask = async (req, res, next) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [
        { model: User, as: 'assignedTo', attributes: ['id', 'name', 'email', 'avatar'] },
        { model: User, as: 'createdBy', attributes: ['id', 'name', 'email', 'avatar'] },
        { model: Project, as: 'project', attributes: ['id', 'name', 'color'] }
      ]
    });

    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    if (req.user.role !== 'admin' && task.assignedToId !== req.user.id) {
      const error = new Error('Not authorized to view this task');
      error.statusCode = 403;
      throw error;
    }

    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findByPk(req.params.id);

    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    if (req.user.role !== 'admin') {
      if (task.assignedToId !== req.user.id) {
        const error = new Error('Not authorized to update this task');
        error.statusCode = 403;
        throw error;
      }
      const allowedFields = ['status'];
      const updates = Object.keys(req.body);
      const isAllowed = updates.every(field => allowedFields.includes(field));
      if (!isAllowed) {
        const error = new Error('Members can only update task status');
        error.statusCode = 403;
        throw error;
      }
    }

    await task.update(req.body);
    
    const updatedTask = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'assignedTo', attributes: ['id', 'name', 'email', 'avatar'] },
        { model: User, as: 'createdBy', attributes: ['id', 'name', 'email', 'avatar'] },
        { model: Project, as: 'project', attributes: ['id', 'name', 'color'] }
      ]
    });

    res.json({ success: true, data: updatedTask });
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findByPk(req.params.id);

    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    await task.destroy();
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createTask, getTasks, getTask, updateTask, deleteTask };
