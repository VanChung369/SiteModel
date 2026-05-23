import { FileBox, Files, Upload } from 'lucide-react'
import { SectionTitle } from '../../components/SectionTitle'
import { allowedModelTypes } from '../../data/mockData'
import type { UploadItem } from '../../types/domain'

type ImportPanelProps = {
  uploads: UploadItem[]
  onFilesSelected: (files: FileList | null) => void
}

export function ImportPanel({ uploads, onFilesSelected }: ImportPanelProps) {
  return (
    <section className="rail-section upload-panel">
      <SectionTitle icon={Upload}>Import Model</SectionTitle>
      <label className="drop-zone">
        <input
          type="file"
          multiple
          accept={allowedModelTypes.join(',')}
          onChange={(event) => onFilesSelected(event.currentTarget.files)}
        />
        <FileBox size={22} />
        <span>Drop or choose BIM/CAD files</span>
        <small>GLB loads now. IFC/DXF/DWG/RVT enter the conversion queue.</small>
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
            </div>
            <em className={upload.state.toLowerCase()}>{upload.state}</em>
          </div>
        ))}
      </div>
    </section>
  )
}
