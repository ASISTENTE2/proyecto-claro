document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');

    
    const clientViewSection = document.getElementById('client-view-section');
    const reportForm = document.getElementById('report-form');
    const messageDiv = document.getElementById('message');
    const clientReportsList = document.getElementById('client-reports-list');

    
    const navLinkReportsClient = document.getElementById('nav-link-reports-client');
    const navLinkReportsEmployee = document.getElementById('nav-link-reports-employee');
    const navLinkMachines = document.getElementById('nav-link-machines');
    const logoutButton = document.getElementById('logout-button');

    const API_BASE_URL_REPORTS_CLIENT = 'http://localhost:3000/api/reports/my';
    const API_BASE_URL_CREATE_REPORT = 'http://localhost:3000/api/reports';

    
    if (!token || userRole !== 'cliente') {
        
        if (clientViewSection) clientViewSection.style.display = 'none';
        return;
    }


    if (clientViewSection) clientViewSection.style.display = 'block';

    const employeeViewSection = document.getElementById('employee-view-section');
    if (employeeViewSection) employeeViewSection.style.display = 'none';


    if (navLinkReportsClient) navLinkReportsClient.style.display = 'block';
    if (navLinkReportsEmployee) navLinkReportsEmployee.style.display = 'none';
    if (navLinkMachines) navLinkMachines.style.display = 'none';



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


    async function fetchClientReports() {
        if (!clientReportsList) return;
        clientReportsList.innerHTML = '<p>Cargando tus reportes...</p>';
        try {
            const response = await fetch(API_BASE_URL_REPORTS_CLIENT, {
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

            if (reports.length === 0) {
                clientReportsList.innerHTML = '<p>No has enviado ningún reporte todavía.</p>';
            } else {
                clientReportsList.innerHTML = '';
                reports.forEach(report => {
                    const reportDiv = document.createElement('div');
                    reportDiv.className = 'report-item';
                    reportDiv.innerHTML = `
                        <h4>${report.title}</h4>
                        <p>Estado: <strong>${report.status}</strong></p>
                        <p>${report.description}</p>
                        <small>Enviado el: ${new Date(report.createdAt).toLocaleString()}</small>
                        <hr>
                    `;
                    clientReportsList.appendChild(reportDiv);
                });
            }

        } catch (error) {
            console.error('Error al cargar los reportes del cliente:', error);
            clientReportsList.innerHTML = '<p>Error al cargar tus reportes.</p>';
        }
    }


    if (reportForm) {
        reportForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('problemTitle').value;
            const description = document.getElementById('problemDescription').value;

            messageDiv.textContent = '';
            messageDiv.style.color = 'green';

            try {
                const response = await fetch(API_BASE_URL_CREATE_REPORT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ title, description })
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

                const data = await response.json();
                messageDiv.textContent = 'Reporte enviado con éxito!';
                reportForm.reset();
                await fetchClientReports();
            } catch (error) {
                console.error('Error al enviar el reporte:', error);
                messageDiv.style.color = 'red';
                messageDiv.textContent = `Error al enviar el reporte: ${error.message}`;
            }
        });
    }


    await fetchClientReports();
});