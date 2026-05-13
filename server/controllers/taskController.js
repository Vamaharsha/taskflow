const Task = require('../models/Task');
const Project = require('../models/Project');

// @desc    Create a task
// @route   POST /api/tasks
// @access  Private (Admin)
const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, project, assignedTo, dueDate } = req.body;

    // Verify project exists
    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      const error = new Error('Project not found');
      error.statusCode = 404;
      throw error;
    }

    // If assigning to someone, verify they're a project member
    if (assignedTo) {
      const isMember = projectDoc.members.some(
        (m) => m.user.toString() === assignedTo
      );
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
      project,
      assignedTo,
      createdBy: req.user.id,
      dueDate,
    });

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name color');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tasks (with filters)
// @route   GET /api/tasks?project=xxx&status=xxx&assignedTo=xxx
// @access  Private
const getTasks = async (req, res, next) => {
  try {
    const { project, status, assignedTo, priority } = req.query;
    const filter = {};

    if (project) filter.project = project;
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (priority) filter.priority = priority;

    // Members can only see tasks assigned to them
    if (req.user.role !== 'admin') {
      filter.assignedTo = req.user.id;
    }

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name color')
      .sort('-createdAt');

    res.json({ success: true, data: tasks, count: tasks.length });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
const getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name color');

    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    // Members can only view tasks assigned to them
    if (
      req.user.role !== 'admin' &&
      task.assignedTo?._id.toString() !== req.user.id
    ) {
      const error = new Error('Not authorized to view this task');
      error.statusCode = 403;
      throw error;
    }

    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res, next) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    // Members can only update status of tasks assigned to them
    if (req.user.role !== 'admin') {
      if (task.assignedTo?.toString() !== req.user.id) {
        const error = new Error('Not authorized to update this task');
        error.statusCode = 403;
        throw error;
      }
      // Members can only change status
      const allowedFields = ['status'];
      const updates = Object.keys(req.body);
      const isAllowed = updates.every((field) => allowedFields.includes(field));
      if (!isAllowed) {
        const error = new Error('Members can only update task status');
        error.statusCode = 403;
        throw error;
      }
    }

    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name color');

    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private (Admin)
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createTask, getTasks, getTask, updateTask, deleteTask };
