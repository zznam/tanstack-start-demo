import { createServerFn } from '@tanstack/react-start'
import {
  cacheInputSchema,
  parallelInputSchema,
  updateTaskSchema,
  workspaceSchema,
} from './labModels'
import { labStore } from './labStore.server'
import { runParallelLab } from './parallelLab'

export const readCachedProject = createServerFn({ method: 'GET' })
  .validator(cacheInputSchema)
  .handler(({ data }) => labStore.readProject(data.workspace, data.project))

export const publishBuild = createServerFn({ method: 'POST' })
  .validator(cacheInputSchema)
  .handler(({ data }) => labStore.publishBuild(data.workspace, data.project))

export const readTask = createServerFn({ method: 'GET' })
  .validator(workspaceSchema)
  .handler(({ data }) => labStore.readTask(data.workspace))

export const updateTask = createServerFn({ method: 'POST' })
  .validator(updateTaskSchema)
  .handler(async ({ data }) => {
    await new Promise((resolve) => setTimeout(resolve, 800))
    // Compare and write together, after the delay; a competing edit can win first.
    return labStore.updateTask(
      data.workspace,
      data.expectedVersion,
      data.done,
      data.reject,
    )
  })

export const competingEdit = createServerFn({ method: 'POST' })
  .validator(workspaceSchema)
  .handler(({ data }) => labStore.competingEdit(data.workspace))

export const loadServices = createServerFn({ method: 'POST' })
  .validator(parallelInputSchema)
  .handler(({ data }) => runParallelLab(data))
