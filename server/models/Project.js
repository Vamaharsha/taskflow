const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { len: [1, 100] }
  },
  description: {
    type: DataTypes.STRING,
    defaultValue: '',
    validate: { len: [0, 500] }
  },
  color: {
    type: DataTypes.STRING,
    defaultValue: '#6366f1'
  },
  type: {
    type: DataTypes.ENUM('software', 'marketing', 'design', 'operations', 'custom'),
    defaultValue: 'custom'
  },
  deadline: {
    type: DataTypes.DATE
  },
  status: {
    type: DataTypes.ENUM('Not Started', 'In Progress', 'Done'),
    defaultValue: 'Not Started'
  }
});

module.exports = Project;
