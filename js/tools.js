import { apiFetch } from './api.js';

async function loadTools() {
    const listContainer = document.querySelector('.quick-start-links');
    if (!listContainer) return;

    try {
        const data = await apiFetch('/tools');
        // If the API returns tools, we could technically re-render the list here.
        // For now, we'll just log it to verify connectivity as the existing HTML 
        // has hardcoded links which work fine for navigation.
        console.log('Tools loaded:', data);

        // Optional: Update UI based on 'active' status if the API returns it
        /*
        if (data.tools) {
            data.tools.forEach(tool => {
               // find corresponding link and update style/badge
            });
        }
        */
    } catch (error) {
        console.error('Failed to load tools:', error);
    }
}

document.addEventListener('DOMContentLoaded', loadTools);
