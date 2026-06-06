import type { ProjectPermissions, ProjectRole } from '../types/domain'

const editorPermissions: ProjectPermissions = {
  canImport: true,
  canEditModel: true,
  canManageIssues: true,
  canSaveView: true,
  canSync: true,
}

export function getProjectPermissions(role: ProjectRole): ProjectPermissions {
  if (role === 'Viewer') {
    return {
      canImport: false,
      canEditModel: false,
      canManageIssues: false,
      canSaveView: false,
      canSync: false,
    }
  }

  return editorPermissions
}
