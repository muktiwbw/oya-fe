import { http, HttpResponse } from 'msw';
import { board, session } from './fixtures';

const requireAuth = (request: Request) => request.headers.get('Authorization') === `Bearer ${session.token}`;

export const handlers = [
  http.post('*/api/v1/auth/refresh', () => HttpResponse.json({ data: { ...session, token_type: 'Bearer' } })),
  http.post('*/api/v1/auth/logout', ({ request }) => requireAuth(request)
    ? new HttpResponse(null, { status: 204 })
    : HttpResponse.json({ error: { code: 'unauthorized', message: 'unauthorized' } }, { status: 401 })),
  http.get('*/api/v1/boards', ({ request }) => requireAuth(request)
    ? HttpResponse.json({ data: [board] })
    : HttpResponse.json({ error: { code: 'unauthorized', message: 'unauthorized' } }, { status: 401 })),
  http.get('*/api/v1/boards/:boardId/tasks', ({ request }) => requireAuth(request)
    ? HttpResponse.json({ data: [], pagination: { limit: 100, count: 0, has_more: false, next_cursor: null } })
    : HttpResponse.json({ error: { code: 'unauthorized', message: 'unauthorized' } }, { status: 401 })),
];
