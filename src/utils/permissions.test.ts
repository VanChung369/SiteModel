import { describe, expect, it } from 'vitest'
import { getProjectPermissions } from './permissions'

describe('getProjectPermissions', () => {
  it('allows owners and editors to modify the workspace', () => {
    expect(getProjectPermissions('Owner')).toMatchObject({
      canImport: true,
      canEditModel: true,
      canManageIssues: true,
      canSaveView: true,
      canSync: true,
    })
    expect(getProjectPermissions('Editor')).toEqual(getProjectPermissions('Owner'))
  })

  it('keeps viewers read-only', () => {
    expect(getProjectPermissions('Viewer')).toEqual({
      canImport: false,
      canEditModel: false,
      canManageIssues: false,
      canSaveView: false,
      canSync: false,
    })
  })
})
