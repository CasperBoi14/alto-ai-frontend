// Auth protection script
(function() {
    const token = localStorage.getItem('access_token');
    
    // Check if token exists
    if (!token) {
        console.warn('No access token found. Redirecting to login.');
        redirectToLogin();
        return;
    }

    // Optional: Decode JWT to check expiration client-side
    // This adds a fast check before making a network request
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const now = Math.floor(Date.now() / 1000);
        
        if (payload.exp && payload.exp < now) {
            console.warn('Token expired. Redirecting to login.');
            localStorage.removeItem('access_token');
            redirectToLogin();
        }
    } catch (e) {
        console.error('Invalid token format.', e);
        // Let the API decide if it's invalid, or redirect now
        // redirectToLogin(); 
    }

    function redirectToLogin() {
        // Prevent redirect loop
        if (!window.location.pathname.endsWith('login.html')) {
            window.location.href = 'login.html';
        }
    }
})();
