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
  }
});

module.exports = Project;
