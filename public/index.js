const API_BASE_MACHINES_URL = 'http://localhost:3000/api/machines';
const API_EMPLOYEES_URL = 'http://localhost:3000/api/employees';

let allEmployees = [];

async function fetchEmployees() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No hay token para obtener empleados.');
        return [];
    }

    try {
        const response = await fetch(API_EMPLOYEES_URL, {
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
                return [];
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allEmployees = await response.json();
        return allEmployees;
    } catch (error) {
        console.error('Error al obtener empleados:', error);
        allEmployees = [];
        return [];
    }
}

function generateEmployeeItems(employeesToShow) {
    let employeeItemsHTML = '';
    employeesToShow.forEach(employee => {
        if (employee.isAvailable && employee.id) {
            employeeItemsHTML += `
                <div class="employee-item" data-employee-id="${employee.id}" data-employee-name="${employee.name}">
                    ${employee.name} (${employee.id})
                </div>
            `;
        }
    });
    
    if (employeeItemsHTML === '') {
        employeeItemsHTML = '<div class="no-employees">No hay empleados disponibles.</div>';
    }
    return employeeItemsHTML;
}

async function fetchAndDisplayMachines() {
    const machineGrid = document.getElementById('machineGrid');
    const token = localStorage.getItem('token');

    if (!machineGrid) {
        console.error('El contenedor #machineGrid no fue encontrado.');
        return;
    }

    if (!token) {
        alert('No autorizado, por favor inicie sesión.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(API_BASE_MACHINES_URL, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('token');
                localStorage.removeItem('userRole');
                window.location.href = 'login.html';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const machines = await response.json();

        machineGrid.innerHTML = '';

        if (machines.length === 0) {
            machineGrid.innerHTML = '<p>No hay máquinas disponibles.</p>';
            console.log("No se encontraron máquinas. Intentando inicializar datos de prueba...");
            
            const initResponse = await fetch(`${API_BASE_MACHINES_URL}/initialize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!initResponse.ok) {
                if (initResponse.status === 401 || initResponse.status === 403) {
                    alert('Sesión expirada o no autorizada al inicializar. Por favor, inicie sesión de nuevo.');
                    localStorage.removeItem('token');
                    localStorage.removeItem('userRole');
                    window.location.href = 'login.html';
                    return;
                }
                const errorData = await initResponse.json();
                throw new Error(errorData.message || `HTTP error! status: ${initResponse.status}`);
            }
            const initData = await initResponse.json();
            console.log(initData.message);

            await fetchEmployees();
            await fetchAndDisplayMachines();
            return;
        } else {
            machines.forEach(machine => {
                const isAssigned = machine.status === 'Ocupado';
                const employeeName = machine.assignedEmployeeName || 'Nadie';
                const statusClass = isAssigned ? 'ocupado' : 'libre';

                const machineCardHTML = `
                    <div class="machine-card ${statusClass}" data-machine-id="${machine.id}">
                        <div class="card-header">Máquina ${machine.name}</div>
                        <div class="card-content">
                            <img src="img/icono_pc.png" alt="Icono de computadora">
                            <div class="status">Estado: ${machine.status} ${isAssigned ? `por ${employeeName}` : ''}</div>
                        </div>
                        <button class="assign-button ${isAssigned ? 'hidden' : ''}">Asignar Empleado</button>
                        <button class="release-button ${!isAssigned ? 'hidden' : ''}">Liberar Máquina</button>
                        <div class="employee-list-container hidden">
                            ${generateEmployeeItems(allEmployees)}
                        </div>
                    </div>
                `;
                machineGrid.insertAdjacentHTML('beforeend', machineCardHTML);
            });
        }
        setupEventListeners();
    } catch (error) {
        console.error('Error al obtener y mostrar máquinas o al inicializar:', error);
        machineGrid.innerHTML = `<p>Error al cargar o inicializar las máquinas: ${error.message}. Asegúrese de que el servidor backend está funcionando y tiene autorización.</p>`;
    }
}

async function initializeBackendData() {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');

    if (!token) {
        alert('No autorizado, por favor inicie sesión.');
        window.location.href = 'login.html';
        return;
    }

    const empleadosNavLink = document.getElementById('empleados-nav-link');
    const reportesNavLink = document.getElementById('reportes-nav-link');

    if (empleadosNavLink && reportesNavLink) {
        if (userRole === 'empleado') {
            empleadosNavLink.style.display = 'block';
            reportesNavLink.style.display = 'block';
        } else if (userRole === 'cliente') {
            empleadosNavLink.style.display = 'none';
            reportesNavLink.style.display = 'block';
        } else {
            empleadosNavLink.style.display = 'none';
            reportesNavLink.style.display = 'none';
            alert('Rol de usuario desconocido. Redirigiendo a login.');
            localStorage.removeItem('token');
            localStorage.removeItem('userRole');
            window.location.href = 'login.html';
            return;
        }
    }

    try {
        await fetchEmployees();
        await fetchAndDisplayMachines();
    } catch (error) {
        console.error('Error al inicializar o cargar datos:', error);
        alert(`Error al inicializar o cargar datos: ${error.message}`);
    }
}

function setupEmployeeItemListeners(container) {
    (container || document).querySelectorAll('.employee-item').forEach(employeeItem => {
        employeeItem.onclick = async function() {
            const employeeId = this.dataset.employeeId;
            const machineCard = this.closest('.machine-card');
            const machineId = machineCard.dataset.machineId;
            const employeeList = this.closest('.employee-list-container');
            const token = localStorage.getItem('token');

            if (!token) {
                alert('No autorizado, por favor inicie sesión.');
                window.location.href = 'login.html';
                return;
            }

            try {
                const response = await fetch(`${API_BASE_MACHINES_URL}/${machineId}/assign`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ employeeId: employeeId }),
                });

                if (!response.ok) {
                    if (response.status === 401 || response.status === 403) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('userRole');
                        window.location.href = 'login.html';
                        return;
                    }
                    const errorData = await response.json();
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                }

                await response.json();
                await fetchEmployees();
                await fetchAndDisplayMachines();

            } catch (error) {
                console.error('Error al asignar máquina:', error);
                alert(`Error al asignar máquina: ${error.message}`);
            } finally {
                employeeList.classList.add('hidden');
            }
        };
    });
}

function setupEventListeners() {
    document.querySelectorAll('.assign-button').forEach(button => {
        button.onclick = function(event) {
            event.stopPropagation();
            const machineCard = this.closest('.machine-card');
            const employeeList = machineCard.querySelector('.employee-list-container');

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

    document.querySelectorAll('.release-button').forEach(button => {
        button.onclick = async function() {
            const machineCard = this.closest('.machine-card');
            const machineId = machineCard.dataset.machineId;
            const token = localStorage.getItem('token');

            if (!token) {
                alert('No autorizado, por favor inicie sesión.');
                window.location.href = 'login.html';
                return;
            }

            try {
                const response = await fetch(`${API_BASE_MACHINES_URL}/${machineId}/release`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                });

                if (!response.ok) {
                    if (response.status === 401 || response.status === 403) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('userRole');
                        window.location.href = 'login.html';
                        return;
                    }
                    const errorData = await response.json();
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                }

                await response.json();
                await fetchEmployees();
                await fetchAndDisplayMachines();

            } catch (error) {
                console.error('Error al liberar máquina:', error);
                alert(`Error al liberar máquina: ${error.message}`);
            }
        };
    });

    document.onclick = function(event) {
        document.querySelectorAll('.employee-list-container:not(.hidden)').forEach(employeeList => {
            const machineCard = employeeList.closest('.machine-card');
            if (machineCard && !machineCard.contains(event.target)) {
                employeeList.classList.add('hidden');
            }
        });
    };
}

document.addEventListener('DOMContentLoaded', async () => {
    await fetchEmployees();
    await fetchAndDisplayMachines();
});