# OYA Frontend

A minimalist Kanban task management web application built with React, TypeScript, Vite, Tailwind CSS, and Zustand.

## Features

- **Authentication & Boards**: Sign in with an approved Google account, create boards from the workspace toolbar, and select which board's tasks to display. The selected board is persisted in `localStorage` alongside other UI-related preferences.
- **Kanban Board**: Organize the selected board's tasks across `TODO`, `Doing`, and `Done` columns.
- **Drag and Drop**: Move tasks between columns with `@dnd-kit` and optimistic UI updates.
- **Create & Edit Tasks**: Add new tasks to the selected board and view/update existing task titles and descriptions in a modal dialog with optimistic concurrency control (`expected_version`).
- **Task Age Indicators & Filtering**:
  - Visual age pills calculated from task creation time (`new`, `1 day`, `2 days`, `3 days`, `>3 days`).
  - Multi-select age filter persisted in `localStorage`.

## Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling & UI**: Tailwind CSS v4, Radix UI primitives (`@radix-ui/react-dialog`, `@radix-ui/react-label`, `@radix-ui/react-slot`), Lucide icons
- **Drag & Drop**: `@dnd-kit/core`
- **State Management**: Zustand
- **Testing**: Vitest + React Testing Library + Mock Service Worker (MSW)

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- Running instance of the OYA backend service (defaults to `http://localhost:8080` in development)

### Installation

```bash
npm install
```

### Environment Variables

All environment variables are optional in local development:

| Variable | Description | Default |
| --- | --- | --- |
| `VITE_BACKEND_ORIGIN` | Backend target URL used by the Vite dev server proxy for `/api` requests | `http://localhost:8080` |
| `VITE_API_BASE_URL` | Base URL prepended to `/api/v1/...` requests in the browser (leave empty when using the dev proxy or same-origin hosting) | `""` |

The frontend keeps access tokens only in memory. On page load it uses the backend's `HttpOnly` refresh cookie to restore a session; sign out revokes that backend session. UI state such as the active board selection (`oya_selected_board`) and age filters (`oya_age_filters`) is stored in `localStorage` so it survives page reloads.

### Authenticated workflow

1. Start the OYA backend, including PostgreSQL migrations, and configure its Google OAuth client credentials.
2. Register `http://localhost:5173/api/v1/auth/google/callback` as the Google OAuth redirect URI. Vite proxies it to the backend so the refresh cookie remains available to the frontend.
3. Add the Google account email to the backend's `whitelisted_users` table, then start the frontend and sign in with Google.
4. Create a board or select an existing board. The task list always loads through that board's scoped endpoint.
5. Create, edit, move, or delete tasks within the selected board. Task board ownership is assigned at creation and cannot be changed later.

### Running the App

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

### Testing & Type Checking

Run unit and component tests:

```bash
npm test
```

Run TypeScript type checking:

```bash
npm run lint
```

## CI/CD & Deployment

GitHub Actions verifies pull requests and deploys the production frontend:

- **CI (`.github/workflows/ci.yaml`)**: Runs on pull requests and pushes to `master`. It installs dependencies with `npm ci`, then runs `npm test`, `npm run lint`, and `npm run build`.
- **Build and Deploy (`.github/workflows/build-and-deploy.yaml`)**: Runs on pushes to `master`. After the same quality gates pass, it builds and publishes `ghcr.io/muktiwbw/oya-fe:latest` and a commit-SHA image, then restarts the `oya-fe` Docker Compose service on the VPS.

The production image serves the Vite bundle through Nginx and falls back to `index.html` for client-side routes. It also proxies `/api` requests to the `oya-be` container over the shared external `web` Docker network, keeping API calls, refresh cookies, and the OAuth callback on the frontend origin. The VPS project directory must contain an `.env` file (or symlink) with the frontend hostname and the backend container port:

```env
OYA_HTTP_DOMAIN=frontend.example.com
OYA_BE_HTTP_PORT=your-backend-container-port
```

`OYA_BE_HTTP_PORT` must match the backend's VPS-only HTTP port configuration; it is not committed to this repository. The backend may use the same `OYA_HTTP_DOMAIN` variable name because Compose resolves it separately in each project directory.

Configure these GitHub Actions repository secrets:

| Secret | Description |
| --- | --- |
| `SSH_HOST` | VPS hostname or IP address |
| `SSH_USER` | SSH username on the VPS |
| `SSH_PRIVATE_KEY` | Private key used to authenticate to the VPS |
| `SSH_PORT` | Optional SSH port; defaults to `22` |
| `PROJECT_PATH` | Absolute frontend project directory on the VPS |
