import { renderHook, act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { useTasksApi } from '../useTasksApi';
import { useTaskStore } from '@/store/useTaskStore';
import { board, session, task } from '@/test/mocks/fixtures';
import { server } from '@/test/mocks/server';

function signInAndSelectBoard() {
  useTaskStore.getState().setSession(session);
  useTaskStore.getState().setBoards([board]);
  useTaskStore.getState().selectBoard(board.public_id);
}

describe('useTasksApi', () => {
  it('loads all board task pages with bearer authentication', async () => {
    signInAndSelectBoard();
    let requestCount = 0;
    server.use(http.get('*/api/v1/boards/:boardId/tasks', ({ request }) => {
      expect(request.headers.get('Authorization')).toBe(`Bearer ${session.token}`);
      requestCount += 1;
      return request.url.includes('cursor=next')
        ? HttpResponse.json({ data: [{ ...task, public_id: '01950000-0000-7000-8000-000000000021' }], pagination: { limit: 100, count: 1, has_more: false, next_cursor: null } })
        : HttpResponse.json({ data: [task], pagination: { limit: 100, count: 1, has_more: true, next_cursor: 'next' } });
    }));
    const { result } = renderHook(() => useTasksApi());
    await act(() => result.current.fetchTasks(board.public_id));
    expect(requestCount).toBe(2);
    expect(useTaskStore.getState().tasks).toHaveLength(2);
  });

  it('creates tasks for the selected board with an idempotency key', async () => {
    signInAndSelectBoard();
    server.use(http.post('*/api/v1/tasks', async ({ request }) => {
      expect(request.headers.get('Authorization')).toBe(`Bearer ${session.token}`);
      expect(request.headers.get('Idempotency-Key')).toBeTruthy();
      expect(await request.json()).toMatchObject({ board_id: board.public_id, title: 'New task', status: 'todo' });
      return HttpResponse.json({ data: { ...task, title: 'New task' } }, { status: 201 });
    }));
    const { result } = renderHook(() => useTasksApi());
    await act(async () => { await result.current.createTask({ title: ' New task ', description: '' }); });
    expect(useTaskStore.getState().tasks[0]?.board_id).toBe(board.public_id);
  });

  it('rolls back an optimistic status update after a conflict', async () => {
    signInAndSelectBoard();
    useTaskStore.getState().setTasks([task]);
    server.use(http.patch(`*/api/v1/tasks/${task.public_id}/status`, () => HttpResponse.json({ error: { code: 'version_conflict', message: 'task version does not match expected_version' } }, { status: 409 })));
    const { result } = renderHook(() => useTasksApi());
    let moveRequest: Promise<void> | undefined;
    await act(async () => {
      moveRequest = result.current.moveTaskStatus(task.public_id, 'doing');
      await expect(moveRequest).rejects.toThrow('task version');
    });
    expect(useTaskStore.getState().tasks[0]?.status).toBe('todo');
  });
});
