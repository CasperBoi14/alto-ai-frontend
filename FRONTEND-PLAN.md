# FRONTEND-PLAN.md

> **Console:** GitHub Pages | **API:** `https://api.alto-ai.tech`

---

## Table of Contents

1. [What You're Building](#1-what-youre-building)  
2. [Pages](#2-pages)  
3. [Authentication](#3-authentication)  
4. [Tools List Page](#4-tools-list-page)  
5. [Tool Settings Page](#5-tool-settings-page)  
6. [Agent Behaviour Page](#6-agent-behaviour-page)  
7. [Live Logs Page](#7-live-logs-page)  
8. [Error Handling](#8-error-handling)  
9. [API Quick Reference](#9-api-quick-reference)  
10. [Rules](#10-rules)

---

## 1. What You're Building

A static console hosted on GitHub Pages. One admin user. No registration. Every page except login requires authentication.

Talks **only** to `https://api.alto-ai.tech`. What it does:
- Manage integration settings and OAuth connections
- Configure agent behaviour (personality, language, etc.)
- View live server logs
- Change the admin password

---

## 2. Pages

| Page | Path | Requires login |
|---|---|---|
| Login | `/login` | No |
| Tools list | `/tools` | Yes |
| Tool settings | `/tools/{id}` | Yes |
| Agent behaviour | `/agent` | Yes |
| Live logs | `/logs` | Yes |

Redirect to `/login` if any protected page is accessed without a valid token. After login, redirect to `/tools`.

---

## 3. Authentication

(unchanged — same as before)

- Login: `POST /auth/login` → access + refresh tokens
- Store `access_token` in memory only; `refresh_token` in `localStorage`
- Automatic token refresh before API calls; transparent to user
- Send `Authorization: Bearer <access_token>` on protected requests
- Exceptions: `/auth/login`, `/auth/refresh`, `/health`, `/logs/stream` (token in query param)

---

## 4. Tools List Page

On load:
```
GET https://api.alto-ai.tech/tools
Authorization: Bearer <access_token>
```

Response shape:
```json
{
  "tools": [
    { "id": "discord", "name": "Discord", "active": true,  "version": "1.0.0" },
    { "id": "trello",  "name": "Trello",  "active": false, "version": "1.0.0" }
  ]
}
```

Render one card per tool. Show:
- name
- active badge (green = active, grey = inactive)
- small status text/tooltip explaining difference between "Active" and "Enabled" (see below)

Clicking a card goes to `/tools/{id}`. Re-fetch this list after returning from a tool page.

Important: "active" is computed server-side (backend). The frontend must not attempt to derive activation locally. Display it exactly as returned. The backend computes `active` as:
- active = (all required config/tokens present) AND (tool's enabled flag is true)

UI hint to show:
- Enabled toggle (in settings page) controls whether the tool is allowed to be used by the agent
- Active means the tool is enabled AND its required configuration (tokens, env, oauth connected) is present

---

## 5. Tool Settings Page

On load:
```
GET https://api.alto-ai.tech/tools/{id}
Authorization: Bearer <access_token>
```

This response is the **only source of truth** for what to render. Do not hardcode any field names, labels, or types.

Response shape: (backend will inject an enabled boolean into `settings` — see backend plan)
```json
{
  "id": "trello",
  "name": "Trello",
  "description": "...",
  "active": false,
  "has_oauth": true,
  "settings": [
    {
      "key": "trello__enabled",
      "label": "Enabled",
      "type": "boolean",
      "source": "settings",
      "description": "Allow Alto to call this integration.",
      "current_value": true,
      "required_for_activation": false
    },
    {
      "key": "trello__oauth_token",
      "label": "Trello Connection",
      "type": "oauth",
      "source": "oauth",
      "description": "Connect your Trello account.",
      "connected": false,
      "required_for_activation": true
    },
    {
      "key": "trello__board_id",
      "label": "Default Board ID",
      "type": "string",
      "source": "settings",
      "description": "The Trello board Alto will use by default.",
      "current_value": null,
      "required_for_activation": false
    }
  ]
}
```

Rendering rules (summary; unchanged except for `enabled`):

- The frontend SHOULD render any `boolean` field found in `settings` as a toggle switch.
- The backend will inject `<tool_id>__enabled` (boolean) into `settings` for every tool. Render this toggle near the top of the tool page, and label it "Enabled".
- The Active badge at top remains controlled by `active` returned from the API and must be refreshed after save/connect/disconnect.

What to render per field

Based on `source`:
- `settings` | Editable | Normal input field
- `env` | No | Greyed-out. Show `description` as a note. Exclude from save calls.
- `oauth` | No — has its own controls | Connect/Disconnect button

Based on `type`:
- `string` | Text input | `current_value`
- `secret` | Password input with show/hide toggle | Always empty in the input; backend returns placeholder `"●●●●●●"` when set — do not prefill the input. Only include in save if user typed something.
- `string_array` | Tag input / textarea | `current_value` array
- `boolean` | Toggle switch | `current_value`
- `integer` | Number input | `current_value`
- `oauth` | Connect/Disconnect button | Use `connected` field

OAuth Connect/Disconnect
(unchanged — follow existing flow and polling behavior)

Active status and Enabled toggle
- The `Enabled` toggle (key: `<tool_id>__enabled`) is a user-controlled setting stored via `PUT /settings`.
- The tool is considered active only when:
  - All `required_for_activation` fields are satisfied (tokens present / oauth connected / env values) AND
  - `<tool_id>__enabled` === true
- Show short helper text beneath the Enabled toggle: "Enabled = allow Alto to call this integration. Active = enabled + required configuration present."

Saving
- One Save button per tool. When clicked, send only fields that:
  - Have `source: "settings"`
  - Were changed by the user
  - Are not empty secret fields
- Example (saving enabled):
```
PUT https://api.alto-ai.tech/settings
Authorization: Bearer <access_token>
Content-Type: application/json

{ "trello__enabled": true }
```
- On `200`: show success toast, re-fetch `GET /tools/{id}` to refresh `active`.
- On error: show `error.message`.

Clearing a field
(unchanged — clearing uses `DELETE /settings/{key}`)

---

## 6. Agent Behaviour Page

(unchanged — same dynamic schema rendering as before)

---

## 7. Live Logs Page

(unchanged — same SSE token query param behavior)

---

## 8. Error Handling

(unchanged — display `error.message`, token refresh logic, etc.)

---

## 9. API Quick Reference (relevant additions)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/tools` | Yes | List all tools + active status |
| `GET` | `/tools/{id}` | Yes | Tool manifest + current field values (backend injects `<tool_id>__enabled` as a `settings` boolean) |
| `PUT` | `/settings` | Yes | Save one or more integration settings (including `<tool_id>__enabled`) |
| `DELETE` | `/settings/{key}` | Yes | Clear one setting |
| ... | ... | ... | ... |

---

## 10. Rules (additions)

- The frontend must not compute `active`. Always use the backend `active` value.
- The frontend MUST render any `<tool_id>__enabled` boolean found in `settings` and allow saving it via `PUT /settings`.
- Tool enablement and required configuration are both required for a tool to become `active`.
- Keep all other rules unchanged: no tokens in localStorage, never prefill secrets, static site friendly, etc.

---