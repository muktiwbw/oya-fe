import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { AgePill } from './AgePill';
import { cn } from '@/lib/utils';
import { useTaskStore } from '@/store/useTaskStore';
import type { Task } from '@/types/task';
import { getTaskAgeLabel, truncateDescription } from '@/utils/format';

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const selectTask = useTaskStore((state) => state.selectTask);
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.public_id,
      data: { task },
    });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  const truncated = truncateDescription(task.description, 50);
  const ageLabel = getTaskAgeLabel(task.created_at);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      data-testid={`task-card-${task.public_id}`}
      onClick={() => {
        if (!isDragging) {
          selectTask(task.public_id);
        }
      }}
      className={cn(
        'group relative flex flex-col gap-2 rounded-lg border border-black bg-white p-3.5 text-left transition-[background-color,box-shadow] cursor-grab active:cursor-grabbing dragging-card',
        'hover:bg-neutral-50 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
        isDragging && 'z-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-grabbing',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-black leading-snug break-words">
          {task.title}
        </h3>
        <GripVertical
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-neutral-400 transition-colors group-hover:text-black"
        />
      </div>

      {truncated && (
        <p className="text-xs text-neutral-600 leading-relaxed break-words">
          {truncated}
        </p>
      )}

      <div className="mt-1 flex items-center justify-start">
        <AgePill label={ageLabel} />
      </div>
    </div>
  );
}
