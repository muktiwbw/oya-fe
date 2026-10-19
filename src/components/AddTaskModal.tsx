import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTasksApi } from "@/hooks/useTasksApi";
import { useTaskStore } from "@/store/useTaskStore";

export function AddTaskModal() {
  const isAddModalOpen = useTaskStore((state) => state.isAddModalOpen);
  const closeAddModal = useTaskStore((state) => state.closeAddModal);
  const { createTask } = useTasksApi();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetAndClose = () => {
    setTitle("");
    setDescription("");
    setError(null);
    setIsSubmitting(false);
    closeAddModal();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await createTask({ title, description });
      resetAndClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isAddModalOpen}
      onOpenChange={(open) => {
        if (!open) {
          resetAndClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add task</DialogTitle>
          <DialogDescription>
            Create a new task. It will be placed in TODO by default.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="add-task-title">Title</Label>
            <Input
              id="add-task-title"
              placeholder="Enter task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="add-task-description">Description</Label>
            <Textarea
              id="add-task-description"
              placeholder="Enter task description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
            />
          </div>

          {error && (
            <p
              role="alert"
              className="text-xs font-medium text-black bg-neutral-100 border border-black rounded px-3 py-2"
            >
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={resetAndClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || isSubmitting}>
              Add
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
