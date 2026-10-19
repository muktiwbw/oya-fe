# OYA Frontend

A minimalist Kanban task management web application built with React, TypeScript, Vite, Tailwind CSS, and Zustand.

## Features

- **Kanban Board**: Organize tasks across `TODO`, `Doing`, and `Done` columns.
- **Drag and Drop**: Move tasks between columns with `@dnd-kit` and optimistic UI updates.
- **Create & Edit Tasks**: Add new tasks and view/update existing task titles and descriptions in a modal dialog with optimistic concurrency control (`expected_version`).
- **Task Age Indicators & Filtering**:
  - Visual age pills calculated from task creation time (`new`, `1 day`, `2 days`, `3 days`, `>3 days`).
  - Multi-select age filter persisted in `localStorage`.

## Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling & UI**: Tailwind CSS v4, Radix UI primitives (`@radix-ui/react-dialog`, `@radix-ui/react-label`, `@radix-ui/react-slot`), Lucide icons
- **Drag & Drop**: `@dnd-kit/core`
- **State Management**: Zustand
- **Testing**: Vitest + React Testing Library

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
