const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const UsageRecord = require('./usageRecord');

const Machine = sequelize.define('Machine', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('Libre', 'Ocupado'),
        allowNull: false,
        defaultValue: 'Libre',
    },
    assignedEmployeeId: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    assignedEmployeeName: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    timestamps: false,
    tableName: 'machines'
});

Machine.hasMany(UsageRecord, { foreignKey: 'maquina_id', sourceKey: 'id' });

module.exports = Machine;