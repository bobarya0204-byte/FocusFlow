import { readJson, writeJson } from './storage'

export const FOCUS_RUNTIME_KEY = 'focusflow-runtime'

const PRESET_DURATIONS = new Set([25, 45, 60])

export function getDefaultFocusRuntime() {
  return {
    focusMode: 'timer',
    durationMinutes: 25,
    durationMode: '25',
    customMinutes: 30,
    selectedTaskId: '',
    timerRunning: false,
    timerRemainingMs: 25 * 60 * 1000,
    timerEndsAt: null,
    stopwatchRunning: false,
    stopwatchAccumulatedMs: 0,
    stopwatchStartedAt: null,
  }
}

function isValidMode(mode) {
  return mode === 'timer' || mode === 'stopwatch'
}

function toPositiveInt(value, fallback) {
  const number = Number(value)
  if (!Number.isFinite(number) || number < 1) {
    return fallback
  }
  return Math.floor(number)
}

function toNonNegativeInt(value, fallback = 0) {
  const number = Number(value)
  if (!Number.isFinite(number) || number < 0) {
    return fallback
  }
  return Math.floor(number)
}

export function normalizeFocusRuntime(raw) {
  const defaults = getDefaultFocusRuntime()
  if (!raw || typeof raw !== 'object') {
    return defaults
  }

  const durationMinutes = toPositiveInt(raw.durationMinutes, defaults.durationMinutes)
  const customMinutes = toPositiveInt(raw.customMinutes, defaults.customMinutes)
  const durationMode =
    raw.durationMode === 'custom' || PRESET_DURATIONS.has(Number(raw.durationMode))
      ? String(raw.durationMode)
      : String(durationMinutes)

  const timerRunning = Boolean(raw.timerRunning)
  const stopwatchRunning = Boolean(raw.stopwatchRunning)
  // Only one clock can run at a time
  const safeTimerRunning = timerRunning && !stopwatchRunning
  const safeStopwatchRunning = stopwatchRunning && !timerRunning

  const timerEndsAt =
    safeTimerRunning && Number.isFinite(Number(raw.timerEndsAt))
      ? Number(raw.timerEndsAt)
      : null

  const stopwatchStartedAt =
    safeStopwatchRunning && Number.isFinite(Number(raw.stopwatchStartedAt))
      ? Number(raw.stopwatchStartedAt)
      : null

  return {
    focusMode: isValidMode(raw.focusMode) ? raw.focusMode : defaults.focusMode,
    durationMinutes,
    durationMode,
    customMinutes,
    selectedTaskId:
      raw.selectedTaskId == null ? '' : String(raw.selectedTaskId),
    timerRunning: Boolean(timerEndsAt),
    timerRemainingMs: toNonNegativeInt(
      raw.timerRemainingMs,
      durationMinutes * 60 * 1000,
    ),
    timerEndsAt,
    stopwatchRunning: Boolean(stopwatchStartedAt),
    stopwatchAccumulatedMs: toNonNegativeInt(raw.stopwatchAccumulatedMs, 0),
    stopwatchStartedAt,
  }
}

export function getInitialFocusRuntime() {
  return normalizeFocusRuntime(readJson(FOCUS_RUNTIME_KEY, null))
}

export function getTimerRemainingMs(runtime, now = Date.now()) {
  if (runtime.timerRunning && runtime.timerEndsAt != null) {
    return Math.max(0, runtime.timerEndsAt - now)
  }
  return Math.max(0, runtime.timerRemainingMs)
}

export function getStopwatchElapsedMs(runtime, now = Date.now()) {
  let elapsed = Math.max(0, runtime.stopwatchAccumulatedMs)
  if (runtime.stopwatchRunning && runtime.stopwatchStartedAt != null) {
    elapsed += Math.max(0, now - runtime.stopwatchStartedAt)
  }
  return elapsed
}

export function getTimerRemainingSeconds(runtime, now = Date.now()) {
  return Math.ceil(getTimerRemainingMs(runtime, now) / 1000)
}

