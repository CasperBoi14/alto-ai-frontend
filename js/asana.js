import { API_BASE_URL, API_KEY } from './config.js';
import { apiFetch } from './api.js';

// Elements
const allowedWorkspaces = document.querySelector('textarea[placeholder="Enter workspace IDs or names, one per line"]');
const defaultAssignee = document.querySelector('input[placeholder="Enter email or user ID"]');
const saveButton = document.getElementById('saveButton');

// Function to save Asana settings
async function saveAsanaSettings() {
    const workspaces = allowedWorkspaces.value.split('\n').map(l => l.trim()).filter(Boolean);
    const assignee = defaultAssignee.value.trim();

    try {
        const response = await apiFetch(`/settings`, {
            method: 'PUT',
            body: JSON.stringify({
                'asana.allowed_workspaces': workspaces,
                'asana.default_assignee': assignee
            })
        });

        if (response.success) {
            alert('Settings saved successfully!');
        } else {
            console.warn('API returned success: false or unexpected response', response);
            alert('Settings saved (check console for details).');
        }
    } catch (error) {
        console.error('Error saving settings:', error);
        alert('Failed to save settings. Please check the console.');
    }
}

// Add event listener
if (saveButton) {
    saveButton.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent default if it's in a form
        saveAsanaSettings();
    });
    // Remove the onclick attribute if present (handled via JS now)
    saveButton.removeAttribute('onclick');
}

// Function to load Asana settings
async function loadAsanaSettings() {
    try {
        const response = await apiFetch('/tools/asana');
        if (response && response.settings) {
            const settings = response.settings;
            
            // Populate allowed workspaces
            if (settings['asana.allowed_workspaces'] && Array.isArray(settings['asana.allowed_workspaces'])) {
                allowedWorkspaces.value = settings['asana.allowed_workspaces'].join('\n');
            }
            
            // Populate default assignee
            if (settings['asana.default_assignee']) {
                defaultAssignee.value = settings['asana.default_assignee'];
            }
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Call on load
document.addEventListener('DOMContentLoaded', loadAsanaSettings);
