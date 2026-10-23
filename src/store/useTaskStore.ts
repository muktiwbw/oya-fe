import { create } from 'zustand';
import {
  TASK_AGE_LABELS,
  type Board,
  type Session,
  type Task,
  type TaskAgeLabel,
} from '@/types/task';

export const AGE_FILTER_STORAGE_KEY = 'oya_age_filters';
export const SELECTED_BOARD_STORAGE_KEY = 'oya_selected_board';

function readSelectedBoardFromStorage(): string | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return window.localStorage.getItem(SELECTED_BOARD_STORAGE_KEY) || null;
}

function writeSelectedBoardToStorage(boardId: string | null) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  if (!boardId) window.localStorage.removeItem(SELECTED_BOARD_STORAGE_KEY);
  else window.localStorage.setItem(SELECTED_BOARD_STORAGE_KEY, boardId);
}

function readAgeFiltersFromStorage(): TaskAgeLabel[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(AGE_FILTER_STORAGE_KEY) || '[]');
    return Array.isArray(parsed)
      ? parsed.filter((item): item is TaskAgeLabel => TASK_AGE_LABELS.includes(item as TaskAgeLabel))
      : [];
  } catch {
    return [];
  }
}

function writeAgeFiltersToStorage(filters: TaskAgeLabel[]) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  if (filters.length === 0) window.localStorage.removeItem(AGE_FILTER_STORAGE_KEY);
  else window.localStorage.setItem(AGE_FILTER_STORAGE_KEY, JSON.stringify(filters));
}

interface TaskStoreState {
  session: Session | null;
  boards: Board[];
  selectedBoardId: string | null;
  tasks: Task[];
  isLoading: boolean;
  isBoardsLoading: boolean;
  boardError: string | null;
  isAddModalOpen: boolean;
  selectedTaskId: string | null;
  selectedAgeFilters: TaskAgeLabel[];
  setSession: (session: Session) => void;
  clearSession: () => void;
  setBoards: (boards: Board[]) => void;
  upsertBoard: (board: Board) => void;
  removeBoard: (publicId: string) => void;
  selectBoard: (publicId: string | null) => void;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  replaceTask: (task: Task) => void;
  removeTask: (publicId: string) => void;
  setLoading: (isLoading: boolean) => void;
  setBoardsLoading: (isLoading: boolean) => void;
  setBoardError: (error: string | null) => void;
  openAddModal: () => void;
  closeAddModal: () => void;
  selectTask: (publicId: string | null) => void;
  toggleAgeFilter: (label: TaskAgeLabel) => void;
  syncAgeFiltersFromStorage: () => void;
  syncSelectedBoardFromStorage: () => void;
  reset: () => void;
}

const workspaceState = { boards: [] as Board[], selectedBoardId: null as string | null, tasks: [] as Task[] };
const transientState = { isLoading: false, isBoardsLoading: false, boardError: null as string | null, isAddModalOpen: false, selectedTaskId: null as string | null };

export const useTaskStore = create<TaskStoreState>((set) => ({
  session: null,
  ...workspaceState,
  selectedBoardId: readSelectedBoardFromStorage(),
  ...transientState,
  selectedAgeFilters: readAgeFiltersFromStorage(),
  setSession: (session) => set({ session }),
  clearSession: () => {
    writeSelectedBoardToStorage(null);
    set({ session: null, ...workspaceState, selectedBoardId: null, ...transientState });
  },
  setBoards: (boards) => set((state) => {
    const isSelectedStillValid = boards.some((board) => board.public_id === state.selectedBoardId);
    const nextSelectedId = isSelectedStillValid ? state.selectedBoardId : null;
    if (nextSelectedId !== state.selectedBoardId) {
      writeSelectedBoardToStorage(nextSelectedId);
    }
    return {
      boards,
      selectedBoardId: nextSelectedId,
      tasks: nextSelectedId ? state.tasks : [],
    };
  }),
  upsertBoard: (board) => set((state) => {
    const nextSelectedId = state.selectedBoardId ?? board.public_id;
    if (nextSelectedId !== state.selectedBoardId) {
      writeSelectedBoardToStorage(nextSelectedId);
    }
    return {
      boards: state.boards.some((item) => item.public_id === board.public_id)
        ? state.boards.map((item) => item.public_id === board.public_id ? board : item)
        : [board, ...state.boards],
      selectedBoardId: nextSelectedId,
    };
  }),
  removeBoard: (publicId) => set((state) => {
    const boards = state.boards.filter((board) => board.public_id !== publicId);
    const wasSelected = state.selectedBoardId === publicId;
    const nextSelectedId = wasSelected ? boards[0]?.public_id ?? null : state.selectedBoardId;
    if (wasSelected) {
      writeSelectedBoardToStorage(nextSelectedId);
    }
    return {
      boards,
      selectedBoardId: nextSelectedId,
      tasks: wasSelected ? [] : state.tasks,
      selectedTaskId: wasSelected ? null : state.selectedTaskId,
    };
  }),
  selectBoard: (selectedBoardId) => {
    writeSelectedBoardToStorage(selectedBoardId);
    set({ selectedBoardId, tasks: [], selectedTaskId: null, boardError: null });
  },
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),
  replaceTask: (updatedTask) => set((state) => ({ tasks: state.tasks.map((task) => task.public_id === updatedTask.public_id ? updatedTask : task) })),
  removeTask: (publicId) => set((state) => ({ tasks: state.tasks.filter((task) => task.public_id !== publicId), selectedTaskId: state.selectedTaskId === publicId ? null : state.selectedTaskId })),
  setLoading: (isLoading) => set({ isLoading }),
  setBoardsLoading: (isBoardsLoading) => set({ isBoardsLoading }),
  setBoardError: (boardError) => set({ boardError }),
  openAddModal: () => set({ isAddModalOpen: true }),
  closeAddModal: () => set({ isAddModalOpen: false }),
  selectTask: (selectedTaskId) => set({ selectedTaskId }),
  toggleAgeFilter: (label) => set((state) => {
    const selectedAgeFilters = state.selectedAgeFilters.includes(label)
      ? state.selectedAgeFilters.filter((item) => item !== label)
      : [...state.selectedAgeFilters, label];
    writeAgeFiltersToStorage(selectedAgeFilters);
    return { selectedAgeFilters };
  }),
  syncAgeFiltersFromStorage: () => set({ selectedAgeFilters: readAgeFiltersFromStorage() }),
  syncSelectedBoardFromStorage: () => set({ selectedBoardId: readSelectedBoardFromStorage() }),
  reset: () => set({
    session: null,
    ...workspaceState,
    selectedBoardId: readSelectedBoardFromStorage(),
    ...transientState,
    selectedAgeFilters: readAgeFiltersFromStorage(),
  }),
}));
