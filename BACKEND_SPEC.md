# Backend API Specification for Alto AI Frontend

This document outlines the API endpoints and behavior required by the Alto AI Frontend. The backend must implement these endpoints to ensure full compatibility.

## Base URL
The frontend expects the API to be available at the URL defined in `js/config.js` (currently `https://api.alto-ai.tech`).
**CORS**: The backend must allow CORS requests from the frontend origin.

## Authentication

### Login
**Endpoint**: `POST /auth/login`

**Request Body**:
```json
{
  "username": "admin",
  "password": "your_password"
}
```

**Response (Success)**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "..."
}
```
*Note: The frontend looks for `access_token` or `token` in the response.*

**Response (Failure)**:
- Status: `401 Unauthorized`
- Body: `{ "message": "Invalid credentials" }`

**JWT Requirements**:
- The `access_token` should be a standard JWT.
- The frontend decodes the payload to check `exp` (expiration time).
- **Admin Role**: If the system supports roles, this token *must* identify the user as an admin to allow access to protected resources if there is role-based access control.

## Tools & Integrations

### List All Tools
**Endpoint**: `GET /tools`
**Auth**: Required (Bearer Token)

**Response**:
```json
{
  "tools": [
    {
      "id": "asana",
      "name": "Asana",
      "enabled": true,
      "status": "connected"
    },
    {
      "id": "github",
      "name": "GitHub",
      "enabled": false,
      "status": "disconnected"
    }
    // ... other tools
  ]
}
```

### Get Tool Settings
**Endpoint**: `GET /tools/{tool_id}`
**Auth**: Required (Bearer Token)
**Example**: `GET /tools/asana`

**Response**:
```json
{
  "settings": {
    "asana.allowed_workspaces": ["workspace_id_1", "workspace_id_2"],
    "asana.default_assignee": "user@example.com"
  }
}
```

### Save Settings
**Endpoint**: `PUT /settings`
**Auth**: Required (Bearer Token)

**Request Body**:
The body contains the specific settings keys to update.
```json
{
  "asana.allowed_workspaces": ["workspace_id_1", "workspace_id_2"],
  "asana.default_assignee": "new_assignee@example.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Settings saved successfully"
}
```

## Admin Functionality

The frontend treats the logged-in user as the main administrator.
- Ensure the login credentials provided establish an admin session.
- All configuration endpoints (`/settings`, `/tools`) require this admin level access.

## Error Handling
- **401 Unauthorized**: Token expired or invalid. Frontend will redirect to login.
- **500 Internal Server Error**: Generic error.
- **204 No Content**: Supported for successful actions with no body.
