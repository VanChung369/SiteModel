import { describe, expect, it } from 'vitest'
import { baseObjects, initialUploads } from '../data/mockData'
import type { WorkspaceSnapshot } from './workspaceStorage'
import {
  WORKSPACE_STORAGE_KEY,
  clearWorkspaceSnapshot,
  loadWorkspaceSnapshot,
  saveWorkspaceSnapshot,
} from './workspaceStorage'

class MemoryStorage implements Storage {
  private values = new Map<string, string>()

  get length() {
    return this.values.size
  }

  clear() {
    this.values.clear()
  }

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  key(index: number) {
    return Array.from(this.values.keys())[index] ?? null
  }

  removeItem(key: string) {
    this.values.delete(key)
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

const cameraView = {
  position: [8.8, 6.4, 8.6],
  target: [0, 0, 0],
  zoom: 1,
} satisfies WorkspaceSnapshot['currentCameraView']

function createSnapshot(): Omit<WorkspaceSnapshot, 'schemaVersion'> {
  return {
    objects: baseObjects,
    selectedId: baseObjects[0].id,
    uploads: initialUploads,
    activeTool: 'Move',
    activeProjectId: 'p1',
    activeVersion: 'Architecture v12.glb',
    modelName: 'Architecture v12.glb',
    savedViews: [
      {
        id: 'view-1',
        name: 'Morning review',
        projectId: 'p1',
        selectedId: baseObjects[0].id,
        activeTool: 'Move',
        activeVersion: 'Architecture v12.glb',
        cameraView,
        hiddenObjectIds: ['slab-08'],
        createdAt: 'Today',
      },
    ],
    viewName: 'Morning review',
    currentCameraView: cameraView,
    issues: [
      {
        id: 'issue-1',
        objectId: baseObjects[0].id,
        title: 'Concrete Core A coordination issue',
        severity: 'High',
        status: 'Open',
        assignee: 'Coordination',
        note: 'Check alignment.',
        viewContext: {
          version: 'Architecture v12.glb',
          tool: 'Move',
          cameraView,
          objectPosition: baseObjects[0].position,
        },
        createdAt: 'Today',
      },
    ],
  }
}

describe('workspaceStorage', () => {
  it('saves and loads a valid workspace snapshot', () => {
    const storage = new MemoryStorage()
    const snapshot = createSnapshot()

    expect(saveWorkspaceSnapshot(snapshot, storage)).toBe(true)

    expect(loadWorkspaceSnapshot(storage)).toEqual({
      schemaVersion: 1,
      ...snapshot,
    })
  })

  it('returns null for malformed or incompatible snapshots', () => {
    const storage = new MemoryStorage()

    storage.setItem(WORKSPACE_STORAGE_KEY, '{broken')
    expect(loadWorkspaceSnapshot(storage)).toBeNull()

    storage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify({ schemaVersion: 99 }))
    expect(loadWorkspaceSnapshot(storage)).toBeNull()
  })

  it('clears a stored workspace snapshot', () => {
    const storage = new MemoryStorage()

    saveWorkspaceSnapshot(createSnapshot(), storage)
    expect(storage.length).toBe(1)

    expect(clearWorkspaceSnapshot(storage)).toBe(true)
    expect(loadWorkspaceSnapshot(storage)).toBeNull()
  })
})
