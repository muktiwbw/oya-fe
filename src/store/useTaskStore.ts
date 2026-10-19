import { create } from 'zustand';
import {
  TASK_AGE_LABELS,
  type Task,
  type TaskAgeLabel,
} from '@/types/task';

export const AGE_FILTER_STORAGE_KEY = 'oya_age_filters';

function readAgeFiltersFromStorage(): TaskAgeLabel[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(AGE_FILTER_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item): item is TaskAgeLabel =>
      TASK_AGE_LABELS.includes(item as TaskAgeLabel),
    );
  } catch {
    return [];
  }
}

function writeAgeFiltersToStorage(filters: TaskAgeLabel[]) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    if (filters.length === 0) {
      window.localStorage.removeItem(AGE_FILTER_STORAGE_KEY);
    } else {
      window.localStorage.setItem(
        AGE_FILTER_STORAGE_KEY,
        JSON.stringify(filters),
      );
    }
  } catch {
    // ignore storage write failures
  }
}

interface TaskStoreState {
  tasks: Task[];
  isLoading: boolean;
  boardError: string | null;
  isAddModalOpen: boolean;
  selectedTaskId: string | null;
  selectedAgeFilters: TaskAgeLabel[];
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  replaceTask: (task: Task) => void;
  setLoading: (isLoading: boolean) => void;
  setBoardError: (error: string | null) => void;
  openAddModal: () => void;
  closeAddModal: () => void;
  selectTask: (publicId: string | null) => void;
  toggleAgeFilter: (label: TaskAgeLabel) => void;
  syncAgeFiltersFromStorage: () => void;
  reset: () => void;
}

const initialState = {
  tasks: [] as Task[],
  isLoading: false,
  boardError: null as string | null,
  isAddModalOpen: false,
  selectedTaskId: null as string | null,
};

export const useTaskStore = create<TaskStoreState>((set) => ({
  ...initialState,
  selectedAgeFilters: readAgeFiltersFromStorage(),
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),
  replaceTask: (updatedTask) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.public_id === updatedTask.public_id ? updatedTask : task,
      ),
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setBoardError: (boardError) => set({ boardError }),
  openAddModal: () => set({ isAddModalOpen: true }),
  closeAddModal: () => set({ isAddModalOpen: false }),
  selectTask: (selectedTaskId) => set({ selectedTaskId }),
  toggleAgeFilter: (label) =>
    set((state) => {
      const exists = state.selectedAgeFilters.includes(label);
      const nextFilters = exists
        ? state.selectedAgeFilters.filter((item) => item !== label)
        : [...state.selectedAgeFilters, label];
      writeAgeFiltersToStorage(nextFilters);
      return { selectedAgeFilters: nextFilters };
    }),
  syncAgeFiltersFromStorage: () =>
    set({ selectedAgeFilters: readAgeFiltersFromStorage() }),
  reset: () =>
    set({
      ...initialState,
      selectedAgeFilters: readAgeFiltersFromStorage(),
    }),
}));
