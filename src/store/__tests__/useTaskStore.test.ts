import { beforeEach, describe, expect, it } from 'vitest';
import { AGE_FILTER_STORAGE_KEY, SELECTED_BOARD_STORAGE_KEY, useTaskStore } from '../useTaskStore';
import type { Board, Task } from '@/types/task';

const sampleBoard: Board = {
  public_id: '01950000-0000-7000-8000-000000000010',
  title: 'Sample Board',
  description: 'Board description',
  created_at: '2026-10-16T10:00:00.000Z',
  updated_at: '2026-10-16T10:00:00.000Z',
};

const secondBoard: Board = {
  public_id: '01950000-0000-7000-8000-000000000020',
  title: 'Second Board',
  description: 'Second description',
  created_at: '2026-10-16T10:00:00.000Z',
  updated_at: '2026-10-16T10:00:00.000Z',
};

const sampleTask: Task = {
  public_id: '01950000-0000-7000-8000-000000000001',
  board_id: '01950000-0000-7000-8000-000000000010',
  title: 'Initial task',
  description: 'Initial description',
  status: 'todo',
  version: 1,
  created_at: '2026-10-16T10:00:00.000Z',
  updated_at: '2026-10-16T10:00:00.000Z',
};

describe('useTaskStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useTaskStore.getState().reset();
  });

  it('initializes with empty tasks, modals closed, not loading, and empty age filters', () => {
    const state = useTaskStore.getState();
    expect(state.tasks).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.boardError).toBeNull();
    expect(state.isAddModalOpen).toBe(false);
    expect(state.selectedTaskId).toBeNull();
    expect(state.selectedAgeFilters).toEqual([]);
  });

  it('adds a task and prepends it to the list', () => {
    const secondTask: Task = {
      ...sampleTask,
      public_id: '01950000-0000-7000-8000-000000000002',
      title: 'Second task',
    };
    useTaskStore.getState().setTasks([sampleTask]);
    useTaskStore.getState().addTask(secondTask);

    expect(useTaskStore.getState().tasks).toEqual([secondTask, sampleTask]);
  });

  it('replaces an existing task by public_id', () => {
    useTaskStore.getState().setTasks([sampleTask]);
    const updated: Task = {
      ...sampleTask,
      title: 'Updated title',
      status: 'doing',
      version: 2,
    };

    useTaskStore.getState().replaceTask(updated);
    expect(useTaskStore.getState().tasks).toEqual([updated]);
  });

  it('manages modal open/close and selected task state', () => {
    useTaskStore.getState().openAddModal();
    expect(useTaskStore.getState().isAddModalOpen).toBe(true);

    useTaskStore.getState().closeAddModal();
    expect(useTaskStore.getState().isAddModalOpen).toBe(false);

    useTaskStore.getState().selectTask(sampleTask.public_id);
    expect(useTaskStore.getState().selectedTaskId).toBe(sampleTask.public_id);

    useTaskStore.getState().selectTask(null);
    expect(useTaskStore.getState().selectedTaskId).toBeNull();
  });

  it('toggles age filters, persists them to localStorage, and resets when cache is cleared', () => {
    useTaskStore.getState().toggleAgeFilter('new');
    useTaskStore.getState().toggleAgeFilter('2 days');

    expect(useTaskStore.getState().selectedAgeFilters).toEqual([
      'new',
      '2 days',
    ]);
    expect(JSON.parse(localStorage.getItem(AGE_FILTER_STORAGE_KEY) || '[]')).toEqual([
      'new',
      '2 days',
    ]);

    // Toggling an already selected filter deselects it
    useTaskStore.getState().toggleAgeFilter('new');
    expect(useTaskStore.getState().selectedAgeFilters).toEqual(['2 days']);

    // Simulating reopening the page hydrates from localStorage
    useTaskStore.getState().syncAgeFiltersFromStorage();
    expect(useTaskStore.getState().selectedAgeFilters).toEqual(['2 days']);

    // Clearing browser storage/cache resets filters back to empty
    localStorage.clear();
    useTaskStore.getState().syncAgeFiltersFromStorage();
    expect(useTaskStore.getState().selectedAgeFilters).toEqual([]);
  });

  it('persists selected board to localStorage and hydrates on reload simulation', () => {
    useTaskStore.getState().selectBoard(sampleBoard.public_id);
    expect(useTaskStore.getState().selectedBoardId).toBe(sampleBoard.public_id);
    expect(localStorage.getItem(SELECTED_BOARD_STORAGE_KEY)).toBe(sampleBoard.public_id);

    // Reopen/reload simulation
    useTaskStore.setState({ selectedBoardId: null });
    useTaskStore.getState().syncSelectedBoardFromStorage();
    expect(useTaskStore.getState().selectedBoardId).toBe(sampleBoard.public_id);

    // Deselecting board clears localStorage
    useTaskStore.getState().selectBoard(null);
    expect(useTaskStore.getState().selectedBoardId).toBeNull();
    expect(localStorage.getItem(SELECTED_BOARD_STORAGE_KEY)).toBeNull();
  });

  it('clears stored selected board on clearSession and invalidates when board is absent in fetched boards', () => {
    useTaskStore.getState().selectBoard(sampleBoard.public_id);
    expect(localStorage.getItem(SELECTED_BOARD_STORAGE_KEY)).toBe(sampleBoard.public_id);

    // Signing out clears session and the stored selected board
    useTaskStore.getState().clearSession();
    expect(useTaskStore.getState().selectedBoardId).toBeNull();
    expect(localStorage.getItem(SELECTED_BOARD_STORAGE_KEY)).toBeNull();

    // Board present in fetched list is preserved
    useTaskStore.getState().selectBoard(sampleBoard.public_id);
    useTaskStore.getState().setBoards([sampleBoard, secondBoard]);
    expect(useTaskStore.getState().selectedBoardId).toBe(sampleBoard.public_id);

    // If fetched boards do not include selected board, resets selection and clears localStorage
    useTaskStore.getState().setBoards([secondBoard]);
    expect(useTaskStore.getState().selectedBoardId).toBeNull();
    expect(localStorage.getItem(SELECTED_BOARD_STORAGE_KEY)).toBeNull();
  });
});
