import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskBoard } from '../TaskBoard';
import { TaskColumn } from '../TaskColumn';
import { AGE_FILTER_STORAGE_KEY, useTaskStore } from '@/store/useTaskStore';
import type { Task } from '@/types/task';

describe('TaskBoard & Workflows', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    useTaskStore.getState().reset();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders 3 columns (TODO, Doing, Done) in initial empty state with Add task button in TODO', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [],
        pagination: { limit: 100, count: 0, has_more: false, next_cursor: null },
      }),
    });

    render(<TaskBoard />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByRole('heading', { name: 'OYA!' })).toBeInTheDocument();
    expect(screen.getByText('Dump your plans here!')).toBeInTheDocument();

    const mainRegion = screen.getByRole('main');
    expect(within(mainRegion).getByTestId('age-filter-bar')).toBeInTheDocument();

    const todoColumn = screen.getByTestId('column-todo');
    const doingColumn = screen.getByTestId('column-doing');
    const doneColumn = screen.getByTestId('column-done');

    expect(within(todoColumn).getByText('TODO')).toBeInTheDocument();
    expect(within(doingColumn).getByText('Doing')).toBeInTheDocument();
    expect(within(doneColumn).getByText('Done')).toBeInTheDocument();

    expect(
      within(todoColumn).getByRole('button', { name: /add task/i }),
    ).toBeInTheDocument();
    expect(
      within(doingColumn).queryByRole('button', { name: /add task/i }),
    ).not.toBeInTheDocument();
    expect(
      within(doneColumn).queryByRole('button', { name: /add task/i }),
    ).not.toBeInTheDocument();
  });

  it('opens Add task modal, closes on Cancel, or creates task on Add with 50-char truncated description', async () => {
    const user = userEvent.setup();
    const longDescription =
      '12345678901234567890123456789012345678901234567890_EXTRA_TEXT_BEYOND_50_CHARS';
    const createdTask: Task = {
      public_id: '01950000-0000-7000-8000-000000000010',
      title: 'Implement OYA Frontend',
      description: longDescription,
      status: 'todo',
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [],
          pagination: { limit: 100, count: 0, has_more: false, next_cursor: null },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ data: createdTask }),
      });

    render(<TaskBoard />);

    await user.click(screen.getByRole('button', { name: /add task/i }));
    expect(
      screen.getByRole('heading', { name: 'Add task' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: 'Add task' }),
      ).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /add task/i }));
    const titleInput = screen.getByLabelText(/title/i);
    const descriptionTextarea = screen.getByLabelText(/description/i);

    expect(titleInput.tagName).toBe('INPUT');
    expect(descriptionTextarea.tagName).toBe('TEXTAREA');

    await user.type(titleInput, 'Implement OYA Frontend');
    await user.type(descriptionTextarea, longDescription);
    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: 'Add task' }),
      ).not.toBeInTheDocument();
    });

    const todoColumn = screen.getByTestId('column-todo');
    expect(
      within(todoColumn).getByText('Implement OYA Frontend'),
    ).toBeInTheDocument();
    expect(
      within(todoColumn).getByText(
        '12345678901234567890123456789012345678901234567890...',
      ),
    ).toBeInTheDocument();
  });

  it('opens Task detail modal on card click, shows age pill beside title, keeps Update disabled until dirty, and updates task on click', async () => {
    const user = userEvent.setup();
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const initialTask: Task = {
      public_id: '01950000-0000-7000-8000-000000000020',
      title: 'Original Title',
      description: 'Original Description',
      status: 'todo',
      version: 1,
      created_at: oneDayAgo.toISOString(),
      updated_at: oneDayAgo.toISOString(),
    };
    const updatedTask: Task = {
      ...initialTask,
      title: 'Revised Title',
      description: 'Revised Description',
      version: 2,
    };

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [initialTask],
          pagination: { limit: 100, count: 1, has_more: false, next_cursor: null },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: updatedTask }),
      });

    render(<TaskBoard />);

    const card = await screen.findByTestId(`task-card-${initialTask.public_id}`);
    expect(within(card).getByText('1 day')).toBeInTheDocument();

    await user.click(card);

    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByRole('heading', { name: 'Task detail' }),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('1 day')).toBeInTheDocument();

    const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
    const descriptionInput = screen.getByLabelText(
      /description/i,
    ) as HTMLTextAreaElement;
    const updateButton = screen.getByRole('button', { name: 'Update' });

    expect(titleInput.value).toBe('Original Title');
    expect(descriptionInput.value).toBe('Original Description');
    expect(updateButton).toBeDisabled();

    await user.clear(titleInput);
    await user.type(titleInput, 'Revised Title');
    expect(updateButton).toBeEnabled();

    await user.clear(titleInput);
    await user.type(titleInput, 'Original Title');
    expect(updateButton).toBeDisabled();

    await user.clear(titleInput);
    await user.type(titleInput, 'Revised Title');
    await user.clear(descriptionInput);
    await user.type(descriptionInput, 'Revised Description');
    expect(updateButton).toBeEnabled();

    await user.click(updateButton);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Update' })).not.toBeInTheDocument();
    });

    expect(screen.getByText('Revised Title')).toBeInTheDocument();
    expect(screen.getByText('Revised Description')).toBeInTheDocument();
  });

  it('changes column UI to droppable only when hovered by a task from a DIFFERENT status', () => {
    const todoTask: Task = {
      public_id: '01950000-0000-7000-8000-000000000030',
      title: 'Draggable Todo Task',
      description: 'Desc',
      status: 'todo',
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { rerender } = render(
      <TaskColumn
        status="todo"
        title="TODO"
        tasks={[todoTask]}
        activeTask={todoTask}
        isOverOverride={true}
      />,
    );

    expect(screen.getByTestId('column-todo')).toHaveAttribute(
      'data-droppable-active',
      'false',
    );

    rerender(
      <TaskColumn
        status="doing"
        title="Doing"
        tasks={[]}
        activeTask={todoTask}
        isOverOverride={true}
      />,
    );

    expect(screen.getByTestId('column-doing')).toHaveAttribute(
      'data-droppable-active',
      'true',
    );
    expect(screen.getByText(/drop task here/i)).toBeInTheDocument();
  });

  it('renders 5 age filter pills on top right, filters tasks when clicked, and restores persisted filters from localStorage', async () => {
    const user = userEvent.setup();
    const now = new Date();
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(now.getDate() - 2);
    const fiveDaysAgo = new Date(now);
    fiveDaysAgo.setDate(now.getDate() - 5);

    const newTask: Task = {
      public_id: '01950000-0000-7000-8000-000000000041',
      title: 'Fresh Task',
      description: 'Created today',
      status: 'todo',
      version: 1,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };
    const twoDayTask: Task = {
      public_id: '01950000-0000-7000-8000-000000000042',
      title: 'Two Day Old Task',
      description: 'Created 2 days ago',
      status: 'doing',
      version: 1,
      created_at: twoDaysAgo.toISOString(),
      updated_at: twoDaysAgo.toISOString(),
    };
    const oldTask: Task = {
      public_id: '01950000-0000-7000-8000-000000000043',
      title: 'Ancient Task',
      description: 'Created 5 days ago',
      status: 'done',
      version: 1,
      created_at: fiveDaysAgo.toISOString(),
      updated_at: fiveDaysAgo.toISOString(),
    };

    // Pre-populate localStorage to verify session restoration on mount
    localStorage.setItem(AGE_FILTER_STORAGE_KEY, JSON.stringify(['new']));

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [newTask, twoDayTask, oldTask],
        pagination: { limit: 100, count: 3, has_more: false, next_cursor: null },
      }),
    });

    render(<TaskBoard />);

    const filterBar = screen.getByTestId('age-filter-bar');
    expect(within(filterBar).getByRole('button', { name: 'new' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(
      within(filterBar).getByRole('button', { name: '1 day' }),
    ).toHaveAttribute('aria-pressed', 'false');
    expect(
      within(filterBar).getByRole('button', { name: '2 days' }),
    ).toHaveAttribute('aria-pressed', 'false');
    expect(
      within(filterBar).getByRole('button', { name: '3 days' }),
    ).toHaveAttribute('aria-pressed', 'false');
    expect(
      within(filterBar).getByRole('button', { name: '>3 days' }),
    ).toHaveAttribute('aria-pressed', 'false');

    // Because 'new' was restored from localStorage, only Fresh Task is visible initially
    expect(await screen.findByText('Fresh Task')).toBeInTheDocument();
    expect(screen.queryByText('Two Day Old Task')).not.toBeInTheDocument();
    expect(screen.queryByText('Ancient Task')).not.toBeInTheDocument();

    // Also select '>3 days' -> both Fresh Task and Ancient Task are visible
    await user.click(within(filterBar).getByRole('button', { name: '>3 days' }));
    expect(screen.getByText('Fresh Task')).toBeInTheDocument();
    expect(screen.getByText('Ancient Task')).toBeInTheDocument();
    expect(screen.queryByText('Two Day Old Task')).not.toBeInTheDocument();

    // Deselect both -> all 3 tasks are visible
    await user.click(within(filterBar).getByRole('button', { name: 'new' }));
    await user.click(within(filterBar).getByRole('button', { name: '>3 days' }));
    expect(screen.getByText('Fresh Task')).toBeInTheDocument();
    expect(screen.getByText('Two Day Old Task')).toBeInTheDocument();
    expect(screen.getByText('Ancient Task')).toBeInTheDocument();
  });
});
