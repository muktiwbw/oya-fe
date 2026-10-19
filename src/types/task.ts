export type TaskStatus = 'todo' | 'doing' | 'done';

export type TaskAgeLabel = 'new' | '1 day' | '2 days' | '3 days' | '>3 days';

export const TASK_AGE_LABELS: readonly TaskAgeLabel[] = [
  'new',
  '1 day',
  '2 days',
  '3 days',
  '>3 days',
] as const;

export interface Task {
  public_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface Pagination {
  limit: number;
  count: number;
  has_more: boolean;
  next_cursor: string | null;
}

export interface ListTasksResponse {
  data: Task[];
  pagination: Pagination;
}

export interface TaskEnvelope {
  data: Task;
}

export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; reason: string }>;
  };
}
