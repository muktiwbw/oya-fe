import type { Board, Session, Task } from '@/types/task';

export const session: Session = {
  token: 'test-token',
  user: { public_id: '01950000-0000-7000-8000-000000000001', email: 'test@example.com', display_name: 'Test User' },
};

export const board: Board = {
  public_id: '01950000-0000-7000-8000-000000000010',
  title: 'Product roadmap', description: '', created_at: '2026-10-16T10:00:00.000Z', updated_at: '2026-10-16T10:00:00.000Z',
};

export const task: Task = {
  public_id: '01950000-0000-7000-8000-000000000020', board_id: board.public_id,
  title: 'Initial task', description: 'Initial description', status: 'todo', version: 1,
  created_at: '2026-10-16T10:00:00.000Z', updated_at: '2026-10-16T10:00:00.000Z',
};
