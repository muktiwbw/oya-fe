export type TaskStatus = 'todo' | 'doing' | 'done';

export type TaskAgeLabel = 'new' | '1 day' | '2 days' | '3 days' | '>3 days';

export const TASK_AGE_LABELS: readonly TaskAgeLabel[] = [
  'new',
  '1 day',
  '2 days',
  '3 days',
  '>3 days',
] as const;

export interface User {
  public_id: string;
  email: string;
  display_name: string;
}

export interface Session {
  token: string;
  user: User;
}

export interface Board {
  public_id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  public_id: string;
  board_id: string;
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

export interface ListBoardsResponse {
  data: Board[];
}

export interface TaskEnvelope {
  data: Task;
}

export interface BoardEnvelope {
  data: Board;
}

export interface AuthEnvelope {
  data: Session & { token_type: string };
}

export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; reason: string }>;
  };
}