export function getStopwatchElapsedSeconds(runtime, now = Date.now()) {
  return Math.floor(getStopwatchElapsedMs(runtime, now) / 1000)
}

export function isFocusRuntimeActive(runtime) {
  return Boolean(runtime?.timerRunning || runtime?.stopwatchRunning)
}

function idleTimerState(runtime, remainingMs) {
  return {
    ...runtime,
    timerRunning: false,
    timerEndsAt: null,
    timerRemainingMs: Math.max(0, remainingMs),
  }
}

function resetTimerToDuration(runtime) {
  return idleTimerState(runtime, runtime.durationMinutes * 60 * 1000)
}

/**
 * If a running timer has already ended, return a completed session payload and
 * a reset runtime. Otherwise return the same runtime reference (no alloc).
 */
export function resolveFocusRuntime(runtime, now = Date.now()) {
  if (
    !runtime?.timerRunning ||
    runtime.timerEndsAt == null ||
    runtime.timerEndsAt > now
  ) {
    return { runtime, completedSession: null }
  }

  const normalized = normalizeFocusRuntime(runtime)
  const endedAt = normalized.timerEndsAt
  const completedSession = {
    id: `timer-${endedAt}`,
    durationMinutes: normalized.durationMinutes,
    durationSeconds: normalized.durationMinutes * 60,
    mode: 'Timer',
    status: 'Completed',
    taskId: null,
    taskTitle: null,
    selectedTaskId: normalized.selectedTaskId,
    completedAt: new Date(endedAt).toISOString(),
  }

  return {
    runtime: resetTimerToDuration(normalized),
    completedSession,
  }
}

/** Persist helper for event-driven runtime writes. */
export function persistFocusRuntime(runtime) {
  return writeJson(FOCUS_RUNTIME_KEY, runtime)
}

export function withLinkedTask(session, linkedTask) {
  if (!session) {
    return null
  }

  return {
    ...session,
    taskId: linkedTask ? linkedTask.id : null,
    taskTitle: linkedTask ? linkedTask.title : null,
    selectedTaskId: undefined,
  }
}

export function setFocusMode(runtime, mode) {
  if (!isValidMode(mode) || isFocusRuntimeActive(runtime)) {
    return runtime
  }
  return { ...runtime, focusMode: mode }
}

export function setSelectedTaskId(runtime, taskId) {
  if (isFocusRuntimeActive(runtime)) {
    return runtime
  }
  return {
    ...runtime,
    selectedTaskId: taskId == null ? '' : String(taskId),
  }
}

export function applyTimerDuration(runtime, minutes, durationMode) {
  if (runtime.timerRunning) {
    return runtime
  }

  const nextMinutes = toPositiveInt(minutes, runtime.durationMinutes)
  return {
    ...runtime,
    durationMinutes: nextMinutes,
    durationMode: durationMode ?? String(nextMinutes),
    timerRemainingMs: nextMinutes * 60 * 1000,
    timerEndsAt: null,
    timerRunning: false,
  }
}

export function setCustomMinutes(runtime, value) {
  // Keep the raw input so typing multi-digit minutes still works.
  let next = {
    ...runtime,
    customMinutes: value,
  }

  if (runtime.durationMode === 'custom' && !runtime.timerRunning) {
    const minutes = Math.max(1, Number(value) || 1)
    next = applyTimerDuration(next, minutes, 'custom')
  }

  return next
}

export function startTimer(runtime, now = Date.now()) {
  if (runtime.timerRunning || runtime.stopwatchRunning) {
    return runtime
  }

  let remainingMs = Math.max(0, runtime.timerRemainingMs)
  if (remainingMs <= 0) {
    remainingMs = runtime.durationMinutes * 60 * 1000
  }

  return {
    ...runtime,
    focusMode: 'timer',
    timerRunning: true,
    timerRemainingMs: remainingMs,
    timerEndsAt: now + remainingMs,
  }
}

export function pauseTimer(runtime, now = Date.now()) {
  if (!runtime.timerRunning || runtime.timerEndsAt == null) {
    return {
      ...runtime,
      timerRunning: false,
      timerEndsAt: null,
    }
  }

  return idleTimerState(runtime, getTimerRemainingMs(runtime, now))
}

