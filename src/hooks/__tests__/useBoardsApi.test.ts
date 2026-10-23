import { act, renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { useBoardsApi } from '../useBoardsApi';
import { useTaskStore } from '@/store/useTaskStore';
import { board, session } from '@/test/mocks/fixtures';
import { server } from '@/test/mocks/server';

describe('useBoardsApi', () => {
  it('loads boards with bearer authentication without selecting a board', async () => {
    useTaskStore.getState().setSession(session);
    server.use(http.get('*/api/v1/boards', ({ request }) => {
      expect(request.headers.get('Authorization')).toBe(`Bearer ${session.token}`);
      return HttpResponse.json({ data: [board] });
    }));
    const { result } = renderHook(() => useBoardsApi());
    await act(async () => { await result.current.loadBoards(); });
    expect(useTaskStore.getState().selectedBoardId).toBeNull();
  });

  it('creates and selects a board', async () => {
    useTaskStore.getState().setSession(session);
    server.use(http.post('*/api/v1/boards', async ({ request }) => {
      expect(await request.json()).toMatchObject({ title: 'New board', description: 'Plan' });
      return HttpResponse.json({ data: board }, { status: 201 });
    }));
    const { result } = renderHook(() => useBoardsApi());
    await act(async () => { await result.current.createBoard({ title: 'New board', description: 'Plan' }); });
    expect(useTaskStore.getState().selectedBoardId).toBe(board.public_id);
  });
});
