import { cn } from '@/lib/utils';
import type { TaskAgeLabel } from '@/types/task';

const AGE_PILL_STYLES: Record<TaskAgeLabel, string> = {
  new: 'bg-blue-100 text-blue-800 border-blue-300',
  '1 day': 'bg-green-100 text-green-800 border-green-300',
  '2 days': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  '3 days': 'bg-orange-100 text-orange-800 border-orange-300',
  '>3 days': 'bg-red-100 text-red-800 border-red-300',
};

interface AgePillProps {
  label: TaskAgeLabel;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function AgePill({
  label,
  selected,
  onClick,
  className,
}: AgePillProps) {
  const baseClassName = cn(
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold leading-4 transition-all select-none',
    AGE_PILL_STYLES[label],
    className,
  );

  if (onClick) {
    return (
      <button
        type="button"
        aria-pressed={Boolean(selected)}
        onClick={onClick}
        className={cn(
          baseClassName,
          'cursor-pointer',
          selected
            ? 'ring-2 ring-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] opacity-100'
            : 'opacity-55 hover:opacity-90',
        )}
      >
        {label}
      </button>
    );
  }

  return <span className={baseClassName}>{label}</span>;
}
