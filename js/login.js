import { apiFetch } from './api.js';

const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('errorMessage');
const loginButton = document.getElementById('loginButton');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Reset UI state
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';
        loginButton.disabled = true;
        loginButton.textContent = 'Inloggen...';

        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        try {
            // Send login request
            const data = await apiFetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            // Handle token response (support both 'access_token' and 'token')
            const token = data.access_token || data.token;

            if (token) {
                localStorage.setItem('access_token', token);
                
                // If refresh token exists, store it too
                if (data.refresh_token) {
                    localStorage.setItem('refresh_token', data.refresh_token);
                }

                // Redirect to protected dashboard
                window.location.href = 'index';
            } else {
                throw new Error('Ongeldige server response: Geen token ontvangen.');
            }

        } catch (error) {
            console.error('Login error:', error);
            errorMessage.textContent = error.message || 'Inloggen mislukt. Controleer uw gegevens.';
            errorMessage.style.display = 'block';
        } finally {
            loginButton.disabled = false;
            loginButton.textContent = 'Inloggen';
        }
    });
}
