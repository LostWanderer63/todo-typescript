"use strict";
// UI and state for the To-Do app.
const MAX_NAME_LENGTH = 120;
// ---------- date helpers ----------
/** Today's local date as "YYYY-MM-DD". */
function todayKey() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
/** Turn "YYYY-MM-DD" into a local Date (new Date("2026-11-23") would be UTC midnight). */
function parseDateKey(key) {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d);
}
const dateFormat = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
});
function formatDueDate(key) {
    return dateFormat.format(parseDateKey(key));
}
function isOverdue(task, today) {
    // "YYYY-MM-DD" strings sort the same way as the dates they represent.
    return task.status === "pending" && task.dueDate < today;
}
function createId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
// ---------- state ----------
class TodoList {
    constructor(repo) {
        this.repo = repo;
        this.tasks = repo.load();
    }
    add(input) {
        const task = {
            id: createId(),
            name: input.name,
            dueDate: input.dueDate,
            status: "pending",
            createdAt: Date.now(),
        };
        this.tasks.push(task);
        this.persist();
        return task;
    }
    toggle(id) {
        const task = this.tasks.find((t) => t.id === id);
        if (!task)
            return;
        task.status = task.status === "pending" ? "completed" : "pending";
        this.persist();
    }
    remove(id) {
        this.tasks = this.tasks.filter((t) => t.id !== id);
        this.persist();
    }
    clearCompleted() {
        const before = this.tasks.length;
        this.tasks = this.tasks.filter((t) => t.status !== "completed");
        this.persist();
        return before - this.tasks.length;
    }
    /** Tasks for the given filter: pending first, then by due date, then by creation. */
    visible(filter) {
        return this.tasks
            .filter((t) => filter === "all" || t.status === filter)
            .sort((a, b) => Number(a.status === "completed") - Number(b.status === "completed") ||
            a.dueDate.localeCompare(b.dueDate) ||
            a.createdAt - b.createdAt);
    }
    stats(today) {
        const completed = this.tasks.filter((t) => t.status === "completed").length;
        return {
            total: this.tasks.length,
            completed,
            pending: this.tasks.length - completed,
            overdue: this.tasks.filter((t) => isOverdue(t, today)).length,
        };
    }
    persist() {
        this.repo.save(this.tasks);
    }
}
// ---------- DOM ----------
/** getElementById that fails loudly if the HTML and the code disagree. */
function byId(id) {
    const el = document.getElementById(id);
    if (!el)
        throw new Error(`Missing element #${id}`);
    return el;
}
class TodoApp {
    constructor(todos) {
        this.todos = todos;
        this.filter = "all";
        this.el = {
            form: byId("taskForm"),
            nameInput: byId("taskName"),
            dateInput: byId("taskDue"),
            error: byId("formError"),
            list: byId("taskList"),
            empty: byId("emptyState"),
            summary: byId("summary"),
            filters: byId("filters"),
            clearBtn: byId("clearCompleted"),
        };
        this.el.dateInput.value = todayKey();
        this.el.nameInput.maxLength = MAX_NAME_LENGTH;
        this.bindEvents();
        this.render();
    }
    bindEvents() {
        this.el.form.addEventListener("submit", (event) => {
            event.preventDefault();
            this.handleAdd();
        });
        // One listener for the whole list (event delegation), so new rows need no wiring.
        this.el.list.addEventListener("change", (event) => {
            const target = event.target;
            if (target instanceof HTMLInputElement && target.type === "checkbox") {
                const id = target.closest("li")?.dataset.id;
                if (id) {
                    this.todos.toggle(id);
                    this.render();
                }
            }
        });
        this.el.list.addEventListener("click", (event) => {
            const button = event.target.closest("button.delete");
            const id = button?.closest("li")?.dataset.id;
            if (id) {
                this.todos.remove(id);
                this.render();
            }
        });
        this.el.filters.addEventListener("click", (event) => {
            const button = event.target.closest("button[data-filter]");
            if (!button)
                return;
            this.filter = button.dataset.filter;
            this.render();
        });
        this.el.clearBtn.addEventListener("click", () => {
            this.todos.clearCompleted();
            this.render();
        });
        this.el.nameInput.addEventListener("input", () => this.showError(""));
        this.el.dateInput.addEventListener("input", () => this.showError(""));
    }
    handleAdd() {
        const input = {
            name: this.el.nameInput.value.trim(),
            dueDate: this.el.dateInput.value,
        };
        const problem = this.validate(input);
        if (problem) {
            this.showError(problem.message, problem.field);
            problem.field.focus();
            return;
        }
        this.todos.add(input);
        this.showError("");
        this.el.nameInput.value = "";
        this.el.nameInput.focus();
        // Show the new task even if the "Completed" filter was on.
        if (this.filter === "completed")
            this.filter = "all";
        this.render();
    }
    validate(input) {
        const { nameInput, dateInput } = this.el;
        if (!input.name)
            return { message: "Please enter a task name.", field: nameInput };
        if (input.name.length > MAX_NAME_LENGTH) {
            return { message: `Task name must be ${MAX_NAME_LENGTH} characters or fewer.`, field: nameInput };
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(input.dueDate)) {
            return { message: "Please choose a due date.", field: dateInput };
        }
        return null;
    }
    /** Show (or clear, with "") the form error and mark the field it belongs to. */
    showError(message, field) {
        this.el.error.textContent = message;
        for (const input of [this.el.nameInput, this.el.dateInput]) {
            input.setAttribute("aria-invalid", String(input === field));
        }
    }
    render() {
        const today = todayKey();
        const tasks = this.todos.visible(this.filter);
        const stats = this.todos.stats(today);
        this.el.list.replaceChildren(...tasks.map((t) => this.renderTask(t, today)));
        this.el.empty.hidden = tasks.length > 0;
        this.el.empty.textContent =
            stats.total === 0
                ? "No tasks yet. Add your first one above."
                : `No ${this.filter} tasks.`;
        const parts = [`${stats.pending} pending`, `${stats.completed} completed`];
        if (stats.overdue)
            parts.push(`${stats.overdue} overdue`);
        this.el.summary.textContent = stats.total ? parts.join(" · ") : "";
        this.el.clearBtn.hidden = stats.completed === 0;
        this.el.filters.querySelectorAll("button[data-filter]").forEach((b) => {
            const active = b.dataset.filter === this.filter;
            b.classList.toggle("active", active);
            b.setAttribute("aria-pressed", String(active));
        });
    }
    renderTask(task, today) {
        const done = task.status === "completed";
        const overdue = isOverdue(task, today);
        const li = document.createElement("li");
        li.className = "task";
        li.classList.toggle("completed", done);
        li.classList.toggle("overdue", overdue);
        li.dataset.id = task.id;
        const checkboxId = `task-${task.id}`;
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = checkboxId;
        checkbox.checked = done;
        const label = document.createElement("label");
        label.htmlFor = checkboxId;
        label.className = "task-body";
        const name = document.createElement("span");
        name.className = "task-name";
        name.textContent = task.name; // textContent, never innerHTML: names are user input
        const due = document.createElement("span");
        due.className = "task-due";
        const when = task.dueDate === today ? "Due today" : `Due ${formatDueDate(task.dueDate)}`;
        due.textContent = overdue ? `${when} · Overdue` : when;
        label.append(name, due);
        const status = document.createElement("span");
        status.className = `badge ${task.status}`;
        status.textContent = done ? "Completed" : "Pending";
        const del = document.createElement("button");
        del.type = "button";
        del.className = "delete";
        del.setAttribute("aria-label", `Delete "${task.name}"`);
        del.title = "Delete task";
        del.textContent = "×";
        li.append(checkbox, label, status, del);
        return li;
    }
}
// ---------- start ----------
document.addEventListener("DOMContentLoaded", () => {
    new TodoApp(new TodoList(new LocalStorageTaskRepository()));
});
//# sourceMappingURL=app.js.map