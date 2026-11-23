# To-Do List (TypeScript)

A simple To-Do List web app written in plain TypeScript (no frameworks), compiled with `tsc`.

## Features

- Add a task with a name and a due date
- Mark a task completed or pending with a checkbox
- Delete a task
- Tasks are saved in `localStorage`, so they survive a page reload
- Extras: All / Pending / Completed filter, "Clear completed", overdue tasks highlighted, task counts

## Project structure

```
index.html        page layout
styles.css        styling (responsive down to phone width)
src/types.ts      interfaces and types: Task, TaskStatus, NewTaskInput, TaskRepository, ...
src/storage.ts    LocalStorageTaskRepository: load/save tasks, validates stored data
src/app.ts        TodoList (state) and TodoApp (DOM rendering and events)
dist/             JavaScript compiled by tsc (loaded by index.html)
tsconfig.json     compiler settings (strict mode)
```

## Run it

```bash
npm install       # installs TypeScript (dev dependency)
npm run build     # compiles src/*.ts to dist/*.js with tsc
```

Then open `index.html` in a browser (double-click it; no server needed).

While editing, `npm run watch` recompiles on every save.
