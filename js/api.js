import { API_BASE_URL } from './config.js';

/**
 * Common fetch wrapper for Alto AI API
 * @param {string} endpoint - The API endpoint (e.g., '/settings')
 * @param {object} options - Fetch options (method, body, etc.)
 * @returns {Promise<any>} - The JSON response
 */
export async function apiFetch(endpoint, options = {}) {
    // Check if we already have the full URL or just an endpoint
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    // Add Authorization header if token exists
    const token = localStorage.getItem('access_token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers,
        mode: options.mode ?? 'cors',
    };

    // Debugging helper: show the actual request made by the frontend
    console.debug('apiFetch', { url, config });

    try {
        const response = await fetch(url, config);
        console.debug('apiFetch response', { url, status: response.status });
        
        // Handle 401 Unauthorized
        if (response.status === 401) {
            console.warn('Unauthorized access. Redirecting to login.');
            localStorage.removeItem('access_token');
            // Avoid redirect loop if already on login page
            if (!window.location.pathname.endsWith('login.html')) {
                window.location.href = 'login.html';
            }
            // Return error object or throw to be caught by specific handlers (like login form)
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Unauthorized');
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `API Error: ${response.status}`);
        }

        // Return empty object for 204 No Content
        if (response.status === 204) return {};

        return await response.json();
    } catch (error) {
        console.error('API Request Failed:', error);

        // Browser fetch errors often hide CORS/network issues as "Failed to fetch".
        // Provide a clearer message in the UI so it's obvious when the problem is local (file://) or CORS.
        if (error instanceof TypeError) {
            throw new Error(
                'Kan geen verbinding maken met de API. Controleer of je de site via http(s) serveert (niet file://) en dat de API CORS toestaat.'
            );
        }

        throw error;
    }
}
