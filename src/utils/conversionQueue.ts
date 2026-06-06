import type { UploadItem } from '../types/domain'
import { formatBytes, getFileExtension, isBrowserLoadableModel } from './files'

const progressSteps = [16, 38, 64, 86, 100]

function createJobId(file: File, extension: string) {
  return `job-${extension.replace('.', '')}-${file.lastModified}-${file.size}`
}

export function createUploadItem(file: File): UploadItem {
  const extension = getFileExtension(file.name)
  const isLoadable = isBrowserLoadableModel(extension)

  return {
    id: `${file.name}-${file.lastModified}`,
    name: file.name,
    type: extension.replace('.', '').toUpperCase(),
    size: formatBytes(file.size),
    state: isLoadable ? 'Converted' : 'Queued',
    conversionProgress: isLoadable ? 100 : 0,
    jobId: isLoadable ? undefined : createJobId(file, extension),
    message: isLoadable ? 'Ready for browser preview' : 'Waiting for model conversion',
  }
}

export function advanceConversionQueue(uploads: UploadItem[]): UploadItem[] {
  let changed = false

  const nextUploads = uploads.map((upload) => {
    if (upload.state === 'Queued') {
      changed = true

      return {
        ...upload,
        state: 'Converting',
        conversionProgress: progressSteps[0],
        message: 'Uploading source file',
      } satisfies UploadItem
    }

    if (upload.state !== 'Converting') {
      return upload
    }

    const currentProgress = upload.conversionProgress ?? 0
    const nextProgress = progressSteps.find((step) => step > currentProgress) ?? 100
    changed = true

    if (nextProgress >= 100) {
      return {
        ...upload,
        state: 'Converted',
        conversionProgress: 100,
        message: 'Converted GLB is ready',
      } satisfies UploadItem
    }

    return {
      ...upload,
      conversionProgress: nextProgress,
      message: nextProgress < 60 ? 'Extracting geometry' : 'Generating GLB preview',
    } satisfies UploadItem
  })

  return changed ? nextUploads : uploads
}

export function retryConversionJob(uploads: UploadItem[], id: string): UploadItem[] {
  return uploads.map((upload) =>
    upload.id === id && upload.state === 'Failed'
      ? {
          ...upload,
          state: 'Queued',
          conversionProgress: 0,
          message: 'Retry queued',
        } satisfies UploadItem
      : upload,
  )
}
