import { useEffect, useState, type FormEvent } from "react";
import { AgePill } from "./AgePill";
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
import type { TaskStatus } from "@/types/task";
import { getTaskAgeLabel } from "@/utils/format";

export function TaskDetailModal() {
  const selectedTaskId = useTaskStore((state) => state.selectedTaskId);
  const selectTask = useTaskStore((state) => state.selectTask);
  const task = useTaskStore((state) =>
    state.tasks.find((t) => t.public_id === state.selectedTaskId),
  );
  const { updateTask, deleteTask, moveTaskStatus } = useTasksApi();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setStatus(task.status);
      setError(null);
      setIsSubmitting(false);
    }
  }, [task]);

  const isOpen = Boolean(selectedTaskId && task);
  const isContentDirty = task
    ? title !== task.title || description !== task.description
    : false;
  const isStatusDirty = task ? status !== task.status : false;
  const canUpdate = (isContentDirty || isStatusDirty) && title.trim().length > 0 && !isSubmitting;

  const handleClose = () => {
    selectTask(null);
    setError(null);
    setIsSubmitting(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!task || !canUpdate) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      if (isContentDirty) {
        await updateTask(task.public_id, {
          title,
          description,
          expectedVersion: task.version,
        });
      }
      if (isStatusDirty) {
        await moveTaskStatus(task.public_id, status);
      }
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!task || !window.confirm(`Delete “${task.title}”?`)) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await deleteTask(task.public_id);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <DialogTitle>Task detail</DialogTitle>
            {task && <AgePill label={getTaskAgeLabel(task.created_at)} />}
          </div>
          <DialogDescription>
            View and edit the task title and description.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="detail-task-title">Title</Label>
            <Input
              id="detail-task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="detail-task-status">Status</Label>
            <select
              id="detail-task-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as TaskStatus)}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
            >
              <option value="todo">TODO</option>
              <option value="doing">Doing</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="detail-task-description">Description</Label>
            <Textarea
              id="detail-task-description"
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
              onClick={() => void handleDelete()}
              disabled={isSubmitting}
            >
              Delete
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canUpdate}>
              Update
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
