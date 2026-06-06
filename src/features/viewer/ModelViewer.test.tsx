import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { Children, isValidElement, type ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ModelViewer } from './ModelViewer'
import type { MeasurementPoint, ModelObject } from '../../types/domain'

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: ReactNode }) => (
    <div data-testid="canvas">
      {Children.toArray(children).filter((child) => isValidElement(child) && typeof child.type === 'function')}
    </div>
  ),
  useFrame: () => undefined,
  useThree: () => ({
    camera: {
      position: {
        x: 8.8,
        y: 6.4,
        z: 8.6,
        set: () => undefined,
      },
      zoom: 1,
      updateProjectionMatrix: () => undefined,
    },
  }),
}))

vi.mock('@react-three/drei', () => ({
  ContactShadows: () => null,
  Environment: () => null,
  Grid: () => null,
  Line: () => null,
  OrbitControls: () => null,
  GizmoHelper: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  GizmoViewport: () => null,
}))

vi.mock('./SceneModel', () => ({
  SceneModel: ({
    fitEnabled,
    onMeasurePoint,
    onMoveObject,
  }: {
    fitEnabled?: boolean
    onMeasurePoint: (point: MeasurementPoint) => void
    onMoveObject: (id: string, position: ModelObject['position']) => void
  }) => (
    <div>
      <span>{fitEnabled ? 'Fit enabled' : 'Fit disabled'}</span>
      <button type="button" onClick={() => onMoveObject('core-a', [1.2, 2.3, -0.4])}>
        Simulate object move
      </button>
      <button type="button" onClick={() => onMeasurePoint([0, 0, 0])}>
        Simulate first point
      </button>
      <button type="button" onClick={() => onMeasurePoint([3, 0, 4])}>
        Simulate second point
      </button>
    </div>
  ),
}))

const objects: ModelObject[] = [
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
]

afterEach(cleanup)

describe('ModelViewer', () => {
  it('passes selected-object move updates from the scene to the app', () => {
    const onMoveObject = vi.fn()

    render(
      <ModelViewer
        objects={objects}
        selectedId="core-a"
        modelName="Architecture v12.glb"
        modelUrl={null}
        activeTool="Move"
        activeVersion="Architecture v12.glb"
        cameraViewRequest={null}
        onSelectObject={vi.fn()}
        onSelectTool={vi.fn()}
        onSelectVersion={vi.fn()}
        onMoveObject={onMoveObject}
        onCameraViewChange={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /simulate object move/i }))

    expect(onMoveObject).toHaveBeenCalledWith('core-a', [1.2, 2.3, -0.4])
  })

  it('shows object layer counts when layers tool is active', () => {
    render(
      <ModelViewer
        objects={[
          ...objects,
          {
            id: 'facade-east',
            name: 'East Facade Panels',
            category: 'Envelope',
            level: 'L03-L16',
            status: 'Issue',
            color: '#8ba7ff',
            visible: false,
            progress: 48,
            position: [2.55, 2.2, 0],
            scale: [0.16, 3.7, 3.7],
          },
        ]}
        selectedId="core-a"
        modelName="Architecture v12.glb"
        modelUrl={null}
        activeTool="Layers"
        activeVersion="Architecture v12.glb"
        cameraViewRequest={null}
        onSelectObject={vi.fn()}
        onSelectTool={vi.fn()}
        onSelectVersion={vi.fn()}
        onMoveObject={vi.fn()}
        onCameraViewChange={vi.fn()}
      />,
    )

    const layerSummary = screen.getByLabelText(/layer summary/i)

    expect(within(layerSummary).getByText('Layers')).toBeInTheDocument()
    expect(within(layerSummary).getByText('Structural')).toBeInTheDocument()
    expect(within(layerSummary).getByText(/1 visible/i)).toBeInTheDocument()
    expect(within(layerSummary).getByText('Envelope')).toBeInTheDocument()
    expect(within(layerSummary).getByText(/0 visible/i)).toBeInTheDocument()
  })

  it('shows measurement details for the selected object', () => {
    render(
      <ModelViewer
        objects={objects}
        selectedId="core-a"
        modelName="Architecture v12.glb"
        modelUrl={null}
        activeTool="Measure"
        activeVersion="Architecture v12.glb"
        cameraViewRequest={null}
        onSelectObject={vi.fn()}
        onSelectTool={vi.fn()}
        onSelectVersion={vi.fn()}
        onMoveObject={vi.fn()}
        onCameraViewChange={vi.fn()}
      />,
    )

    const measurePanel = screen.getByLabelText(/measurement summary/i)

    expect(within(measurePanel).getByText('Measure')).toBeInTheDocument()
    expect(within(measurePanel).getByText('Concrete Core A')).toBeInTheDocument()
    expect(within(measurePanel).getByText('1.15 x 4.2 x 1.15 m')).toBeInTheDocument()
    expect(within(measurePanel).getByText('2.10 m')).toBeInTheDocument()
    expect(within(measurePanel).getByText('Picked distance')).toBeInTheDocument()
    expect(within(measurePanel).getAllByText('-')).toHaveLength(3)
  })

  it('shows picked distance after two measurement points are captured', () => {
    render(
      <ModelViewer
        objects={objects}
        selectedId="core-a"
        modelName="Architecture v12.glb"
        modelUrl={null}
        activeTool="Measure"
        activeVersion="Architecture v12.glb"
        cameraViewRequest={null}
        onSelectObject={vi.fn()}
        onSelectTool={vi.fn()}
        onSelectVersion={vi.fn()}
        onMoveObject={vi.fn()}
        onCameraViewChange={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /simulate first point/i }))
    fireEvent.click(screen.getByRole('button', { name: /simulate second point/i }))

    const measurePanel = screen.getByLabelText(/measurement summary/i)

    expect(within(measurePanel).getByText('0.00, 0.00, 0.00')).toBeInTheDocument()
    expect(within(measurePanel).getByText('3.00, 0.00, 4.00')).toBeInTheDocument()
    expect(within(measurePanel).getByText('5.00 m')).toBeInTheDocument()
  })

  it('passes fit state to the scene when fit tool is active', () => {
    render(
      <ModelViewer
        objects={objects}
        selectedId="core-a"
        modelName="Architecture v12.glb"
        modelUrl={null}
        activeTool="Fit"
        activeVersion="Architecture v12.glb"
        cameraViewRequest={null}
        onSelectObject={vi.fn()}
        onSelectTool={vi.fn()}
        onSelectVersion={vi.fn()}
        onMoveObject={vi.fn()}
        onCameraViewChange={vi.fn()}
      />,
    )

    expect(screen.getByText('Fit enabled')).toBeInTheDocument()
  })
})
