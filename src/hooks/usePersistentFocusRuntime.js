import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getTodayLocalDate } from '../utils/dates'
import {
  buildVirtualOccurrence,
  expandTasksForDate,
  parseVirtualOccurrenceId,
} from '../utils/virtualTasks'
import {
  FOCUS_RUNTIME_KEY,
  applyTimerDuration,
  clearSelectedTaskIfMissing,
  getInitialFocusRuntime,
  isFocusRuntimeActive,
  interruptStopwatch,
  interruptTimer,
  pauseStopwatch,
  pauseTimer,
  persistFocusRuntime,
  resolveFocusRuntime,
  setCustomMinutes as setRuntimeCustomMinutes,
  setFocusMode as setRuntimeFocusMode,
  setSelectedTaskId as setRuntimeSelectedTaskId,
  startStopwatch,
  startTimer,
  stopStopwatch,
  withLinkedTask,
} from '../utils/focusRuntime'

function findLinkedTask(tasks, taskId) {
  if (!taskId) {
    return null
  }

  const parsed = parseVirtualOccurrenceId(taskId)
  if (parsed) {
    const master = tasks.find(
      (task) => String(task.id) === String(parsed.masterId),
    )
    if (!master) {
      return null
    }
    return buildVirtualOccurrence(master, parsed.dateKey)
  }

  const today = getTodayLocalDate()
  return (
    expandTasksForDate(tasks, today).find(
      (task) => String(task.id) === String(taskId),
    ) || null
  )
}

function appendUniqueSession(setFocusSessions, session) {
  if (!session) {
    return
  }

  setFocusSessions((current) => {
    if (current.some((item) => String(item.id) === String(session.id))) {
      return current
    }
    return [session, ...current]
  })
}

/**
 * Persisted timer/stopwatch engine.
 * - Remaining/elapsed time is derived from timestamps (UI clocks locally).
 * - localStorage is written only on meaningful events, not every tick.
 * - Context consumers are not re-rendered on the display tick.
 */
