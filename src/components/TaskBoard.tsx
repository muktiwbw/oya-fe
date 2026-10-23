import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useEffect, useState } from "react";
import { AddTaskModal } from "./AddTaskModal";
import { AgePill } from "./AgePill";
import { BoardControls } from "./BoardControls";
import { TaskColumn } from "./TaskColumn";
import { TaskDetailModal } from "./TaskDetailModal";
import { useTasksApi } from "@/hooks/useTasksApi";
import { useBoardsApi } from "@/hooks/useBoardsApi";
import { useAuthApi } from "@/hooks/useAuthApi";
import { useTaskStore } from "@/store/useTaskStore";
import { TASK_AGE_LABELS, type Task, type TaskStatus } from "@/types/task";
import { getTaskAgeLabel } from "@/utils/format";

const COLUMNS: Array<{ status: TaskStatus; title: string }> = [
  { status: "todo", title: "TODO" },
  { status: "doing", title: "Doing" },
  { status: "done", title: "Done" },
];

export function TaskBoard() {
  const tasks = useTaskStore((state) => state.tasks);
  const boardError = useTaskStore((state) => state.boardError);
  const setBoardError = useTaskStore((state) => state.setBoardError);
  const selectedAgeFilters = useTaskStore((state) => state.selectedAgeFilters);
  const toggleAgeFilter = useTaskStore((state) => state.toggleAgeFilter);
  const syncAgeFiltersFromStorage = useTaskStore(
    (state) => state.syncAgeFiltersFromStorage,
  );
  const syncSelectedBoardFromStorage = useTaskStore(
    (state) => state.syncSelectedBoardFromStorage,
  );
  const selectedBoardId = useTaskStore((state) => state.selectedBoardId);
  const isLoading = useTaskStore((state) => state.isLoading);
  const isBoardsLoading = useTaskStore((state) => state.isBoardsLoading);
  const session = useTaskStore((state) => state.session);
  const { fetchTasks, moveTaskStatus } = useTasksApi();
  const { loadBoards } = useBoardsApi();
  const { logout } = useAuthApi();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
  );

  useEffect(() => {
    syncAgeFiltersFromStorage();
    syncSelectedBoardFromStorage();
    if (session) void loadBoards();
  }, [loadBoards, session, syncAgeFiltersFromStorage, syncSelectedBoardFromStorage]);

  useEffect(() => {
    if (selectedBoardId) void fetchTasks(selectedBoardId);
  }, [fetchTasks, selectedBoardId]);

  const visibleTasks =
    selectedAgeFilters.length === 0
      ? tasks
      : tasks.filter((task) =>
          selectedAgeFilters.includes(getTaskAgeLabel(task.created_at)),
        );

  const handleDragStart = (event: DragStartEvent) => {
    const draggedTask = event.active.data.current?.task as Task | undefined;
    if (draggedTask) {
      setActiveTask(draggedTask);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) {
      return;
    }

    const draggedTask = active.data.current?.task as Task | undefined;
    const targetStatus = over.id as TaskStatus;

    if (!draggedTask || draggedTask.status === targetStatus) {
      // Dropping onto current status section is a no-op
      return;
    }

    void moveTaskStatus(draggedTask.public_id, targetStatus);
  };

  const handleDragCancel = () => {
    setActiveTask(null);
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <header className="border-b border-black bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-black">
              OYA!
            </h1>
            <p className="text-xs text-neutral-500">Dump your plans here!</p>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="text-sm font-medium underline"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div
          className="mb-8 flex flex-wrap items-center justify-between gap-4"
        >
          <BoardControls />
          <div
            data-testid="age-filter-bar"
            aria-label="Filter tasks by age"
            className="flex flex-wrap items-center gap-2"
          >
            <span className="mr-1 text-xs font-medium text-neutral-500">
              Filter by age:
            </span>
            {TASK_AGE_LABELS.map((label) => (
              <AgePill
                key={label}
                label={label}
                selected={selectedAgeFilters.includes(label)}
                onClick={() => toggleAgeFilter(label)}
              />
            ))}
          </div>
        </div>
        {boardError && (
          <div
            role="alert"
            className="mb-6 flex items-center justify-between rounded-lg border border-black bg-neutral-100 px-4 py-3 text-sm text-black"
          >
            <span>{boardError}</span>
            <button
              type="button"
              onClick={() => setBoardError(null)}
              className="text-xs font-semibold underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {isBoardsLoading || isLoading ? <p role="status" className="mb-6 text-sm text-neutral-600">Loading workspace…</p> : null}
        {!selectedBoardId && !isBoardsLoading ? (
          <section className="rounded-xl border border-dashed border-neutral-400 p-10 text-center">
            <h2 className="text-xl font-bold">No board selected</h2>
            <p className="mt-2 text-sm text-neutral-600">Create or select board to display tasks.</p>
          </section>
        ) : <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {COLUMNS.map((column) => (
              <TaskColumn
                key={column.status}
                status={column.status}
                title={column.title}
                tasks={visibleTasks.filter(
                  (task) => task.status === column.status,
                )}
                activeTask={activeTask}
              />
            ))}
          </div>
        </DndContext>
        }
      </main>

      <AddTaskModal />
      <TaskDetailModal />
    </div>
  );
}
