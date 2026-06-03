# SiteModel

SiteModel la workspace BIM/CAD chay tren web cho doi quan ly du an xay dung. MVP hien tai tap trung vao viec chon du an, import file mo hinh, xem preview 3D trong trinh duyet, chon/tat bat object va sua nhanh metadata co ban cua tung object.

## Tinh nang hien co

- Project rail voi danh sach du an, tim kiem du an va chon du an dang lam viec.
- Import panel chap nhan cac dinh dang BIM/CAD: GLB, GLTF, IFC, DXF, DWG, RVT, OBJ, FBX.
- GLB/GLTF co the load truc tiep vao viewer bang object URL trong browser.
- IFC/DXF/DWG/RVT hien duoc dua vao hang doi mock de chuan bi conversion backend.
- 3D coordination viewer dung Three.js, `@react-three/fiber` va `@react-three/drei`, co Move tool de keo object dang chon theo truc X/Y/Z va Fit tool de focus selected object.
- Object list co selection state, visible count, nut an/hien tung object, nut select-and-move tung object, tao object moi va filter theo ten/category/status.
- Inspector cho phep sua object name, material color, review progress, visibility va position X/Y/Z cua object dang chon; position nay sync voi Move tool tren canvas va co nudge/reset nhanh.
- Layers tool hien overlay tom tat category/layer va visible count trong viewer.
- Measure tool hien overlay so do selected object: bounding size va distance from origin.
- Inspector co action Isolate de chi giu object dang chon trong viewer.
- Inspector co action Add issue de tao issue record client-side, gan voi object dang chon, cap nhat status Issue va Resolve de dong issue.
- Version strip cho phep chon file/version active va cap nhat viewer context.
- Topbar co Sync de reset state viewer ve seed model, Share de tao feedback link san sang va Save View de luu snapshot local.
- Unit/UI tests cho project rail va object panel bang Vitest + Testing Library.

## Tech stack

- React 19
- TypeScript
- Vite
- Three.js
- `@react-three/fiber`
- `@react-three/drei`
- Lucide React
- Vitest
- Testing Library

## Cau truc thu muc

```text
src/
  app/
    App.tsx                 # Composition root va state tam thoi cua MVP
  components/
    Brand.tsx               # Logo/brand block
    SectionTitle.tsx        # Title component dung lai cho panel/card
  data/
    mockData.ts             # Du lieu seed: projects, objects, uploads, versions
  features/
    importer/
      ImportPanel.tsx       # Upload/drop-zone va upload list
    inspector/
      InspectorPanel.tsx    # Properties panel cua selected object
    projects/
      ProjectRail.tsx       # Project navigation, search, selection
    viewer/
      ModelViewer.tsx       # Viewer shell, toolbar, canvas metadata
      SceneModel.tsx        # Three.js scene: mock blocks hoac loaded GLB/GLTF
      ObjectPanel.tsx       # Object list, filters, selection, visibility controls
  styles/
    app.css                 # Layout va component styles
  types/
    domain.ts               # Domain types cho project/object/upload/issue
  utils/
    files.ts                # File extension, size formatting, loadable model check
```

## Luong du lieu MVP

`App.tsx` giu state local cho:

- `objects`: object BIM mock dang hien trong viewer, gom visibility, issue/review status, position va scale.
- `issues`: danh sach issue client-side gan theo `objectId`, gom severity, status, thoi diem tao va lifecycle open/resolved.
- `selectedId`: object dang duoc chon.
- `uploads`: danh sach file da import hoac dang queue.
- `activeProjectId`: du an dang duoc chon.
- `projectSearch`: query loc du an.
- `objectSearch`, `categoryFilter`, `statusFilter`: filter client-side cho object list.
- `activeVersion`: file/version dang duoc chon trong version strip.
- `modelUrl` va `modelName`: file GLB/GLTF load truc tiep trong viewer.
- `savedViews`: snapshot local gom project, selected object, active tool, active version va danh sach hidden objects.

Khi nguoi dung import GLB/GLTF, app tao `URL.createObjectURL(file)` va dua file vao `SceneModel`. Cac dinh dang khac duoc danh dau `Queued` de mo phong conversion pipeline.

## Chay du an

```bash
npm install
npm run dev
```

Vite se in URL local, thuong la:

```bash
http://localhost:5173
```

## Scripts

```bash
npm run dev      # Chay dev server
npm run build    # Type-check va build production
npm run lint     # Chay ESLint
npm test         # Chay Vitest unit/UI tests
npm run preview  # Preview ban build
```

## Tinh nang nen lam tiep

1. Persist data: thay mock state bang backend/API cho projects, uploads, objects, view states va annotations.
2. Conversion pipeline: upload raw IFC/DWG/RVT len server, convert sang GLB, tra ve status theo job.
3. Save View nang cao: luu them camera position, zoom/pan va ten view thay vi chi snapshot local.
4. Issue workflow nang cao: them note, screenshot/view context, assignee, reopen va persist issue len backend.
5. Measurement nang cao: cho pick 2 diem bat ky tren canvas va hien distance giua 2 diem.
6. Filter nang cao: them level filter, visible-only filter va reset filters nhanh cho object list.
7. Version loading: click version strip nen load dung file/model data thay vi chi doi viewer context text.
8. Real BIM metadata: map IFC GUID, phase, owner, volume, clashes tu model metadata that.
9. Auth va project permissions: phan quyen owner/editor/viewer cho workspace.
10. E2E tests: them Playwright smoke test cho app load, search project, filter objects, toggle visibility, isolate, add issue va import GLB.

## Development notes

- Active development nen lam tren branch `develop`.
- UI hien tai la MVP dung data mock trong `src/data/mockData.ts`.
- `Topbar` dieu phoi sync/share/save-view feedback; hien tai cac action nay van la client-local state.
- `InspectorPanel` va `ObjectPanel` cung cap cac cach dieu khien visibility, filter, isolate va issue status cua selected/object.
- Chua co backend, nen upload non-GLB chi la queue state tren client.
