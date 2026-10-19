import { useCallback } from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import type {
  ApiErrorEnvelope,
  ListTasksResponse,
  Task,
  TaskEnvelope,
  TaskStatus,
} from '@/types/task';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ApiErrorEnvelope;
    if (body?.error?.message) {
      return body.error.message;
    }
  } catch {
    // ignore JSON parse failure
  }
  return `Request failed with status ${response.status}`;
}

function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useTasksApi() {
  const fetchAllTasks = useCallback(async () => {
    const store = useTaskStore.getState();
    store.setLoading(true);
    store.setBoardError(null);

    try {
      const collected: Task[] = [];
      let cursor: string | null = null;
      let hasMore = true;

      while (hasMore) {
        const params = new URLSearchParams({ limit: '100' });
        if (cursor) {
          params.set('cursor', cursor);
        }

        const response = await fetch(`${API_BASE}/api/v1/tasks?${params.toString()}`);
        if (!response.ok) {
          throw new Error(await parseErrorMessage(response));
        }

        const page = (await response.json()) as ListTasksResponse;
        collected.push(...page.data);
        hasMore = Boolean(page.pagination?.has_more && page.pagination?.next_cursor);
        cursor = page.pagination?.next_cursor ?? null;
      }

      useTaskStore.getState().setTasks(collected);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load tasks';
      useTaskStore.getState().setBoardError(message);
    } finally {
      useTaskStore.getState().setLoading(false);
    }
  }, []);

  const createTask = useCallback(
    async (input: { title: string; description: string }): Promise<Task> => {
      const response = await fetch(`${API_BASE}/api/v1/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': generateIdempotencyKey(),
        },
        body: JSON.stringify({
          title: input.title.trim(),
          description: input.description,
          status: 'todo',
        }),
      });

      if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
      }

      const envelope = (await response.json()) as TaskEnvelope;
      useTaskStore.getState().addTask(envelope.data);
      return envelope.data;
    },
    [],
  );

  const updateTask = useCallback(
    async (
      publicId: string,
      input: { title: string; description: string; expectedVersion: number },
    ): Promise<Task> => {
      const response = await fetch(`${API_BASE}/api/v1/tasks/${publicId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: input.title.trim(),
          description: input.description,
          expected_version: input.expectedVersion,
        }),
      });

      if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
      }

      const envelope = (await response.json()) as TaskEnvelope;
      useTaskStore.getState().replaceTask(envelope.data);
      return envelope.data;
    },
    [],
  );

  const moveTaskStatus = useCallback(
    async (publicId: string, newStatus: TaskStatus): Promise<void> => {
      const store = useTaskStore.getState();
      const existingTask = store.tasks.find((t) => t.public_id === publicId);
      if (!existingTask || existingTask.status === newStatus) {
        return;
      }

      store.setBoardError(null);
      store.replaceTask({ ...existingTask, status: newStatus });

      try {
        const response = await fetch(`${API_BASE}/api/v1/tasks/${publicId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: newStatus,
            expected_version: existingTask.version,
          }),
        });

        if (!response.ok) {
          throw new Error(await parseErrorMessage(response));
        }

        const envelope = (await response.json()) as TaskEnvelope;
        useTaskStore.getState().replaceTask(envelope.data);
      } catch (err) {
        useTaskStore.getState().replaceTask(existingTask);
        const message =
          err instanceof Error ? err.message : 'Failed to update task status';
        useTaskStore.getState().setBoardError(message);
      }
    },
    [],
  );

  return {
    fetchAllTasks,
    createTask,
    updateTask,
    moveTaskStatus,
  };
}
