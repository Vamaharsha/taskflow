const { Project, User, ProjectMember, Task } = require('../models');

const createProject = async (req, res, next) => {
  try {
    const { name, description, color, type, deadline, status, members } = req.body;

    const project = await Project.create({
      name,
      description,
      color,
      type: type || 'custom',
      deadline: deadline || null,
      status: status || 'Not Started',
      ownerId: req.user.id,
    });

    // Add creator as admin member
    await ProjectMember.create({
      projectId: project.id,
      userId: req.user.id,
      role: 'admin'
    });

    // Add other members if provided
    if (members && Array.isArray(members)) {
      for (const memberId of members) {
        if (memberId !== req.user.id) {
          await ProjectMember.create({
            projectId: project.id,
            userId: memberId,
            role: 'member'
          });
        }
      }
    }

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

const getProjects = async (req, res, next) => {
  try {
    let projects;
    
    if (req.user.role === 'admin') {
      projects = await Project.findAll({
        include: [
          { model: User, as: 'owner', attributes: ['id', 'name', 'email', 'avatar'] },
          { model: ProjectMember, as: 'projectMembers', include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'avatar'] }] }
        ],
        order: [['createdAt', 'DESC']]
      });
    } else {
      projects = await Project.findAll({
        include: [
          { model: User, as: 'owner', attributes: ['id', 'name', 'email', 'avatar'] },
          { model: ProjectMember, as: 'projectMembers', where: { userId: req.user.id }, include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'avatar'] }] }
        ],
        order: [['createdAt', 'DESC']]
      });
    }

    // Format output to match frontend expectations
    const formatted = projects.map(p => {
      const pJson = p.toJSON();
      pJson.members = pJson.projectMembers || [];
      delete pJson.projectMembers;
      return pJson;
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};

const getProject = async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email', 'avatar'] },
        { model: ProjectMember, as: 'projectMembers', include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'avatar'] }] }
      ]
    });

    if (!project) {
      const error = new Error('Project not found');
      error.statusCode = 404;
      throw error;
    }

    if (req.user.role !== 'admin') {
      const isMember = project.projectMembers.some(m => m.userId === req.user.id);
      if (!isMember) {
        const error = new Error('Not authorized to view this project');
        error.statusCode = 403;
        throw error;
      }
    }

    const formatted = project.toJSON();
    formatted.members = formatted.projectMembers;
    delete formatted.projectMembers;

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      const error = new Error('Project not found');
      error.statusCode = 404;
      throw error;
    }

    const { members, ...updateData } = req.body;
    await project.update(updateData);

    if (members && Array.isArray(members)) {
      // Don't remove the owner
      await ProjectMember.destroy({
        where: {
          projectId: project.id,
          userId: { [require('sequelize').Op.ne]: project.ownerId }
        }
      });

      for (const memberId of members) {
        if (memberId !== project.ownerId) {
          await ProjectMember.create({
            projectId: project.id,
            userId: memberId,
            role: 'member'
          });
        }
      }
    }

    res.json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      const error = new Error('Project not found');
      error.statusCode = 404;
      throw error;
    }

    await Task.destroy({ where: { projectId: project.id } });
    await ProjectMember.destroy({ where: { projectId: project.id } });
    await project.destroy();

    res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    next(error);
  }
};

const addMember = async (req, res, next) => {
  try {
    const { email, role } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const project = await Project.findByPk(req.params.id);
    if (!project) {
      const error = new Error('Project not found');
      error.statusCode = 404;
      throw error;
    }

    const existing = await ProjectMember.findOne({ where: { projectId: project.id, userId: user.id } });
    if (existing) {
      const error = new Error('User already a member');
      error.statusCode = 400;
      throw error;
    }

    await ProjectMember.create({ projectId: project.id, userId: user.id, role: role || 'member' });
    res.json({ success: true, message: 'Member added' });
  } catch (error) {
    next(error);
  }
};

const removeMember = async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      const error = new Error('Project not found');
      error.statusCode = 404;
      throw error;
    }

    if (project.ownerId === req.params.userId) {
      const error = new Error('Cannot remove owner');
      error.statusCode = 400;
      throw error;
    }

    await ProjectMember.destroy({ where: { projectId: project.id, userId: req.params.userId } });
    res.json({ success: true, message: 'Member removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createProject, getProjects, getProject, updateProject, deleteProject, addMember, removeMember };
