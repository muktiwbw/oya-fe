import { useCallback } from 'react';
import { ApiError, apiRequest } from '@/lib/api';
import { useTaskStore } from '@/store/useTaskStore';
import type { ListTasksResponse, Task, TaskEnvelope, TaskStatus } from '@/types/task';

function generateIdempotencyKey(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `task-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function sessionToken(): string {
  const token = useTaskStore.getState().session?.token;
  if (!token) throw new Error('Please sign in to continue');
  return token;
}

function handleUnauthorized(error: unknown): never {
  if (error instanceof ApiError && error.status === 401) {
    useTaskStore.getState().clearSession();
    throw new Error('Your session has expired. Please sign in again.');
  }
  throw error;
}

export function useTasksApi() {
  const fetchTasks = useCallback(async (boardId: string) => {
    const store = useTaskStore.getState();
    store.setLoading(true);
    store.setBoardError(null);
    try {
      const collected: Task[] = [];
      let cursor: string | null = null;
      do {
        const params = new URLSearchParams({ limit: '100' });
        if (cursor) params.set('cursor', cursor);
        const page = await apiRequest<ListTasksResponse>(`/api/v1/boards/${boardId}/tasks?${params}`, { token: sessionToken() });
        collected.push(...page.data);
        cursor = page.pagination.has_more ? page.pagination.next_cursor : null;
      } while (cursor);
      if (useTaskStore.getState().selectedBoardId === boardId) store.setTasks(collected);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load tasks';
      store.setBoardError(message);
      handleUnauthorized(error);
    } finally {
      useTaskStore.getState().setLoading(false);
    }
  }, []);

  const createTask = useCallback(async (input: { title: string; description: string }): Promise<Task> => {
    const boardId = useTaskStore.getState().selectedBoardId;
    if (!boardId) throw new Error('Select a board before creating a task');
    try {
      const response = await apiRequest<TaskEnvelope>('/api/v1/tasks', {
        method: 'POST', token: sessionToken(), headers: { 'Idempotency-Key': generateIdempotencyKey() },
        body: { board_id: boardId, title: input.title.trim(), description: input.description, status: 'todo' },
      });
      useTaskStore.getState().addTask(response.data);
      return response.data;
    } catch (error) {
      return handleUnauthorized(error);
    }
  }, []);

  const updateTask = useCallback(async (publicId: string, input: { title: string; description: string; expectedVersion: number }): Promise<Task> => {
    try {
      const response = await apiRequest<TaskEnvelope>(`/api/v1/tasks/${publicId}`, {
        method: 'PATCH', token: sessionToken(),
        body: { title: input.title.trim(), description: input.description, expected_version: input.expectedVersion },
      });
      useTaskStore.getState().replaceTask(response.data);
      return response.data;
    } catch (error) {
      return handleUnauthorized(error);
    }
  }, []);

  const deleteTask = useCallback(async (publicId: string): Promise<void> => {
    try {
      await apiRequest<void>(`/api/v1/tasks/${publicId}`, { method: 'DELETE', token: sessionToken() });
      useTaskStore.getState().removeTask(publicId);
    } catch (error) {
      return handleUnauthorized(error);
    }
  }, []);

  const moveTaskStatus = useCallback(async (publicId: string, newStatus: TaskStatus): Promise<void> => {
    const store = useTaskStore.getState();
    const existingTask = store.tasks.find((task) => task.public_id === publicId);
    if (!existingTask || existingTask.status === newStatus) return;
    store.setBoardError(null);
    store.replaceTask({ ...existingTask, status: newStatus });
    try {
      const response = await apiRequest<TaskEnvelope>(`/api/v1/tasks/${publicId}/status`, {
        method: 'PATCH', token: sessionToken(), body: { status: newStatus, expected_version: existingTask.version },
      });
      useTaskStore.getState().replaceTask(response.data);
    } catch (error) {
      useTaskStore.getState().replaceTask(existingTask);
      const message = error instanceof Error ? error.message : 'Failed to update task status';
      useTaskStore.getState().setBoardError(message);
      handleUnauthorized(error);
    }
  }, []);

  return { fetchTasks, createTask, updateTask, deleteTask, moveTaskStatus };
}
