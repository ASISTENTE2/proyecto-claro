const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./user');

const Report = sequelize.define('Report', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id',
        }
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Pendiente',
    },
    assignedEmployeeId: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
            model: 'employees',
            key: 'id',
        }
    },
    resolution: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    resolutionReason: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    tableName: 'Reports',
    timestamps: true
});

Report.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Report, { foreignKey: 'userId' });

module.exports = Report;