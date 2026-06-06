import type { CameraView, ModelIssue, ModelObject, SavedView, UploadItem } from '../types/domain'

export const WORKSPACE_STORAGE_KEY = 'sitemodel.workspace.v1'
const WORKSPACE_SCHEMA_VERSION = 1

export type WorkspaceSnapshot = {
  schemaVersion: typeof WORKSPACE_SCHEMA_VERSION
  objects: ModelObject[]
  selectedId: string
  uploads: UploadItem[]
  activeTool: string
  activeProjectId: string
  activeVersion: string
  modelName: string
  savedViews: SavedView[]
  viewName: string
  currentCameraView: CameraView
  issues: ModelIssue[]
}

function getBrowserStorage(storage?: Storage) {
  if (storage) {
    return storage
  }

  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.localStorage
  } catch {
    return null
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString)
}

function isVector3(value: unknown): value is [number, number, number] {
  return Array.isArray(value) && value.length === 3 && value.every(isNumber)
}

function isCameraView(value: unknown): value is CameraView {
  return (
    isRecord(value) &&
    isVector3(value.position) &&
    isVector3(value.target) &&
    isNumber(value.zoom)
  )
}

function isModelObjectMetadata(value: unknown) {
  return (
    isRecord(value) &&
    isString(value.ifcGuid) &&
    isString(value.phase) &&
    isString(value.owner) &&
    isNumber(value.volumeM3) &&
    isNumber(value.clashes)
  )
}

function isModelObject(value: unknown): value is ModelObject {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    ['Structural', 'Envelope', 'MEP', 'Site'].includes(String(value.category)) &&
    isString(value.level) &&
    ['Reviewed', 'Changed', 'Issue'].includes(String(value.status)) &&
    isString(value.color) &&
    isBoolean(value.visible) &&
    isNumber(value.progress) &&
    isVector3(value.position) &&
    isVector3(value.scale) &&
    (value.metadata === undefined || isModelObjectMetadata(value.metadata))
  )
}

function isUploadItem(value: unknown): value is UploadItem {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    isString(value.type) &&
    isString(value.size) &&
    ['Ready', 'Converted', 'Queued', 'Converting', 'Failed'].includes(String(value.state)) &&
    (value.conversionProgress === undefined || isNumber(value.conversionProgress)) &&
    (value.jobId === undefined || isString(value.jobId)) &&
    (value.message === undefined || isString(value.message))
  )
}

function isModelIssue(value: unknown): value is ModelIssue {
  if (!isRecord(value) || !isRecord(value.viewContext)) {
    return false
  }

  return (
    isString(value.id) &&
    isString(value.objectId) &&
    isString(value.title) &&
    ['Low', 'Medium', 'High'].includes(String(value.severity)) &&
    ['Open', 'In Review', 'Resolved'].includes(String(value.status)) &&
    isString(value.assignee) &&
    isString(value.note) &&
    isString(value.createdAt) &&
    (value.resolvedAt === undefined || isString(value.resolvedAt)) &&
    isString(value.viewContext.version) &&
    isString(value.viewContext.tool) &&
    isCameraView(value.viewContext.cameraView) &&
    isVector3(value.viewContext.objectPosition)
  )
}

function isSavedView(value: unknown): value is SavedView {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    isString(value.projectId) &&
    isString(value.selectedId) &&
    isString(value.activeTool) &&
    isString(value.activeVersion) &&
    isCameraView(value.cameraView) &&
    isStringArray(value.hiddenObjectIds) &&
    isString(value.createdAt)
  )
}

function isWorkspaceSnapshot(value: unknown): value is WorkspaceSnapshot {
  return (
    isRecord(value) &&
    value.schemaVersion === WORKSPACE_SCHEMA_VERSION &&
    Array.isArray(value.objects) &&
    value.objects.every(isModelObject) &&
    isString(value.selectedId) &&
    Array.isArray(value.uploads) &&
    value.uploads.every(isUploadItem) &&
    isString(value.activeTool) &&
    isString(value.activeProjectId) &&
    isString(value.activeVersion) &&
    isString(value.modelName) &&
    Array.isArray(value.savedViews) &&
    value.savedViews.every(isSavedView) &&
    isString(value.viewName) &&
    isCameraView(value.currentCameraView) &&
    Array.isArray(value.issues) &&
    value.issues.every(isModelIssue)
  )
}

export function loadWorkspaceSnapshot(storage?: Storage) {
  const targetStorage = getBrowserStorage(storage)

  if (!targetStorage) {
    return null
  }

  try {
    const rawSnapshot = targetStorage.getItem(WORKSPACE_STORAGE_KEY)

    if (!rawSnapshot) {
      return null
    }

    const parsedSnapshot: unknown = JSON.parse(rawSnapshot)
    return isWorkspaceSnapshot(parsedSnapshot) ? parsedSnapshot : null
  } catch {
    return null
  }
}

export function saveWorkspaceSnapshot(snapshot: Omit<WorkspaceSnapshot, 'schemaVersion'>, storage?: Storage) {
  const targetStorage = getBrowserStorage(storage)

  if (!targetStorage) {
    return false
  }

  try {
    targetStorage.setItem(
      WORKSPACE_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: WORKSPACE_SCHEMA_VERSION,
        ...snapshot,
      }),
    )
    return true
  } catch {
    return false
  }
}

export function clearWorkspaceSnapshot(storage?: Storage) {
  const targetStorage = getBrowserStorage(storage)

  if (!targetStorage) {
    return false
  }

  try {
    targetStorage.removeItem(WORKSPACE_STORAGE_KEY)
    return true
  } catch {
    return false
  }
}
