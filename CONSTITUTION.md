# Project Constitution & Engineering Principles

This document defines the foundational engineering principles, development workflow, and coding standards for the OYA frontend. All contributors and coding agents must strictly adhere to these rules.

---

## Core Tenets

### 1. Test-Driven Development (TDD) Workflow: Red-Green-Refactor
All feature work, bug fixes, and behavioral changes must follow a disciplined TDD cycle:
1. **Red**: Write a focused, failing unit, hook, or component test that defines the expected behavior, accessibility outcome, input validation, or API contract before writing production code. Run the test to confirm it fails for the expected reason.
2. **Green**: Write the simplest, most direct code necessary to make the test pass. Avoid premature generalization during this step.
3. **Refactor**: Improve naming, remove duplication, and streamline structure while keeping all tests green.

> Never write speculative production code without a corresponding test that justifies its existence.

---

### 2. Do Not Over-Complicate Code (KISS & YAGNI)
- Solve the immediate user problem clearly and completely. Do not introduce speculative hooks, component frameworks, state, or abstractions for hypothetical features.
- Prefer straightforward, predictable React and TypeScript over clever patterns.
- Extract shared hooks, utilities, and UI components only when behavior is reused or when an isolated boundary materially improves testing and comprehension.
- Keep server state, UI state, and derived display state distinct; do not duplicate data across them without a clear synchronization rule.

---

### 3. Prioritize Readability Above All Else
- Code is read significantly more often than it is written. Optimize for the next engineer's understanding.
- Use explicit, descriptive component, hook, prop, state, and event-handler names. Avoid vague acronyms and one-letter names.
- Keep render functions declarative and focused. Move non-trivial data transformation or side-effectful behavior out of JSX when it obscures the UI structure.
- Use guard clauses for unavailable data, loading states, and error states instead of deeply nested conditional rendering.
- Type external data at the API boundary; avoid `any` and unchecked type assertions in application code.

---

### 4. Do Not Create Separate Functions Unless Truly Necessary
- Keep straightforward, single-use logic near its caller when it is readable there.
- Do not fragment linear behavior into trivial helper functions.
- Extract a function, hook, or component only when it is reused, implements an independently testable rule, encapsulates a meaningful boundary, or keeps the caller understandable.

---

### 5. Document Complex Logic and Specific Algorithms
- Routine React, TypeScript, Tailwind, and Zustand usage should be self-explanatory through names and structure.
- Add comments that explain the **why** and non-obvious **how** for complex logic, including optimistic updates and rollback, cursor pagination, persisted state migrations, drag-and-drop behavior, race-condition handling, and third-party workarounds.
- Do not add comments that merely restate the code.

---

## Frontend Architecture Best Practices

### 6. Component, Hook, and State Boundaries
- **Components (`src/components`)** render UI, receive typed props, handle local interaction state, and surface accessible loading, empty, and error states. They must not embed raw HTTP calls.
- **Hooks (`src/hooks`)** coordinate user-facing API operations and side effects. They translate API results into store updates and expose a small, typed interface to components.
- **Store (`src/store`)** contains shared client state only. Keep derived values in selectors or local computations, and preserve immutable state updates.
- **Types (`src/types`)** define transport and domain representations. Convert data explicitly when the frontend model differs from the API contract.
- **Utilities (`src/utils`, `src/lib`)** hold pure reusable formatting, parsing, and class-name helpers. They must not depend on React rendering or global mutable state.

### 7. API Contract and Error Handling
- Treat `be/resources/api/spec.yaml` as the source of truth for backend requests and responses. Update frontend types, API callers, and tests whenever that contract changes.
- Centralize shared API behavior: base URL resolution, JSON headers, bearer-token attachment, response parsing, and standard error-envelope handling.
- Never ignore failed requests. Surface actionable errors in the relevant UI and restore state after failed optimistic updates.
- Send only fields accepted by the endpoint. In particular, preserve immutable server-owned fields such as task `board_id` during updates.
- Handle authentication and authorization failures predictably: clear invalid sessions where appropriate and return the user to a state where they can authenticate again.

### 8. Accessibility and UI Behavior
- Use semantic HTML before ARIA. Every interactive control needs an accessible name and must be usable with keyboard navigation.
- Maintain visible focus states, sufficient contrast, and logical focus management for dialogs, menus, errors, and dynamic content.
- Use native controls or the established Radix UI primitives for interactive behavior; do not recreate accessibility behavior manually without a documented need.
- Ensure loading, empty, validation, and request-error states are announced or otherwise perceivable without relying only on color, motion, or drag-and-drop.
- Keep touch and pointer interactions optional enhancements; critical actions must remain available without drag-and-drop.

### 9. Testing and Mocking
- Unit-test pure utilities and store behavior directly.
- Test hooks with React Testing Library and component behavior through user-visible outcomes rather than implementation details.
- Use Mock Service Worker (MSW) for HTTP integration tests. Handlers must reflect the OpenAPI contract and cover success, validation, authentication, not-found, and conflict responses.
- Reset shared Zustand state, local storage, and MSW handlers between tests to prevent test-order coupling.
- Test optimistic changes for both the successful server response and rollback after errors or version conflicts.

### 10. Verification & Quality Gates
Before work is considered complete:
1. `npm test`: Run all unit, hook, and component tests.
2. `npm run lint`: Run TypeScript type checking.
3. `npm run build`: Verify the production build succeeds.
4. Update tests for every changed behavior, including error and accessibility behavior where applicable.
5. Update `README.md` for changes to configuration, dependencies, setup, workflow, or user-visible functionality.
6. Update `be/resources/api/spec.yaml` before relying on new or changed backend API behavior.

---

### 11. Documentation & Contract Integrity
- Keep `README.md` in sync with architecture, environment variables, scripts, dependencies, and local development workflow.
- Keep frontend API types, MSW handlers, and hook behavior in strict lockstep with `be/resources/api/spec.yaml`.
- Record significant frontend implementation plans in `FEAT-*.md` before implementing multi-step features.