export function resetTimer(runtime) {
  return resetTimerToDuration({
    ...runtime,
    timerRunning: false,
    timerEndsAt: null,
  })
}

export function startStopwatch(runtime, now = Date.now()) {
  if (runtime.stopwatchRunning || runtime.timerRunning) {
    return runtime
  }

  return {
    ...runtime,
    focusMode: 'stopwatch',
    stopwatchRunning: true,
    stopwatchStartedAt: now,
  }
}

export function pauseStopwatch(runtime, now = Date.now()) {
  if (!runtime.stopwatchRunning || runtime.stopwatchStartedAt == null) {
    return {
      ...runtime,
      stopwatchRunning: false,
      stopwatchStartedAt: null,
    }
  }

  return {
    ...runtime,
    stopwatchRunning: false,
    stopwatchAccumulatedMs: getStopwatchElapsedMs(runtime, now),
    stopwatchStartedAt: null,
  }
}

export function resetStopwatch(runtime) {
  return {
    ...runtime,
    stopwatchRunning: false,
    stopwatchAccumulatedMs: 0,
    stopwatchStartedAt: null,
  }
}

function buildStopwatchSession(runtime, linkedTask, now, status) {
  const elapsedMs = getStopwatchElapsedMs(runtime, now)
  const elapsedSeconds = Math.floor(elapsedMs / 1000)

  if (elapsedSeconds <= 0) {
    return null
  }

  return {
    id: `stopwatch-${now}`,
    durationMinutes: elapsedSeconds / 60,
    durationSeconds: elapsedSeconds,
    mode: 'Stopwatch',
    status,
    taskId: linkedTask ? linkedTask.id : null,
    taskTitle: linkedTask ? linkedTask.title : null,
    completedAt: new Date(now).toISOString(),
  }
}

/** Intentional finish via Stop — counts as a completed session. */
export function stopStopwatch(runtime, linkedTask, now = Date.now()) {
  const completedSession = buildStopwatchSession(
    runtime,
    linkedTask,
    now,
    'Completed',
  )

  return {
    runtime: resetStopwatch(runtime),
    completedSession,
  }
}

/** Manual reset with elapsed time — counts as an interrupted session. */
export function interruptStopwatch(runtime, linkedTask, now = Date.now()) {
  const completedSession = buildStopwatchSession(
    runtime,
    linkedTask,
    now,
    'Interrupted',
  )

  return {
    runtime: resetStopwatch(runtime),
    completedSession,
  }
}

function buildInterruptedTimerSession(runtime, linkedTask, now) {
  if (!runtime.timerRunning && runtime.timerRemainingMs <= 0) {
    return null
  }

  const totalMs = runtime.durationMinutes * 60 * 1000
  const remainingMs = getTimerRemainingMs(runtime, now)
  const elapsedMs = Math.max(0, totalMs - remainingMs)
  const elapsedSeconds = Math.floor(elapsedMs / 1000)

  if (elapsedSeconds <= 0) {
    return null
  }

  return {
    id: `timer-interrupted-${now}`,
    durationMinutes: elapsedSeconds / 60,
    durationSeconds: elapsedSeconds,
    mode: 'Timer',
    status: 'Interrupted',
    taskId: linkedTask ? linkedTask.id : null,
    taskTitle: linkedTask ? linkedTask.title : null,
    completedAt: new Date(now).toISOString(),
  }
}

/** Manual timer reset after progress — interrupted, not completed. */
export function interruptTimer(runtime, linkedTask, now = Date.now()) {
  const completedSession = buildInterruptedTimerSession(
    runtime,
    linkedTask,
    now,
  )

  return {
    runtime: resetTimer(runtime),
    completedSession,
  }
}

export function clearSelectedTaskIfMissing(runtime, isAvailable) {
  if (!runtime.selectedTaskId || isAvailable(runtime.selectedTaskId)) {
    return runtime
  }
  return { ...runtime, selectedTaskId: '' }
}
