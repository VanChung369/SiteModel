export type ModelObjectCategory = 'Structural' | 'Envelope' | 'MEP' | 'Site'

export type ModelObjectStatus = 'Reviewed' | 'Changed' | 'Issue'

export type ModelObject = {
  id: string
  name: string
  category: ModelObjectCategory
  level: string
  status: ModelObjectStatus
  color: string
  visible: boolean
  progress: number
  position: [number, number, number]
  scale: [number, number, number]
}

export type CameraView = {
  position: [number, number, number]
  target: [number, number, number]
  zoom: number
}

export type MeasurementPoint = [number, number, number]

export type ModelIssueSeverity = 'Low' | 'Medium' | 'High'

export type ModelIssueStatus = 'Open' | 'In Review' | 'Resolved'

export type ModelIssue = {
  id: string
  objectId: string
  title: string
  severity: ModelIssueSeverity
  status: ModelIssueStatus
  assignee: string
  note: string
  viewContext: {
    version: string
    tool: string
    cameraView: CameraView
    objectPosition: [number, number, number]
  }
  createdAt: string
  resolvedAt?: string
}

export type Project = {
  id: string
  name: string
  site: string
  updated: string
  files: number
  issues: number
  active: boolean
}

export type UploadItem = {
  id: string
  name: string
  type: string
  size: string
  state: 'Ready' | 'Converted' | 'Queued'
}
