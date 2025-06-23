const Report = require('../models/report');
const User = require('../models/user');
const Employee = require('../models/employee');

exports.createReport = async (req, res) => {
    try {
        const { title, description } = req.body;
        const userId = req.user.id;

        const newReport = await Report.create({
            userId,
            title,
            description,
            status: 'Pendiente'
        });

        res.status(201).json({ message: 'Reporte creado exitosamente.', report: newReport });
    } catch (error) {
        console.error('Error al crear reporte:', error);
        res.status(500).json({ message: 'Error interno del servidor al crear reporte.', error: error.message });
    }
};

exports.getReportsByClient = async (req, res) => {
    try {
        const userId = req.user.id;
        const reports = await Report.findAll({
            where: { userId: userId },
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(reports);
    } catch (error) {
        console.error('Error al obtener reportes del cliente:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener reportes.', error: error.message });
    }
};

exports.getAllReportsForEmployee = async (req, res) => {
    try {
        const reports = await Report.findAll({
            include: [
                {
                    model: User,
                    as: 'User',
                    attributes: ['username', 'id']
                },
                {
                    model: Employee,
                    as: 'AssignedEmployee',
                    attributes: ['name', 'id']
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(reports);
    } catch (error) {
        console.error('Error al obtener todos los reportes para empleado:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener todos los reportes.', error: error.message });
    }
};

exports.assignReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { employeeId } = req.body;
        const report = await Report.findByPk(id);

        if (!report) {
            return res.status(404).json({ message: 'Reporte no encontrado.' });
        }

        if (report.status === 'Resuelto') {
            return res.status(400).json({ message: 'No se puede asignar un reporte ya resuelto.' });
        }

        await report.update({
            assignedEmployeeId: employeeId,
            status: 'En Progreso'
        });

        res.status(200).json({ message: 'Reporte asignado con éxito.', report });
    } catch (error) {
        console.error('Error al asignar reporte:', error);
        res.status(500).json({ message: 'Error interno del servidor al asignar reporte.', error: error.message });
    }
};

exports.resolveReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { resolution, resolutionReason } = req.body;
        const report = await Report.findByPk(id);

        if (!report) {
            return res.status(404).json({ message: 'Reporte no encontrado.' });
        }

        if (report.status !== 'En Progreso') {
            return res.status(400).json({ message: 'Solo se puede resolver un reporte "En Progreso".' });
        }

        await report.update({
            status: 'Resuelto',
            resolution: resolution,
            resolutionReason: resolutionReason,
            resolvedAt: new Date()
        });

        res.status(200).json({ message: 'Reporte resuelto con éxito.', report });
    } catch (error) {
        console.error('Error al resolver reporte:', error);
        res.status(500).json({ message: 'Error interno del servidor al resolver reporte.', error: error.message });
    }
};