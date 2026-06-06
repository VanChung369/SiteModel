import type { SharedViewState } from '../types/domain'

const SHARE_HASH_PREFIX = '#view='

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isVector3(value: unknown): value is [number, number, number] {
  return Array.isArray(value) && value.length === 3 && value.every(isNumber)
}

function isSharedViewState(value: unknown): value is SharedViewState {
  return (
    isRecord(value) &&
    isString(value.projectId) &&
    isString(value.selectedId) &&
    isString(value.activeTool) &&
    isString(value.activeVersion) &&
    Array.isArray(value.hiddenObjectIds) &&
    value.hiddenObjectIds.every(isString) &&
    isRecord(value.cameraView) &&
    isVector3(value.cameraView.position) &&
    isVector3(value.cameraView.target) &&
    isNumber(value.cameraView.zoom)
  )
}

function encodeBase64Url(value: string) {
  return btoa(encodeURIComponent(value))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')

  return decodeURIComponent(atob(padded))
}

export function createShareHash(view: SharedViewState) {
  return `${SHARE_HASH_PREFIX}${encodeBase64Url(JSON.stringify(view))}`
}

export function createShareUrl(view: SharedViewState, currentUrl = window.location.href) {
  const url = new URL(currentUrl)
  url.hash = createShareHash(view)

  return url.toString()
}

export function parseShareHash(hash = window.location.hash) {
  if (!hash.startsWith(SHARE_HASH_PREFIX)) {
    return null
  }

  try {
    const parsed: unknown = JSON.parse(decodeBase64Url(hash.slice(SHARE_HASH_PREFIX.length)))
    return isSharedViewState(parsed) ? parsed : null
  } catch {
    return null
  }
}
