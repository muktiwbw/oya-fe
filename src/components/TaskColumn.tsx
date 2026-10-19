import { useDroppable } from '@dnd-kit/core';
import { ArrowDownToLine, Plus } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTaskStore } from '@/store/useTaskStore';
import type { Task, TaskStatus } from '@/types/task';

interface TaskColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  activeTask: Task | null;
  isOverOverride?: boolean;
}

export function TaskColumn({
  status,
  title,
  tasks,
  activeTask,
  isOverOverride,
}: TaskColumnProps) {
  const openAddModal = useTaskStore((state) => state.openAddModal);
  const { isOver, setNodeRef } = useDroppable({
    id: status,
    data: { status },
  });

  const effectiveIsOver = isOverOverride ?? isOver;
  // Only show droppable UI when hovered by a task from a DIFFERENT status
  const isDroppableActive =
    Boolean(effectiveIsOver) &&
    activeTask !== null &&
    activeTask.status !== status;

  return (
    <section
      ref={setNodeRef}
      data-testid={`column-${status}`}
      data-droppable-active={isDroppableActive ? 'true' : 'false'}
      aria-label={`${title} column`}
      className={cn(
        'flex flex-col justify-between rounded-xl border p-4 min-h-[520px] transition-all',
        isDroppableActive
          ? 'border-2 border-dashed border-black bg-neutral-100/90 ring-2 ring-black/15'
          : 'border-neutral-300 bg-white',
      )}
    >
      <div className="flex flex-col gap-4 flex-1">
        <header className="flex items-center justify-between border-b border-neutral-200 pb-3">
          <h2 className="text-sm font-bold tracking-wide uppercase text-black">
            {title}
          </h2>
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-black px-1.5 text-xs font-medium text-black">
            {tasks.length}
          </span>
        </header>

        {isDroppableActive && (
          <div
            role="status"
            className="flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-black bg-white/90 py-6 px-4 text-center"
          >
            <ArrowDownToLine className="h-5 w-5 text-black" />
            <span className="text-xs font-semibold uppercase tracking-wider text-black">
              Drop task here to move to {title}
            </span>
          </div>
        )}

        <div className="flex flex-col gap-2.5 flex-1">
          {tasks.length === 0 && !isDroppableActive ? (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-neutral-200 py-12 text-center">
              <p className="text-xs text-neutral-400">No tasks in {title}</p>
            </div>
          ) : (
            tasks.map((task) => <TaskCard key={task.public_id} task={task} />)
          )}
        </div>
      </div>

      {status === 'todo' && (
        <div className="mt-4 pt-3 border-t border-neutral-200">
          <Button
            type="button"
            variant="outline"
            onClick={openAddModal}
            className="w-full justify-center border-black font-semibold"
          >
            <Plus className="h-4 w-4" />
            Add task
          </Button>
        </div>
      )}
    </section>
  );
}
