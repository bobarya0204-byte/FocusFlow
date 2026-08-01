import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocalStorageState } from './useLocalStorageState'
import { getTodayLocalDate } from '../utils/dates'
import {
  FOCUS_RUNTIME_KEY,
  applyTimerDuration,
  clearSelectedTaskIfMissing,
  getInitialFocusRuntime,
  getStopwatchElapsedSeconds,
  getTimerRemainingSeconds,
  isFocusRuntimeActive,
  interruptStopwatch,
  interruptTimer,
  pauseStopwatch,
  pauseTimer,
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

  const today = getTodayLocalDate()
  return (
    tasks.find(
      (task) =>
        !task.completed &&
        task.plannedDate === today &&
        String(task.id) === String(taskId),
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
 * Persisted timer/stopwatch engine. Lives above FocusPage so navigation
 * cannot lose an active session. Remaining/elapsed time is derived from
 * timestamps; the interval only refreshes UI and catches completions.
 */
export function usePersistentFocusRuntime(tasks, setFocusSessions) {
  const [focusRuntime, setFocusRuntime] = useLocalStorageState(
    FOCUS_RUNTIME_KEY,
    getInitialFocusRuntime,
  )
  const [focusClock, setFocusClock] = useState(() => Date.now())
  const isActive = isFocusRuntimeActive(focusRuntime)

  const settleRuntime = useCallback(
    (runtime, now = Date.now()) => {
      const { runtime: nextRuntime, completedSession } = resolveFocusRuntime(
        runtime,
        now,
      )

      if (completedSession) {
        const linkedTask = findLinkedTask(
          tasks,
          completedSession.selectedTaskId,
        )
        appendUniqueSession(
          setFocusSessions,
          withLinkedTask(completedSession, linkedTask),
        )
      }

      return nextRuntime
    },
    [setFocusSessions, tasks],
  )

  useEffect(() => {
    function tick() {
      const now = Date.now()
      setFocusClock(now)
      setFocusRuntime((current) => {
        const next = settleRuntime(current, now)
        return next === current ? current : next
      })
    }

    // Always settle on mount / dependency change (covers refresh + overdue timers)
    tick()

    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        tick()
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', tick)

    // Only poll while a clock is running — paused/idle displays are static
    const intervalId = isActive
      ? window.setInterval(tick, 250)
      : undefined

    return () => {
      if (intervalId != null) {
        window.clearInterval(intervalId)
      }
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', tick)
    }
  }, [settleRuntime, setFocusRuntime, isActive])

  // Drop stale linked-task selection when that task is no longer available
  useEffect(() => {
    setFocusRuntime((current) => {
      const next = clearSelectedTaskIfMissing(current, (taskId) =>
        Boolean(findLinkedTask(tasks, taskId)),
      )
      return next === current ? current : next
    })
  }, [tasks, setFocusRuntime])

  const updateRuntime = useCallback(
    (updater) => {
      setFocusRuntime((current) => {
        const now = Date.now()
        const settled = settleRuntime(current, now)
        return typeof updater === 'function' ? updater(settled, now) : updater
      })
      setFocusClock(Date.now())
    },
    [setFocusRuntime, settleRuntime],
  )

  const focusActions = useMemo(
    () => ({
      setFocusMode: (mode) => {
        updateRuntime((runtime) => setRuntimeFocusMode(runtime, mode))
      },
      setSelectedTaskId: (taskId) => {
        updateRuntime((runtime) => setRuntimeSelectedTaskId(runtime, taskId))
      },
      applyDuration: (minutes, durationMode) => {
        updateRuntime((runtime) =>
          applyTimerDuration(runtime, minutes, durationMode),
        )
      },
      setCustomMinutes: (value) => {
        updateRuntime((runtime) => setRuntimeCustomMinutes(runtime, value))
      },
      selectCustomDuration: () => {
        updateRuntime((runtime) => {
          const minutes = Math.max(1, Number(runtime.customMinutes) || 1)
          return applyTimerDuration(
            { ...runtime, customMinutes: minutes },
            minutes,
            'custom',
          )
        })
      },
      startTimer: () => {
        updateRuntime((runtime, now) => startTimer(runtime, now))
      },
      pauseTimer: () => {
        updateRuntime((runtime, now) => pauseTimer(runtime, now))
      },
      resetTimer: () => {
        updateRuntime((runtime, now) => {
          const linkedTask = findLinkedTask(tasks, runtime.selectedTaskId)
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
        updateRuntime((runtime, now) => startStopwatch(runtime, now))
      },
      pauseStopwatch: () => {
        updateRuntime((runtime, now) => pauseStopwatch(runtime, now))
      },
      resetStopwatch: () => {
        updateRuntime((runtime, now) => {
          const linkedTask = findLinkedTask(tasks, runtime.selectedTaskId)
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
        updateRuntime((runtime, now) => {
          const linkedTask = findLinkedTask(tasks, runtime.selectedTaskId)
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
    [setFocusSessions, tasks, updateRuntime],
  )

  const derived = useMemo(() => {
    const secondsLeft = getTimerRemainingSeconds(focusRuntime, focusClock)
    const stopwatchSeconds = getStopwatchElapsedSeconds(
      focusRuntime,
      focusClock,
    )
    const isTimerRunning = Boolean(focusRuntime.timerRunning)
    const isStopwatchRunning = Boolean(focusRuntime.stopwatchRunning)

    return {
      secondsLeft,
      stopwatchSeconds,
      isTimerRunning,
      isStopwatchRunning,
      isAnyModeRunning: isTimerRunning || isStopwatchRunning,
      isCurrentModeRunning:
        focusRuntime.focusMode === 'timer'
          ? isTimerRunning
          : isStopwatchRunning,
    }
  }, [focusRuntime, focusClock])

  return useMemo(
    () => ({
      focusRuntime,
      focusClock,
      focusActions,
      ...derived,
    }),
    [focusRuntime, focusClock, focusActions, derived],
  )
}
