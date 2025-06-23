const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UsageRecord = sequelize.define('UsageRecord', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    empleado_id: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    maquina_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    hora_entrada: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    hora_salida: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    duracion_segundos: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    observaciones: {
        type: DataTypes.TEXT,
        allowNull: true,
    }
}, {
    timestamps: false,
    tableName: 'uso_maquinas'
});

module.exports = UsageRecord;