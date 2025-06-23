const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const { connectDB, sequelize } = require('./config/database');
const machineRoutes = require('./routes/machines');
const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/reports');
const authController = require('./controllers/authController');


const Machine = require('./models/machine');
const Employee = require('./models/employee');
const UsageRecord = require('./models/usageRecord');
const User = require('./models/user');
const Report = require('./models/report');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));


Employee.hasMany(UsageRecord, { foreignKey: 'empleado_id', sourceKey: 'id' });
UsageRecord.belongsTo(Employee, { foreignKey: 'empleado_id', targetKey: 'id' });

Machine.hasMany(UsageRecord, { foreignKey: 'maquina_id', sourceKey: 'id' });
UsageRecord.belongsTo(Machine, { foreignKey: 'maquina_id', targetKey: 'id' });

Report.belongsTo(Employee, { foreignKey: 'assignedEmployeeId', as: 'AssignedEmployee' });
Employee.hasMany(Report, { foreignKey: 'assignedEmployeeId' });

Report.belongsTo(User, { foreignKey: 'userId', as: 'ClientUser' });
User.hasMany(Report, { foreignKey: 'userId' });

app.use('/api/auth', authRoutes);

app.post('/api/machines/initialize', authController.protect, authController.authorize('empleado'), require('./controllers/machineController').initializeData);

app.use('/api/machines', authController.protect, authController.authorize('empleado'), machineRoutes);

app.get('/api/employees', authController.protect, authController.authorize('empleado'), require('./controllers/machineController').getEmployees);

app.use('/api/reports', reportRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

async function startServer() {
    await connectDB();
    console.log('Conexión a la base de datos establecida correctamente.');
    try {
        await sequelize.sync({ alter: true });
        console.log('Modelos sincronizados con la base de datos.');
    } catch (error) {
        console.error('Error al sincronizar modelos:', error);
    }
    app.listen(PORT, () => {
        console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
    });
}

startServer();