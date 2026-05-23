import type { ModelObject, Project, UploadItem } from '../types/domain'

export const projects: Project[] = [
  { id: 'p1', name: 'Riverside Tower', site: 'District 7', updated: '12 min ago', files: 18, issues: 7, active: true },
  { id: 'p2', name: 'Long Bien Depot', site: 'Hanoi', updated: '2 hr ago', files: 11, issues: 3, active: false },
  { id: 'p3', name: 'An Phu Villas', site: 'Thu Duc', updated: 'Yesterday', files: 24, issues: 12, active: false },
]

export const baseObjects: ModelObject[] = [
  {
    id: 'core-a',
    name: 'Concrete Core A',
    category: 'Structural',
    level: 'L01-L18',
    status: 'Reviewed',
    color: '#6ed3d1',
    visible: true,
    progress: 92,
    position: [0, 2.1, 0],
    scale: [1.15, 4.2, 1.15],
  },
  {
    id: 'slab-08',
    name: 'Level 08 Slab',
    category: 'Structural',
    level: 'L08',
    status: 'Changed',
    color: '#f0b35b',
    visible: true,
    progress: 66,
    position: [0, 2.2, 0],
    scale: [4.9, 0.18, 3.9],
  },
  {
    id: 'facade-east',
    name: 'East Facade Panels',
    category: 'Envelope',
    level: 'L03-L16',
    status: 'Issue',
    color: '#8ba7ff',
    visible: true,
    progress: 48,
    position: [2.55, 2.2, 0],
    scale: [0.16, 3.7, 3.7],
  },
  {
    id: 'podium',
    name: 'Retail Podium',
    category: 'Site',
    level: 'L00-L02',
    status: 'Reviewed',
    color: '#9fb3a8',
    visible: true,
    progress: 81,
    position: [-0.15, 0.55, -0.2],
    scale: [5.4, 1.1, 4.2],
  },
  {
    id: 'mep-riser',
    name: 'MEP Riser Zone',
    category: 'MEP',
    level: 'L01-L18',
    status: 'Changed',
    color: '#d77968',
    visible: true,
    progress: 59,
    position: [-1.2, 2.5, 0.95],
    scale: [0.42, 4.6, 0.52],
  },
]

export const initialUploads: UploadItem[] = [
  { id: 'u1', name: 'architecture-v12.glb', type: 'GLB', size: '84.2 MB', state: 'Converted' },
  { id: 'u2', name: 'existing-structure.ifc', type: 'IFC', size: '41.8 MB', state: 'Ready' },
]

export const versions = ['Existing survey.ifc', 'Architecture v12.glb', 'Structure v08.ifc', 'Coordination markups.json']

export const allowedModelTypes = ['.glb', '.gltf', '.ifc', '.dxf', '.dwg', '.rvt', '.obj', '.fbx']
