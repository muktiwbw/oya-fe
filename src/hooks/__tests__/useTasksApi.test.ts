import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTasksApi } from '../useTasksApi';
import { useTaskStore } from '@/store/useTaskStore';
import type { Task } from '@/types/task';

const task1: Task = {
  public_id: '01950000-0000-7000-8000-000000000001',
  title: 'Task 1',
  description: 'Desc 1',
  status: 'todo',
  version: 1,
  created_at: '2026-10-16T10:00:00.000Z',
  updated_at: '2026-10-16T10:00:00.000Z',
};

const task2: Task = {
  public_id: '01950000-0000-7000-8000-000000000002',
  title: 'Task 2',
  description: 'Desc 2',
  status: 'doing',
  version: 1,
  created_at: '2026-10-16T09:00:00.000Z',
  updated_at: '2026-10-16T09:00:00.000Z',
};

describe('useTasksApi', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    useTaskStore.getState().reset();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches all tasks across cursor pages and populates the store', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [task1],
          pagination: {
            limit: 100,
            count: 1,
            has_more: true,
            next_cursor: 'cursor-page-2',
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [task2],
          pagination: {
            limit: 100,
            count: 1,
            has_more: false,
            next_cursor: null,
          },
        }),
      });

    const { result } = renderHook(() => useTasksApi());

    await act(async () => {
      await result.current.fetchAllTasks();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/v1/tasks?limit=100');
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/v1/tasks?limit=100&cursor=cursor-page-2',
    );
    expect(useTaskStore.getState().tasks).toEqual([task1, task2]);
  });

  it('creates a task in todo status with Idempotency-Key header and prepends to store', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ data: task1 }),
    });

    const { result } = renderHook(() => useTasksApi());

    await act(async () => {
      await result.current.createTask({
        title: 'Task 1',
        description: 'Desc 1',
      });
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/v1/tasks');
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(options.headers['Idempotency-Key']).toBeTruthy();
    expect(JSON.parse(options.body)).toEqual({
      title: 'Task 1',
      description: 'Desc 1',
      status: 'todo',
    });
    expect(useTaskStore.getState().tasks).toEqual([task1]);
  });

  it('updates task title and description with expected_version and updates store', async () => {
    useTaskStore.getState().setTasks([task1]);
    const updatedTask: Task = {
      ...task1,
      title: 'Updated Task 1',
      description: 'Updated Desc 1',
      version: 2,
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: updatedTask }),
    });

    const { result } = renderHook(() => useTasksApi());

    await act(async () => {
      await result.current.updateTask(task1.public_id, {
        title: 'Updated Task 1',
        description: 'Updated Desc 1',
        expectedVersion: 1,
      });
    });

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/v1/tasks/${task1.public_id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Updated Task 1',
          description: 'Updated Desc 1',
          expected_version: 1,
        }),
      },
    );
    expect(useTaskStore.getState().tasks[0]).toEqual(updatedTask);
  });

  it('performs no-op when moveTaskStatus is called with the same status', async () => {
    useTaskStore.getState().setTasks([task1]);
    const { result } = renderHook(() => useTasksApi());

    await act(async () => {
      await result.current.moveTaskStatus(task1.public_id, 'todo');
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('optimistically updates status on moveTaskStatus and reverts on API error', async () => {
    useTaskStore.getState().setTasks([task1]);

    let rejectRequest!: (reason?: unknown) => void;
    fetchMock.mockReturnValueOnce(
      new Promise((_, reject) => {
        rejectRequest = reject;
      }),
    );

    const { result } = renderHook(() => useTasksApi());

    let movePromise!: Promise<void>;
    act(() => {
      movePromise = result.current.moveTaskStatus(task1.public_id, 'doing');
    });

    // Optimistic state is immediately updated to 'doing'
    expect(useTaskStore.getState().tasks[0].status).toBe('doing');

    await act(async () => {
      rejectRequest(new Error('Network failure'));
      await movePromise;
    });

    // Reverted back to 'todo' and boardError set
    expect(useTaskStore.getState().tasks[0].status).toBe('todo');
    expect(useTaskStore.getState().boardError).toContain('Network failure');
  });
});
