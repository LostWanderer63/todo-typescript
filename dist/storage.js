"use strict";
// Saves and loads tasks in the browser's localStorage, so they survive a reload.
const STORAGE_KEY = "todo-typescript.tasks";
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
/** Type guard: is `value` a well-formed Task? Protects against old or hand-edited data. */
function isTask(value) {
    if (typeof value !== "object" || value === null)
        return false;
    const t = value;
    return (typeof t.id === "string" &&
        typeof t.name === "string" &&
        typeof t.dueDate === "string" &&
        DATE_PATTERN.test(t.dueDate) &&
        (t.status === "pending" || t.status === "completed") &&
        typeof t.createdAt === "number");
}
class LocalStorageTaskRepository {
    constructor(key = STORAGE_KEY) {
        this.key = key;
    }
    load() {
        try {
            const raw = localStorage.getItem(this.key);
            if (!raw)
                return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed.filter(isTask) : [];
        }
        catch {
            // Storage blocked (private mode) or corrupted JSON: start with an empty list.
            return [];
        }
    }
    save(tasks) {
        try {
            localStorage.setItem(this.key, JSON.stringify(tasks));
        }
        catch {
            // Storage full or blocked: the app keeps working, changes just won't persist.
            console.warn("Could not save tasks to localStorage");
        }
    }
}
//# sourceMappingURL=storage.js.map