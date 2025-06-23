require('dotenv').config();

const { sequelize } = require('./config/database');
const User = require('./models/user');
const Employee = require('./models/employee');

async function createEmployeeUser(username, password, name = null, role = 'empleado') {
    try {
        await sequelize.authenticate();
        console.log('Conexión a la base de datos establecida.');

        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            console.log(`El usuario '${username}' ya existe.`);
            await sequelize.close();
            return;
        }

        const newUser = await User.create({
            username: username,
            password: password,
            role: role
        });
        console.log(`Usuario '${newUser.username}' creado con ID: ${newUser.id} y rol: ${newUser.role}`);

        let employeeName = name || username.split('@')[0];

        let newEmployeeId;
        const lastEmployee = await Employee.findOne({ order: [['id', 'DESC']] });
        if (lastEmployee && lastEmployee.id.startsWith('EMP-')) {
            const lastNumber = parseInt(lastEmployee.id.substring(4));
            newEmployeeId = `EMP-${String(lastNumber + 1).padStart(3, '0')}`;
        } else {
            newEmployeeId = `EMP-001`;
        }
        
        const newEmployee = await Employee.create({
            id: newEmployeeId,
            name: employeeName,
            isAvailable: true,
        });
        console.log(`Empleado '${newEmployee.name}' creado con ID: ${newEmployee.id}.`);

    } catch (error) {
        console.error('Error al crear usuario y empleado:', error);
    } finally {
        await sequelize.close();
        console.log('Conexión a la base de datos cerrada.');
    }
}

const args = process.argv.slice(2);
const usernameInput = args[0];
const passwordInput = args[1];
const nameInput = args[2];
const roleInput = args[3];

if (!usernameInput || !passwordInput) {
    console.log('Uso: node createEmployeeUser.js <username> <password> [nombre_empleado_opcional] [rol_opcional]');
    console.log('Ejemplo: node createEmployeeUser.js empleado2@claro.com pruebaempleado2 "Empleado Dos"');
    console.log('Ejemplo: node createEmployeeUser.js admin@claro.com adminpass "Admin Maestro" admin');
} else {
    createEmployeeUser(usernameInput, passwordInput, nameInput, roleInput);
}