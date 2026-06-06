import { FileBox, Files, RefreshCcw, Upload } from 'lucide-react'
import { SectionTitle } from '../../components/SectionTitle'
import { allowedModelTypes } from '../../data/mockData'
import type { UploadItem } from '../../types/domain'

type ImportPanelProps = {
  uploads: UploadItem[]
  canImport: boolean
  onFilesSelected: (files: FileList | null) => void
  onRetryConversion: (id: string) => void
}

function getUploadStateLabel(upload: UploadItem) {
  return upload.state === 'Converting' ? `${upload.conversionProgress ?? 0}%` : upload.state
}

export function ImportPanel({ uploads, canImport, onFilesSelected, onRetryConversion }: ImportPanelProps) {
  return (
    <section className="rail-section upload-panel">
      <SectionTitle icon={Upload}>Import Model</SectionTitle>
      <label className={`drop-zone ${canImport ? '' : 'is-disabled'}`}>
        <input
          type="file"
          multiple
          accept={allowedModelTypes.join(',')}
          disabled={!canImport}
          onChange={(event) => onFilesSelected(event.currentTarget.files)}
        />
        <FileBox size={22} />
        <span>{canImport ? 'Drop or choose BIM/CAD files' : 'Import disabled for viewer role'}</span>
        <small>{canImport ? 'GLB, GLTF and OBJ load now. IFC/DXF/DWG/RVT enter the conversion queue.' : 'Ask an editor or owner to upload model files.'}</small>
      </label>
      <div className="upload-list">
        {uploads.slice(0, 4).map((upload) => (
          <div className="upload-row" key={upload.id}>
            <Files size={15} />
            <div>
              <span>{upload.name}</span>
              <small>
                {upload.type} - {upload.size}
              </small>
              {upload.jobId ? <small>{upload.jobId}</small> : null}
              {upload.message ? <small>{upload.message}</small> : null}
              {upload.state === 'Converting' || upload.state === 'Queued' ? (
                <span className="conversion-track" aria-label={`${upload.name} conversion progress`}>
                  <span style={{ width: `${upload.conversionProgress ?? 0}%` }} />
                </span>
              ) : null}
            </div>
            {upload.state === 'Failed' ? (
              <button
                type="button"
                className="retry-upload"
                aria-label={`Retry ${upload.name} conversion`}
                title={`Retry ${upload.name} conversion`}
                onClick={() => onRetryConversion(upload.id)}
              >
                <RefreshCcw size={13} />
              </button>
            ) : null}
            <em className={upload.state.toLowerCase()}>{getUploadStateLabel(upload)}</em>
          </div>
        ))}
      </div>
    </section>
  )
}
