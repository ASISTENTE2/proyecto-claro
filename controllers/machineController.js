const Machine = require('../models/machine');
const Employee = require('../models/employee');
const UsageRecord = require('../models/usageRecord');
const { Op } = require('sequelize');

exports.getMachines = async (req, res) => {
    try {
        const machines = await Machine.findAll();
        const machinesWithEmployeeNames = await Promise.all(machines.map(async (machine) => {
            if (machine.assignedEmployeeId) {
                const employee = await Employee.findByPk(machine.assignedEmployeeId);
                return {
                    ...machine.toJSON(),
                    assignedEmployeeName: employee ? employee.name : null
                };
            }
            return machine.toJSON();
        }));
        res.json(machinesWithEmployeeNames);
    } catch (error) {
        console.error('Error al obtener máquinas:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

exports.assignMachine = async (req, res) => {
    const { id } = req.params;
    const { employeeId } = req.body;

    try {
        const machine = await Machine.findByPk(id);
        const employee = await Employee.findByPk(employeeId);

        if (!machine) {
            return res.status(404).json({ message: 'Máquina no encontrada.' });
        }
        if (!employee) {
            return res.status(404).json({ message: 'Empleado no encontrado.' });
        }

        const existingAssignment = await Machine.findOne({
            where: {
                assignedEmployeeId: employeeId,
                id: { [Op.ne]: id }
            }
        });

        if (existingAssignment) {
            return res.status(400).json({ message: `El empleado ${employee.name} ya está asignado a la máquina ${existingAssignment.name}.` });
        }

        if (machine.status === 'Ocupado' && machine.assignedEmployeeId !== employeeId) {
            return res.status(400).json({ message: 'La máquina ya está ocupada por otro empleado.' });
        }

        if (machine.status === 'Ocupado' && machine.assignedEmployeeId === employeeId) {
            return res.status(200).json({ message: `Máquina ${machine.name} ya asignada al empleado ${employee.name}.` });
        }

        machine.status = 'Ocupado';
        machine.assignedEmployeeId = employeeId;
        machine.assignedEmployeeName = employee.name;
        await machine.save();

        employee.isAvailable = false;
        await employee.save();

        await UsageRecord.create({
            empleado_id: employeeId,
            maquina_id: id,
            hora_entrada: new Date(),
        });

        const updatedMachine = {
            ...machine.toJSON(),
            assignedEmployeeName: employee.name
        };

        res.json({ message: 'Máquina asignada correctamente.', machine: updatedMachine });
    } catch (error) {
        console.error('Error al asignar máquina:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

exports.releaseMachine = async (req, res) => {
    const { id } = req.params;

    try {
        const machine = await Machine.findByPk(id);

        if (!machine) {
            return res.status(404).json({ message: 'Máquina no encontrada.' });
        }
        if (machine.status === 'Libre') {
            return res.status(400).json({ message: 'La máquina ya está libre.' });
        }

        const assignedEmployeeId = machine.assignedEmployeeId;

        machine.status = 'Libre';
        machine.assignedEmployeeId = null;
        machine.assignedEmployeeName = null;
        await machine.save();

        if (assignedEmployeeId) {
            const employee = await Employee.findByPk(assignedEmployeeId);

            const otherMachineAssigned = await Machine.findOne({
                where: {
                    assignedEmployeeId: assignedEmployeeId,
                    id: { [Op.ne]: machine.id }
                }
            });

            if (employee && !otherMachineAssigned) {
                employee.isAvailable = true;
                await employee.save();
            }

            const latestUsageRecord = await UsageRecord.findOne({
                where: {
                    maquina_id: id,
                    empleado_id: assignedEmployeeId,
                    hora_salida: null,
                },
                order: [['hora_entrada', 'DESC']],
            });

            if (latestUsageRecord) {
                latestUsageRecord.hora_salida = new Date();
                const durationMs = latestUsageRecord.hora_salida.getTime() - latestUsageRecord.hora_entrada.getTime();
                latestUsageRecord.duracion_segundos = Math.floor(durationMs / 1000);
                await latestUsageRecord.save();
            }
        }

        res.json({ message: 'Máquina liberada correctamente.', machine: machine.toJSON() });
    } catch (error) {
        console.error('Error al liberar máquina:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

exports.getEmployees = async (req, res) => {
    try {
        const employees = await Employee.findAll();
        res.json(employees);
    } catch (error) {
        console.error('Error al obtener empleados:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

exports.initializeData = async (req, res) => {
    try {
        await UsageRecord.destroy({ truncate: { cascade: true } });
        await Machine.destroy({ truncate: { cascade: true } });
        await Employee.destroy({ truncate: { cascade: true } });

        const machinesToCreate = Array.from({ length: 20 }, (_, i) => ({
            id: (i + 1),
            name: `Máquina ${i + 1}`,
            status: 'Libre',
        }));
        await Machine.bulkCreate(machinesToCreate);

        const employeesToCreate = Array.from({ length: 20 }, (_, i) => ({
            id: `EMP-${String(i + 1).padStart(3, '0')}`,
            name: `Empleado ${i + 1}`,
            isAvailable: true,
        }));
        await Employee.bulkCreate(employeesToCreate);

        res.status(200).json({ message: 'Base de datos inicializada con máquinas y empleados de prueba.' });
    } catch (error) {
        console.error('Error al inicializar datos:', error);
        res.status(500).json({ message: 'Error al inicializar la base de datos.' });
    }
};