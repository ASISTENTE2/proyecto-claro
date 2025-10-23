document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginMessage = document.getElementById('loginMessage');
    const registerMessage = document.getElementById('registerMessage');
    const formTitle = document.getElementById('formTitle');
    const loginFormSection = document.getElementById('loginFormSection');
    const registerFormSection = document.getElementById('registerFormSection');
    const showRegisterLink = document.getElementById('showRegisterLink');
    const showLoginLink = document.getElementById('showLoginLink');

    const API_AUTH_URL = 'http://localhost:3000/api/auth';

    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginFormSection.classList.add('hidden');
        registerFormSection.classList.remove('hidden');
        formTitle.textContent = 'Registrarse';
        loginMessage.textContent = '';
        registerMessage.textContent = '';
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerFormSection.classList.add('hidden');
        loginFormSection.classList.remove('hidden');
        formTitle.textContent = 'Iniciar Sesión';
        loginMessage.textContent = '';
        registerMessage.textContent = '';
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        loginMessage.className = 'message';
        loginMessage.textContent = 'Iniciando sesión...';

        try {
            const response = await fetch(`${API_AUTH_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('userRole', data.user.role);
                localStorage.setItem('userId', data.user.id);
                localStorage.setItem('userName', data.user.username);

                loginMessage.classList.add('success');
                loginMessage.textContent = 'Sesión iniciada con éxito. Redirigiendo...';

                if (data.user.role === 'empleado') {
                    window.location.href = 'index.html';
                } else if (data.user.role === 'cliente') {
                    window.location.href = 'reports.html';
                } else {
                    window.location.href = 'index.html';
                }
            } else {
                loginMessage.classList.add('error');
                loginMessage.textContent = data.message || 'Error al iniciar sesión.';
            }
        } catch (error) {
            console.error('Error de red o del servidor:', error);
            loginMessage.classList.add('error');
            loginMessage.textContent = 'Error de conexión. Inténtalo de nuevo.';
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            registerMessage.className = 'message error';
            registerMessage.textContent = 'Las contraseñas no coinciden.';
            return;
        }

        registerMessage.className = 'message';
        registerMessage.textContent = 'Registrando usuario...';

        try {
            const response = await fetch(`${API_AUTH_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, role: 'cliente' })
            });

            const data = await response.json();

            if (response.ok) {
                registerMessage.classList.add('success');
                registerMessage.textContent = 'Registro exitoso. Ahora puedes iniciar sesión.';
                setTimeout(() => {
                    loginFormSection.classList.remove('hidden');
                    registerFormSection.classList.add('hidden');
                    formTitle.textContent = 'Iniciar Sesión';
                    document.getElementById('loginUsername').value = username;
                    document.getElementById('loginPassword').value = '';
                    document.getElementById('registerUsername').value = '';
                    document.getElementById('registerPassword').value = '';
                    document.getElementById('confirmPassword').value = '';
                }, 2000);
            } else {
                registerMessage.classList.add('error');
                registerMessage.textContent = data.message || 'Error al registrarse.';
            }
        } catch (error) {
            console.error('Error de red o del servidor:', error);
            registerMessage.classList.add('error');
            registerMessage.textContent = 'Error de conexión. Inténtalo de nuevo.';
        }
    });
});