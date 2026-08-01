/** Toast types and helpers for the global notification system. */

export const TOAST_TYPES = {
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  INFO: 'info',
}

export const TOAST_DURATION_MS = 6000

export function createToast({
  message,
  type = TOAST_TYPES.INFO,
  onUndo = null,
  durationMs = TOAST_DURATION_MS,
} = {}) {
  return {
    id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    message: typeof message === 'string' ? message : '',
    type: Object.values(TOAST_TYPES).includes(type) ? type : TOAST_TYPES.INFO,
    onUndo: typeof onUndo === 'function' ? onUndo : null,
    durationMs:
      typeof durationMs === 'number' && durationMs > 0
        ? durationMs
        : TOAST_DURATION_MS,
  }
}
