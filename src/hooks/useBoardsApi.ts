import { useCallback } from 'react';
import { ApiError, apiRequest } from '@/lib/api';
import { useTaskStore } from '@/store/useTaskStore';
import type { Board, BoardEnvelope, ListBoardsResponse } from '@/types/task';

function tokenOrThrow() {
  const token = useTaskStore.getState().session?.token;
  if (!token) throw new Error('Please sign in to continue');
  return token;
}

function handleFailure(error: unknown): never {
  if (error instanceof ApiError && error.status === 401) {
    useTaskStore.getState().clearSession();
    throw new Error('Your session has expired. Please sign in again.');
  }
  throw error;
}

export function useBoardsApi() {
  const getBoard = useCallback(async (publicId: string): Promise<Board> => {
    try {
      const response = await apiRequest<BoardEnvelope>(`/api/v1/boards/${publicId}`, { token: tokenOrThrow() });
      useTaskStore.getState().upsertBoard(response.data);
      return response.data;
    } catch (error) {
      return handleFailure(error);
    }
  }, []);

  const loadBoards = useCallback(async (): Promise<Board[]> => {
    const store = useTaskStore.getState();
    store.setBoardsLoading(true);
    store.setBoardError(null);
    try {
      const response = await apiRequest<ListBoardsResponse>('/api/v1/boards', { token: tokenOrThrow() });
      store.setBoards(response.data);
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load boards';
      store.setBoardError(message);
      return handleFailure(error);
    } finally {
      useTaskStore.getState().setBoardsLoading(false);
    }
  }, []);

  const createBoard = useCallback(async (input: { title: string; description: string }): Promise<Board> => {
    try {
      const response = await apiRequest<BoardEnvelope>('/api/v1/boards', {
        method: 'POST', token: tokenOrThrow(), body: { title: input.title.trim(), description: input.description },
      });
      useTaskStore.getState().upsertBoard(response.data);
      return response.data;
    } catch (error) {
      return handleFailure(error);
    }
  }, []);

  const updateBoard = useCallback(async (publicId: string, input: { title?: string; description?: string }): Promise<Board> => {
    try {
      const response = await apiRequest<BoardEnvelope>(`/api/v1/boards/${publicId}`, {
        method: 'PATCH', token: tokenOrThrow(), body: input,
      });
      useTaskStore.getState().upsertBoard(response.data);
      return response.data;
    } catch (error) {
      return handleFailure(error);
    }
  }, []);

  const deleteBoard = useCallback(async (publicId: string): Promise<void> => {
    try {
      await apiRequest<void>(`/api/v1/boards/${publicId}`, { method: 'DELETE', token: tokenOrThrow() });
      useTaskStore.getState().removeBoard(publicId);
    } catch (error) {
      return handleFailure(error);
    }
  }, []);

  return { loadBoards, getBoard, createBoard, updateBoard, deleteBoard };
}
