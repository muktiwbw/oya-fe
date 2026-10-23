import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { TaskBoard } from '../TaskBoard';
import { SELECTED_BOARD_STORAGE_KEY, useTaskStore } from '@/store/useTaskStore';
import { board, session } from '@/test/mocks/fixtures';
import { server } from '@/test/mocks/server';

function signedInBoard() {
  useTaskStore.getState().setSession(session);
}

describe('TaskBoard', () => {
  it('shows the board placeholder, then loads tasks after a board is selected', async () => {
    signedInBoard();
    const user = userEvent.setup();
    render(<TaskBoard />);
    const selector = await screen.findByRole('combobox', { name: 'Select board' });
    expect(selector).toHaveValue('');
    expect(screen.getByRole('option', { name: 'Select a board' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'No board selected' })).toBeInTheDocument();
    expect(screen.getByText('Create or select board to display tasks.')).toBeInTheDocument();

    await user.selectOptions(selector, board.public_id);
    await waitFor(() => expect(screen.getByTestId('column-todo')).toBeInTheDocument());
    expect(selector).toHaveValue(board.public_id);
    expect(screen.getByRole('button', { name: /add task/i })).toBeInTheDocument();
  });

  it('disables the board selector when no boards exist', async () => {
    signedInBoard();
    server.use(
      http.get('*/api/v1/boards', () => HttpResponse.json({ data: [] })),
    );
    render(<TaskBoard />);
    const selector = await screen.findByRole('combobox', { name: 'Select board' });
    expect(selector).toBeDisabled();
    expect(screen.getByRole('option', { name: 'No board exist' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'No board selected' })).toBeInTheDocument();
  });

  it('creates a board from the create-board modal', async () => {
    signedInBoard();
    const user = userEvent.setup();
    server.use(
      http.get('*/api/v1/boards', () => HttpResponse.json({ data: [] })),
      http.post('*/api/v1/boards', async ({ request }) => {
        expect(await request.json()).toMatchObject({ title: 'First board' });
        return HttpResponse.json({ data: board }, { status: 201 });
      }),
    );
    render(<TaskBoard />);
    await user.click(await screen.findByRole('button', { name: 'Create board' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog', { name: 'Create a board' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Create board' }));
    const modal = screen.getByRole('dialog', { name: 'Create a board' });
    await user.type(within(modal).getByLabelText('Title'), 'First board');
    await user.click(within(modal).getByRole('button', { name: 'Create' }));
    await waitFor(() => expect(screen.getByTestId('column-todo')).toBeInTheDocument());
  });

  it('uses visible controls to open task creation', async () => {
    signedInBoard();
    render(<TaskBoard />);
    const selector = await screen.findByRole('combobox', { name: 'Select board' });
    await userEvent.setup().selectOptions(selector, board.public_id);
    const todoColumn = await screen.findByTestId('column-todo');
    await userEvent.setup().click(within(todoColumn).getByRole('button', { name: /add task/i }));
    expect(screen.getByRole('heading', { name: 'Add task' })).toBeInTheDocument();
  });

  it('restores selected board from localStorage on reload and fetches tasks', async () => {
    localStorage.setItem(SELECTED_BOARD_STORAGE_KEY, board.public_id);
    signedInBoard();
    useTaskStore.getState().syncSelectedBoardFromStorage();
    render(<TaskBoard />);
    const selector = await screen.findByRole('combobox', { name: 'Select board' });
    await waitFor(() => expect(selector).toHaveValue(board.public_id));
    await waitFor(() => expect(screen.getByTestId('column-todo')).toBeInTheDocument());
  });
});
