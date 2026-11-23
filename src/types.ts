// Shared types for the To-Do app. This file only declares types,
// so tsc emits an (almost) empty types.js for it.

/** Whether a task is still to do or already finished. */
type TaskStatus = "pending" | "completed";

/** One task in the list. */
interface Task {
  id: string;
  name: string;
  /** Due date as a local calendar date, "YYYY-MM-DD" (what <input type="date"> gives). */
  dueDate: string;
  status: TaskStatus;
  /** When the task was created, in ms since epoch. Used to keep a stable order. */
  createdAt: number;
}

/** What the user types into the form before it becomes a Task. */
interface NewTaskInput {
  name: string;
  dueDate: string;
}

/** Which tasks the list shows. */
type TaskFilter = "all" | "pending" | "completed";

/** Something that can load and save the task list (localStorage here). */
interface TaskRepository {
  load(): Task[];
  save(tasks: Task[]): void;
}

/** Counts shown in the summary line. */
interface TaskStats {
  total: number;
  pending: number;
  completed: number;
  overdue: number;
}
