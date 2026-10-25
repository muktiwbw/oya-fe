import { useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useBoardsApi } from '@/hooks/useBoardsApi';
import { useTaskStore } from '@/store/useTaskStore';

export function BoardControls() {
  const boards = useTaskStore((state) => state.boards);
  const selectedBoardId = useTaskStore((state) => state.selectedBoardId);
  const selectBoard = useTaskStore((state) => state.selectBoard);
  const { createBoard } = useBoardsApi();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const closeDialog = () => {
    setIsOpen(false);
    setTitle('');
    setDescription('');
    setError(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await createBoard({ title, description });
      closeDialog();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to create board');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <select
        aria-label="Select board"
        value={selectedBoardId ?? ''}
        disabled={boards.length === 0}
        onChange={(event) => selectBoard(event.target.value || null)}
        className="h-9 min-w-52 rounded-md border border-black bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="" disabled>{boards.length === 0 ? 'No board exist' : 'Select a board'}</option>
        {boards.map((board) => <option key={board.public_id} value={board.public_id}>{board.title}</option>)}
      </select>

      <Dialog open={isOpen} onOpenChange={(open) => open ? setIsOpen(true) : closeDialog()}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="icon" aria-label="Create board">
            <Plus className="size-4" aria-hidden="true" />
          </Button>
        </DialogTrigger>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Create a board</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <label className="grid gap-1 text-sm font-medium" htmlFor="board-title">
              Title
              <Input id="board-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} required />
            </label>
            <label className="grid gap-1 text-sm font-medium" htmlFor="board-description">
              Description
              <Textarea id="board-description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={2000} rows={3} />
            </label>
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || !title.trim()}>{isSubmitting ? 'Creating…' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
