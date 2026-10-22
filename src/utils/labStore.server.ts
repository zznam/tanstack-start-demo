import type { TaskResult, TaskSnapshot } from './labModels'

type Project = 'frontend' | 'backend'
type Workspace = {
  touchedAt: number
  projects: Record<Project, { revision: number; builds: number; reads: number }>
  task: TaskSnapshot
}

// Disposable, bounded demo state. No identity or private user data is stored.
export function createLabStore({
  maxWorkspaces = 200,
  ttlMs = 30 * 60 * 1000,
  now = Date.now,
} = {}) {
  const workspaces = new Map<string, Workspace>()
  function get(workspace: string) {
    const time = now()
    for (const [id, item] of workspaces) {
      if (time - item.touchedAt >= ttlMs) workspaces.delete(id)
    }
    let item = workspaces.get(workspace)
    if (!item) {
      if (workspaces.size >= maxWorkspaces)
        workspaces.delete(workspaces.keys().next().value!)
      item = {
        touchedAt: time,
        projects: {
          frontend: { revision: 1, builds: 12, reads: 0 },
          backend: { revision: 1, builds: 7, reads: 0 },
        },
        task: { title: 'Ship the dashboard', done: false, version: 1 },
      }
    }
    item.touchedAt = time
    workspaces.delete(workspace)
    workspaces.set(workspace, item)
    return item
  }
  return {
    readProject(workspace: string, project: Project) {
      const item = get(workspace).projects[project]
      item.reads++
      return { ...item, project, fetchedAt: new Date(now()).toISOString() }
    },
    publishBuild(workspace: string, project: Project) {
      const item = get(workspace).projects[project]
      item.builds++
      item.revision++
      return { revision: item.revision, builds: item.builds }
    },
    readTask(workspace: string): TaskSnapshot {
      return { ...get(workspace).task }
    },
    updateTask(
      workspace: string,
      expectedVersion: number,
      done: boolean,
      reject: boolean,
    ): TaskResult {
      const item = get(workspace)
      if (reject) return { status: 'rejected', current: { ...item.task } }
      if (item.task.version !== expectedVersion)
        return { status: 'conflict', current: { ...item.task } }
      item.task = { ...item.task, done, version: item.task.version + 1 }
      return { status: 'saved', current: { ...item.task } }
    },
    competingEdit(workspace: string): TaskSnapshot {
      const item = get(workspace)
      item.task = {
        ...item.task,
        done: !item.task.done,
        version: item.task.version + 1,
      }
      return { ...item.task }
    },
  }
}

export const labStore = createLabStore()
