import { describe, expect, it } from 'vitest'
import type { UploadItem } from '../types/domain'
import { advanceConversionQueue, createUploadItem, retryConversionJob } from './conversionQueue'

function createFile(name: string, size = 1024) {
  return new File(['x'.repeat(size)], name, { lastModified: 1 })
}

describe('conversionQueue', () => {
  it('marks browser-loadable models as converted immediately', () => {
    const upload = createUploadItem(createFile('tower.glb'))

    expect(upload).toMatchObject({
      id: 'tower.glb-1',
      name: 'tower.glb',
      state: 'Converted',
      conversionProgress: 100,
      message: 'Ready for browser preview',
    })
    expect(upload.jobId).toBeUndefined()
  })

  it('advances non-loadable models through conversion progress', () => {
    const queued = createUploadItem(createFile('structure.ifc'))
    const converting = advanceConversionQueue([queued])[0]
    const progressed = advanceConversionQueue([converting])[0]

    expect(queued).toMatchObject({
      state: 'Queued',
      conversionProgress: 0,
      jobId: 'job-ifc-1-1024',
    })
    expect(converting).toMatchObject({
      state: 'Converting',
      conversionProgress: 16,
      message: 'Uploading source file',
    })
    expect(progressed).toMatchObject({
      state: 'Converting',
      conversionProgress: 38,
      message: 'Extracting geometry',
    })

    const finished = Array.from({ length: 5 }).reduce<UploadItem[]>((uploads) => advanceConversionQueue(uploads), [queued])
    expect(finished[0]).toMatchObject({
      state: 'Converted',
      conversionProgress: 100,
      message: 'Converted GLB is ready',
    })
  })

  it('retries failed conversion jobs', () => {
    const failedUpload: UploadItem = {
      id: 'upload-1',
      name: 'model.rvt',
      type: 'RVT',
      size: '2.0 MB',
      state: 'Failed',
      conversionProgress: 52,
      jobId: 'job-rvt-1-1',
      message: 'Conversion failed',
    }

    expect(retryConversionJob([failedUpload], failedUpload.id)[0]).toMatchObject({
      state: 'Queued',
      conversionProgress: 0,
      message: 'Retry queued',
    })
  })
})
