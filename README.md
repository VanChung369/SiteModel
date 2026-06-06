# SiteModel

SiteModel la workspace BIM/CAD chay tren web cho doi quan ly du an xay dung. MVP hien tai tap trung vao viec chon du an, import file mo hinh, xem preview 3D trong trinh duyet, chon/tat bat object va sua nhanh metadata co ban cua tung object.

## Tinh nang hien co

- Project rail voi danh sach du an, tim kiem du an va chon du an dang lam viec.
- Project rail hien role Owner/Editor/Viewer theo tung du an; Viewer la read-only va bi chan import, edit model, issue workflow, save view va sync.
- Import panel chap nhan cac dinh dang BIM/CAD: GLB, GLTF, IFC, DXF, DWG, RVT, OBJ, FBX.
- GLB/GLTF co the load truc tiep vao viewer bang object URL trong browser.
- IFC/DXF/DWG/RVT/OBJ/FBX hien duoc dua vao conversion queue co job id, progress, status message va trang thai converted mock de chuan bi backend.
- 3D coordination viewer dung Three.js, `@react-three/fiber` va `@react-three/drei`, co Move tool de keo object dang chon theo truc X/Y/Z va Fit tool de focus selected object.
- Object list co selection state, visible count, nut an/hien tung object, nut select-and-move tung object, tao object moi va filter theo ten/category/status.
- Object list co filter nang cao theo level, visible-only va reset filters nhanh.
- Inspector cho phep sua object name, material color, review progress, visibility va position X/Y/Z cua object dang chon; position nay sync voi Move tool tren canvas va co nudge/reset nhanh.
- Inspector hien metadata BIM theo tung object: IFC GUID, phase, owner, volume va clash count tu seed model/version hien tai.
- Layers tool hien overlay tom tat category/layer va visible count trong viewer.
- Measure tool hien overlay so do selected object, bounding size, distance from origin va cho pick 2 diem tren viewer de tinh khoang cach.
- Inspector co action Isolate de chi giu object dang chon trong viewer.
- Inspector co issue workflow client-side: assignee, severity, note, view context, nut khoi phuc dung view/tool/camera cua issue, In Review, Resolve va Reopen cho object dang chon.
- Workspace co issue register ngang de scan tat ca issue hien co va quay ve dung object/view context tu bat ky selection nao.
- Version strip cho phep chon file/version active va load bo object mock rieng cho tung version vao viewer.
- Topbar co Sync de reset state viewer ve seed model, Share de tao link `#view=` co the mo lai project/version/object/tool/camera/hidden objects, va Save View de luu snapshot local kem ten view, camera position/target/zoom va danh sach view co the load lai.
- Workspace state duoc luu vao localStorage: objects, selected object, uploads, active version/tool, issues, saved views, view name va camera view duoc khoi phuc sau khi reload.
- Unit/UI tests cho project rail/object panel/inspector/viewer bang Vitest + Testing Library.
- Playwright E2E smoke tests cho app load, object filter/visibility, direct drag selected object, measure, issue workflow, version loading, file import conversion queue va mobile viewer controls.

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
- Playwright

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
- `objects[].metadata`: metadata BIM theo object, gom IFC GUID, phase, owner, volume va clash count.
- `issues`: danh sach issue client-side gan theo `objectId`, gom severity, assignee, note, view context, status, thoi diem tao va lifecycle open/in-review/resolved/reopen.
- `selectedId`: object dang duoc chon.
- `uploads`: danh sach file da import hoac dang queue.
- `activeProjectId`: du an dang duoc chon.
- `activeProject.role`: role quyen Owner/Editor/Viewer dung de tinh permission client-side cho import, edit model, issue workflow, save view va sync.
- `projectSearch`: query loc du an.
- `objectSearch`, `categoryFilter`, `statusFilter`: filter client-side cho object list.
- `activeVersion`: file/version dang duoc chon trong version strip; moi version mock co object set rieng trong `versionedObjects`.
- `modelUrl` va `modelName`: file GLB/GLTF load truc tiep trong viewer.
- `savedViews`: snapshot local gom ten view, project, selected object, active tool, active version, camera position/target/zoom va danh sach hidden objects.
- `shareUrl`: link hash client-side de khoi phuc view state ma khong can backend.

Khi nguoi dung import GLB/GLTF, app tao `URL.createObjectURL(file)` va dua file vao `SceneModel`. Cac dinh dang khac tao conversion job client-side, chay tu `Queued` sang `Converting` kem progress/message roi ket thuc o `Converted` de mo phong pipeline server.

App luu workspace snapshot local bang key `sitemodel.workspace.v1`. Sync xoa snapshot cu va ghi lai seed model moi; du lieu hinh hoc tu file upload GLB/GLTF khong duoc persist vi browser object URL chi hop le trong session hien tai.

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
npm run test:e2e # Chay Playwright E2E smoke tests
npm run preview  # Preview ban build
```

## Tinh nang nen lam tiep

1. Persist data backend: dong bo local workspace snapshot len backend/API cho projects, uploads, objects, view states va annotations.
2. Conversion pipeline backend: thay simulated client jobs bang upload raw IFC/DWG/RVT len server, convert sang GLB, tra ve status theo job.
3. Issue persistence: luu issue workflow, note va view context len backend thay vi chi giu client-local.
4. Real BIM metadata extraction: doc metadata that tu IFC/GLB de thay seed metadata theo object.
5. Auth backend: thay role seed Owner/Editor/Viewer bang dang nhap that, project membership va permission tu API.

## Development notes

- Active development nen lam tren branch `develop`.
- UI hien tai la MVP dung data mock trong `src/data/mockData.ts`.
- `Topbar` dieu phoi sync/share/save-view feedback; hien tai cac action nay van la client-local state.
- `InspectorPanel` va `ObjectPanel` cung cap cac cach dieu khien visibility, filter, isolate va issue status cua selected/object.
- Chua co backend, nen upload non-GLB chi la queue state tren client.
