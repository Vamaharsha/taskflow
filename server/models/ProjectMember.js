const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProjectMember = sequelize.define('ProjectMember', {
  role: {
    type: DataTypes.ENUM('admin', 'member'),
    defaultValue: 'member'
  }
}, {
  timestamps: true // adds createdAt (joinedAt equivalent)
});

module.exports = ProjectMember;
