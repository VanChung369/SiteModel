import { Clock3 } from 'lucide-react'

type VersionStripProps = {
  versions: string[]
  activeVersion: string
  onSelectVersion: (version: string) => void
}

export function VersionStrip({ versions, activeVersion, onSelectVersion }: VersionStripProps) {
  return (
    <div className="version-strip" aria-label="Model versions">
      {versions.map((version) => (
        <button
          className={version === activeVersion ? 'is-current' : ''}
          key={version}
          type="button"
          onClick={() => onSelectVersion(version)}
        >
          <Clock3 size={14} />
          <span>{version}</span>
        </button>
      ))}
    </div>
  )
}
