document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutButton');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Clear token
            localStorage.removeItem('access_token');
            // Redirect to login
            window.location.href = 'login.html';
        });
    }
});
