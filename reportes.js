document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');

    const employeeViewSection = document.getElementById('employee-view-section');
    const allReportsListContainer = document.getElementById('all-reports-list-container');

    const navLinkReportsClient = document.getElementById('nav-link-reports-client');
    const navLinkReportsEmployee = document.getElementById('nav-link-reports-employee');
    const navLinkMachines = document.getElementById('nav-link-machines');
    const logoutButton = document.getElementById('logout-button');

    const API_BASE_URL_REPORTS_EMPLOYEE = 'http://localhost:3000/api/reports/all';
    const API_BASE_URL_ASSIGN_RESOLVE_REPORT = 'http://localhost:3000/api/reports';
    const API_BASE_URL_EMPLOYEES = 'http://localhost:3000/api/employees';

    let allEmployees = [];

    if (!token || userRole !== 'empleado') {
        if (employeeViewSection) employeeViewSection.style.display = 'none';
        return;
    }

    if (employeeViewSection) employeeViewSection.style.display = 'block';
    const clientViewSection = document.getElementById('client-view-section');
    if (clientViewSection) clientViewSection.style.display = 'none';

    if (navLinkReportsClient) navLinkReportsClient.style.display = 'none';
    if (navLinkReportsEmployee) navLinkReportsEmployee.style.display = 'block';
    if (navLinkMachines) navLinkMachines.style.display = 'block';

    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userId');
            localStorage.removeItem('userName');
            window.location.href = 'login.html';
        });
    }

    async function fetchEmployees() {
        try {
            const response = await fetch(API_BASE_URL_EMPLOYEES, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    alert('Sesión expirada o no autorizada. Por favor, inicie sesión de nuevo.');
                    localStorage.removeItem('token');
                    localStorage.removeItem('userRole');
                    window.location.href = 'login.html';
                    return;
                }
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            allEmployees = await response.json();
        } catch (error) {
            console.error('Error al obtener empleados para reportes:', error);
            allEmployees = [];
        }
    }

    async function fetchAndDisplayAllReports() {
        if (!allReportsListContainer) return;
        allReportsListContainer.innerHTML = '<p>Cargando todos los reportes...</p>';

        try {
            const response = await fetch(API_BASE_URL_REPORTS_EMPLOYEE, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    alert('Sesión expirada o no autorizada. Por favor, inicie sesión de nuevo.');
                    localStorage.removeItem('token');
                    localStorage.removeItem('userRole');
                    window.location.href = 'login.html';
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const reports = await response.json();

            allReportsListContainer.innerHTML = '';

            if (reports.length === 0) {
                allReportsListContainer.innerHTML = '<p>No hay reportes disponibles.</p>';
                return;
            }

            reports.forEach(report => {
                const isAssigned = report.status === 'En Progreso' || report.status === 'Resuelto';
                const employeeName = report.AssignedEmployee ? report.AssignedEmployee.name : 'Nadie asignado';
                const clientUsername = report.User ? report.User.username : 'N/A';
                const statusClass = report.status === 'Pendiente' ? 'status-pending' :
                                    report.status === 'En Progreso' ? 'status-in-progress' :
                                    'status-resolved';

                const reportCardHTML = `
                    <div class="report-card ${statusClass}" data-report-id="${report.id}">
                        <div class="card-header">Reporte #${report.id} - ${clientUsername}</div>
                        <div class="card-content">
                            <p><strong>Título:</strong> ${report.title}</p>
                            <p><strong>Descripción:</strong> ${report.description}</p>
                            <p><strong>Estado:</strong> ${report.status} ${isAssigned ? `por ${employeeName}` : ''}</p>
                            ${report.status === 'Resuelto' && report.resolution ? `<p><strong>Resolución:</strong> ${report.resolution}</p>` : ''}
                            ${report.status === 'Resuelto' && report.resolutionReason ? `<p><strong>Motivo:</strong> ${report.resolutionReason}</p>` : ''}
                            <small>Enviado el: ${new Date(report.createdAt).toLocaleString()}</small>
                        </div>
                        <div class="card-actions">
                            <button class="assign-report-button ${isAssigned ? 'hidden' : ''}">Asignar a Empleado</button>
                            <button class="resolve-report-button ${report.status === 'En Progreso' ? '' : 'hidden'}">Resolver Reporte</button>
                        </div>
                        <div class="employee-list-container hidden">
                            ${generateEmployeeItems(allEmployees)}
                        </div>
                        <div class="resolve-form-container hidden">
                            <textarea class="resolution-input" placeholder="Detalles de la resolución..." rows="3"></textarea>
                            <textarea class="reason-input" placeholder="Motivo de la resolución..." rows="2"></textarea>
                            <button class="submit-resolution-button">Confirmar Resolución</button>
                            <button class="cancel-resolution-button">Cancelar</button>
                        </div>
                    </div>
                `;
                allReportsListContainer.insertAdjacentHTML('beforeend', reportCardHTML);
            });

            setupReportEventListenersForEmployeeView();
            
        } catch (error) {
            console.error('Error al obtener y mostrar todos los reportes (para empleado):', error);
            allReportsListContainer.innerHTML = '<p>Error al cargar los reportes. Asegúrese de que el servidor backend está funcionando.</p>';
        }
    }

    function generateEmployeeItems(employeesToShow) {
        let employeeItemsHTML = '';
        employeesToShow.forEach(employee => {
            if (employee.isAvailable !== false) {
                employeeItemsHTML += `
                    <div class="employee-item" data-employee-id="${employee.id}" data-employee-name="${employee.name}">
                        ${employee.name} (${employee.id})
                    </div>
                `;
            }
        });
        return employeeItemsHTML;
    }

    function setupReportEventListenersForEmployeeView() {
        document.querySelectorAll('.assign-report-button').forEach(button => {
            button.onclick = function(event) {
                event.stopPropagation();
                const reportCard = this.closest('.report-card');
                const employeeList = reportCard.querySelector('.employee-list-container');

                document.querySelectorAll('.employee-list-container:not(.hidden)').forEach(openEmployeeList => {
                    if (openEmployeeList !== employeeList) {
                        openEmployeeList.classList.add('hidden');
                    }
                });

                employeeList.innerHTML = generateEmployeeItems(allEmployees);
                setupEmployeeItemListeners(employeeList);
                employeeList.classList.toggle('hidden');
            };
        });

        function setupEmployeeItemListeners(container) {
            (container || document).querySelectorAll('.employee-item').forEach(employeeItem => {
                employeeItem.onclick = async function() {
                    const employeeId = this.dataset.employeeId;
                    const reportCard = this.closest('.report-card');
                    const reportId = reportCard.dataset.reportId;
                    const employeeList = this.closest('.employee-list-container');

                    try {
                        const response = await fetch(`${API_BASE_URL_ASSIGN_RESOLVE_REPORT}/${reportId}/assign`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ employeeId: employeeId }),
                        });

                        if (!response.ok) {
                            if (response.status === 401 || response.status === 403) {
                                alert('Sesión expirada o no autorizada. Por favor, inicie sesión de nuevo.');
                                localStorage.removeItem('token');
                                localStorage.removeItem('userRole');
                                window.location.href = 'login.html';
                                return;
                            }
                            const errorData = await response.json();
                            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                        }

                        await fetchAndDisplayAllReports();
                        await fetchEmployees();
                    } catch (error) {
                        console.error('Error al asignar reporte:', error);
                        alert(`Error al asignar reporte: ${error.message}`);
                    } finally {
                        employeeList.classList.add('hidden');
                    }
                };
            });
        }

        document.querySelectorAll('.resolve-report-button').forEach(button => {
            button.onclick = function() {
                const reportCard = this.closest('.report-card');
                const resolveForm = reportCard.querySelector('.resolve-form-container');
                resolveForm.classList.toggle('hidden');
            };
        });

        document.querySelectorAll('.submit-resolution-button').forEach(button => {
            button.onclick = async function() {
                const reportCard = this.closest('.report-card');
                const reportId = reportCard.dataset.reportId;
                const resolutionInput = reportCard.querySelector('.resolution-input');
                const reasonInput = reportCard.querySelector('.reason-input');
                const resolution = resolutionInput.value;
                const resolutionReason = reasonInput.value;
                const resolveForm = reportCard.querySelector('.resolve-form-container');

                if (!resolution.trim() || !resolutionReason.trim()) {
                    alert('Por favor, ingresa los detalles y el motivo de la resolución.');
                    return;
                }

                try {
                    const response = await fetch(`${API_BASE_URL_ASSIGN_RESOLVE_REPORT}/${reportId}/resolve`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ resolution, resolutionReason }),
                    });

                    if (!response.ok) {
                        if (response.status === 401 || response.status === 403) {
                            alert('Sesión expirada o no autorizada. Por favor, inicie sesión de nuevo.');
                            localStorage.removeItem('token');
                            localStorage.removeItem('userRole');
                            window.location.href = 'login.html';
                            return;
                        }
                        const errorData = await response.json();
                        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                    }

                    await fetchAndDisplayAllReports();
                    await fetchEmployees();
                } catch (error) {
                    console.error('Error al resolver reporte:', error);
                    alert(`Error al resolver reporte: ${error.message}`);
                } finally {
                    resolveForm.classList.add('hidden');
                    resolutionInput.value = '';
                    reasonInput.value = '';
                }
            };
        });

        document.querySelectorAll('.cancel-resolution-button').forEach(button => {
            button.onclick = function() {
                const reportCard = this.closest('.report-card');
                const resolutionInput = reportCard.querySelector('.resolution-input');
                const reasonInput = reportCard.querySelector('.reason-input');
                const resolveForm = reportCard.querySelector('.resolve-form-container');

                resolveForm.classList.add('hidden');
                resolutionInput.value = '';
                reasonInput.value = '';
            };
        });

        document.onclick = function(event) {
            document.querySelectorAll('.employee-list-container:not(.hidden)').forEach(employeeList => {
                const reportCard = employeeList.closest('.report-card');
                if (reportCard && !reportCard.contains(event.target)) {
                    employeeList.classList.add('hidden');
                }
            });
        };
    }

    await fetchEmployees();
    await fetchAndDisplayAllReports();
});