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