export function usePersistentFocusRuntime(tasks, setFocusSessions) {
  const [focusRuntime, setFocusRuntime] = useState(getInitialFocusRuntime)
  const runtimeRef = useRef(focusRuntime)
  const tasksRef = useRef(tasks)
  runtimeRef.current = focusRuntime
  tasksRef.current = tasks

  const isActive = isFocusRuntimeActive(focusRuntime)

  const persistCurrent = useCallback((runtime = runtimeRef.current) => {
    persistFocusRuntime(runtime)
  }, [])

  const settleIfDue = useCallback(
    (runtime, now = Date.now(), { persistOnComplete = true } = {}) => {
      const { runtime: nextRuntime, completedSession } = resolveFocusRuntime(
        runtime,
        now,
      )

      if (!completedSession) {
        return { runtime, didComplete: false }
      }

      const linkedTask = findLinkedTask(
        tasksRef.current,
        completedSession.selectedTaskId,
      )
      appendUniqueSession(
        setFocusSessions,
        withLinkedTask(completedSession, linkedTask),
      )

      if (persistOnComplete) {
        persistFocusRuntime(nextRuntime)
      }

      return { runtime: nextRuntime, didComplete: true }
    },
    [setFocusSessions],
  )

  const commitRuntime = useCallback(
    (updater, { persist = true } = {}) => {
      setFocusRuntime((current) => {
        const now = Date.now()
        const settled = settleIfDue(current, now, { persistOnComplete: true })
        const base = settled.runtime
        const next =
          typeof updater === 'function' ? updater(base, now) : updater

        runtimeRef.current = next
        if (persist) {
          persistFocusRuntime(next)
        }
        return next
      })
    },
    [settleIfDue],
  )

  // Completion polling only — does not rewrite storage unless a timer ends
  useEffect(() => {
    if (!isActive) {
      return undefined
    }

    function checkCompletion() {
      setFocusRuntime((current) => {
        const { runtime: next, didComplete } = settleIfDue(
          current,
          Date.now(),
          { persistOnComplete: true },
        )
        if (!didComplete) {
          return current
        }
        runtimeRef.current = next
        return next
      })
    }

    const intervalId = window.setInterval(checkCompletion, 250)
    return () => window.clearInterval(intervalId)
  }, [isActive, settleIfDue])

  // Persist on hide/unload; settle overdue timers when returning
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === 'hidden') {
        persistCurrent()
        return
      }

      setFocusRuntime((current) => {
        const { runtime: next, didComplete } = settleIfDue(
          current,
          Date.now(),
          { persistOnComplete: true },
        )
        if (!didComplete) {
          return current
        }
        runtimeRef.current = next
        return next
      })
    }

    function handlePageHide() {
      persistCurrent()
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('pagehide', handlePageHide)
    window.addEventListener('beforeunload', handlePageHide)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('beforeunload', handlePageHide)
    }
  }, [persistCurrent, settleIfDue])

  // Drop stale linked-task selection when that task is no longer available
  useEffect(() => {
    setFocusRuntime((current) => {
      const next = clearSelectedTaskIfMissing(current, (taskId) =>
        Boolean(findLinkedTask(tasks, taskId)),
      )
      if (next === current) {
        return current
      }
      runtimeRef.current = next
      persistFocusRuntime(next)
      return next
    })
  }, [tasks])

  const focusActions = useMemo(
    () => ({
      setFocusMode: (mode) => {
        commitRuntime((runtime) => setRuntimeFocusMode(runtime, mode))
      },
      setSelectedTaskId: (taskId) => {
        commitRuntime((runtime) => setRuntimeSelectedTaskId(runtime, taskId))
      },
      applyDuration: (minutes, durationMode) => {
        commitRuntime((runtime) =>
          applyTimerDuration(runtime, minutes, durationMode),
        )
      },
      setCustomMinutes: (value) => {
        // Typing custom minutes should not hammer storage
        commitRuntime(
          (runtime) => setRuntimeCustomMinutes(runtime, value),
          { persist: false },
        )
      },
      selectCustomDuration: () => {
        commitRuntime((runtime) => {
          const minutes = Math.max(1, Number(runtime.customMinutes) || 1)
          return applyTimerDuration(
            { ...runtime, customMinutes: minutes },
            minutes,
            'custom',
          )
        })
      },
      startTimer: () => {
        commitRuntime((runtime, now) => startTimer(runtime, now))
      },
      pauseTimer: () => {
        commitRuntime((runtime, now) => pauseTimer(runtime, now))
      },
      resetTimer: () => {
        commitRuntime((runtime, now) => {
          const linkedTask = findLinkedTask(
            tasksRef.current,
            runtime.selectedTaskId,
          )
          const { runtime: nextRuntime, completedSession } = interruptTimer(
            runtime,
            linkedTask,
            now,
          )
          appendUniqueSession(setFocusSessions, completedSession)
          return nextRuntime
        })
      },
      startStopwatch: () => {
        commitRuntime((runtime, now) => startStopwatch(runtime, now))
      },
      pauseStopwatch: () => {
        commitRuntime((runtime, now) => pauseStopwatch(runtime, now))
      },
      resetStopwatch: () => {
        commitRuntime((runtime, now) => {
          const linkedTask = findLinkedTask(
            tasksRef.current,
            runtime.selectedTaskId,
          )
          const { runtime: nextRuntime, completedSession } = interruptStopwatch(
            runtime,
            linkedTask,
            now,
          )
          appendUniqueSession(setFocusSessions, completedSession)
          return nextRuntime
        })
      },
      stopStopwatch: () => {
        commitRuntime((runtime, now) => {
          const linkedTask = findLinkedTask(
            tasksRef.current,
            runtime.selectedTaskId,
          )
          const { runtime: nextRuntime, completedSession } = stopStopwatch(
            runtime,
            linkedTask,
            now,
          )
          appendUniqueSession(setFocusSessions, completedSession)
          return nextRuntime
        })
      },
    }),
    [commitRuntime, setFocusSessions],
  )

  const derived = useMemo(() => {
    const isTimerRunning = Boolean(focusRuntime.timerRunning)
    const isStopwatchRunning = Boolean(focusRuntime.stopwatchRunning)

    return {
      isTimerRunning,
      isStopwatchRunning,
      isAnyModeRunning: isTimerRunning || isStopwatchRunning,
      isCurrentModeRunning:
        focusRuntime.focusMode === 'timer'
          ? isTimerRunning
          : isStopwatchRunning,
    }
  }, [focusRuntime])

  return useMemo(
    () => ({
      focusRuntime,
      focusActions,
      ...derived,
    }),
    [focusRuntime, focusActions, derived],
  )
}

export { FOCUS_RUNTIME_KEY }
