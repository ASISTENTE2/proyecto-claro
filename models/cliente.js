const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Cliente = sequelize.define('Cliente', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    contactInfo: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    tableName: 'Clientes',
    timestamps: true
});

module.exports = Cliente;