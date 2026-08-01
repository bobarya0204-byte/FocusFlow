import { useMemo } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  Shield,
  Coffee,
  Square,
} from 'lucide-react'
import { useFocusFlow } from '../../context/FocusFlowContext'
import PageHeader from '../ui/PageHeader'
import EmptyState from '../ui/EmptyState'
import {
  formatDurationSeconds,
  formatFocusDuration,
  formatSessionTime,
  formatStopwatchDisplay,
  formatTimerDisplay,
  getSessionDurationSeconds,
  getTodayFocusStats,
} from '../../utils/focus'
import { getTodayLocalDate } from '../../utils/dates'

const PRESET_DURATIONS = [25, 45, 60]

function FocusPage() {
  const {
    tasks,
    focusSessions: sessions,
    focusRuntime,
    focusActions,
    secondsLeft,
    stopwatchSeconds,
    isTimerRunning,
    isStopwatchRunning,
    isAnyModeRunning,
    isCurrentModeRunning,
  } = useFocusFlow()

  const { focusMode, durationMode, customMinutes, selectedTaskId } =
    focusRuntime

  const today = getTodayLocalDate()
  const openTasks = useMemo(
    () =>
      tasks.filter(
        (task) => !task.completed && task.plannedDate === today,
      ),
    [tasks, today],
  )
  const todayStats = useMemo(
    () => getTodayFocusStats(sessions),
    [sessions],
  )
  const recentSessions = useMemo(
    () =>
      [...sessions].sort(
        (a, b) => new Date(b.completedAt) - new Date(a.completedAt),
      ),
    [sessions],
  )

  function handlePresetSelect(minutes) {
    focusActions.applyDuration(minutes, String(minutes))
  }

  function handleCustomSelect() {
    focusActions.selectCustomDuration()
  }

  function handleCustomMinutesChange(value) {
    focusActions.setCustomMinutes(value)
  }

  return (
    <main className="main">
      <PageHeader
        title="Focus"
        subtitle="Start a timed session, or run a stopwatch when you need flexibility."
      />

      <div className="focus-layout">
        <section className="focus-primary">
          <div className="timer-card">
            <div
              className="segmented-control focus-mode-toggle"
              aria-label="Focus mode"
            >
              <button
                type="button"
                className={focusMode === 'timer' ? 'active' : ''}
                onClick={() => focusActions.setFocusMode('timer')}
                disabled={isAnyModeRunning}
              >
                Timer
              </button>
              <button
                type="button"
                className={focusMode === 'stopwatch' ? 'active' : ''}
                onClick={() => focusActions.setFocusMode('stopwatch')}
                disabled={isAnyModeRunning}
              >
                Stopwatch
              </button>
            </div>

            <p className="timer-label">
              {isCurrentModeRunning ? 'Session in progress' : 'Ready to focus'}
            </p>
            <p className="timer-display" aria-live="polite">
              {focusMode === 'timer'
                ? formatTimerDisplay(secondsLeft)
                : formatStopwatchDisplay(stopwatchSeconds)}
            </p>

            <div className="timer-controls">
              {focusMode === 'timer' ? (
                <>
                  {!isTimerRunning ? (
                    <button
                      type="button"
                      className="timer-btn timer-btn-primary"
                      onClick={focusActions.startTimer}
                    >
                      <Play size={16} strokeWidth={1.75} aria-hidden="true" />
                      Start
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="timer-btn timer-btn-primary"
                      onClick={focusActions.pauseTimer}
                    >
                      <Pause size={16} strokeWidth={1.75} aria-hidden="true" />
                      Pause
                    </button>
                  )}
                  <button
                    type="button"
                    className="timer-btn"
                    onClick={focusActions.resetTimer}
                  >
                    <RotateCcw
                      size={16}
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    Reset
                  </button>
                </>
              ) : (
                <>
                  {!isStopwatchRunning ? (
                    <button
                      type="button"
                      className="timer-btn timer-btn-primary"
                      onClick={focusActions.startStopwatch}
                    >
                      <Play size={16} strokeWidth={1.75} aria-hidden="true" />
                      Start
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="timer-btn timer-btn-primary"
                      onClick={focusActions.pauseStopwatch}
                    >
                      <Pause size={16} strokeWidth={1.75} aria-hidden="true" />
                      Pause
                    </button>
                  )}
                  <button
                    type="button"
                    className="timer-btn timer-btn-stop"
                    onClick={focusActions.stopStopwatch}
                    disabled={stopwatchSeconds === 0}
                  >
                    <Square size={15} strokeWidth={1.75} aria-hidden="true" />
                    Stop
                  </button>
                  <button
                    type="button"
                    className="timer-btn"
                    onClick={focusActions.resetStopwatch}
                  >
                    <RotateCcw
                      size={16}
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    Reset
                  </button>
                </>
              )}
            </div>

            <div className="session-setup">
              {focusMode === 'timer' && (
                <div className="setup-group">
                  <p className="setup-label">Session duration</p>
                  <div className="duration-options">
                    {PRESET_DURATIONS.map((minutes) => (
                      <button
                        key={minutes}
                        type="button"
                        className={`duration-chip${
                          durationMode === String(minutes) ? ' active' : ''
                        }`}
                        onClick={() => handlePresetSelect(minutes)}
                        disabled={isTimerRunning}
                      >
                        {minutes} min
                      </button>
                    ))}
                    <button
                      type="button"
                      className={`duration-chip${
                        durationMode === 'custom' ? ' active' : ''
                      }`}
                      onClick={handleCustomSelect}
                      disabled={isTimerRunning}
                    >
                      Custom
                    </button>
                  </div>
                  {durationMode === 'custom' && (
                    <label className="custom-duration">
                      <span>Minutes</span>
                      <input
                        type="number"
                        min="1"
                        max="180"
                        value={customMinutes}
                        onChange={(event) =>
                          handleCustomMinutesChange(event.target.value)
                        }
                        disabled={isTimerRunning}
                      />
                    </label>
                  )}
                </div>
              )}

              <label className="setup-group">
                <span className="setup-label">
                  Link a task{' '}
                  <span className="modal-optional">(optional)</span>
                </span>
                <select
                  className="focus-select"
                  value={selectedTaskId}
                  onChange={(event) =>
                    focusActions.setSelectedTaskId(event.target.value)
                  }
                  disabled={isCurrentModeRunning}
                >
                  <option value="">
                    {openTasks.length === 0
                      ? 'No open tasks planned for today'
                      : "Don't link a task"}
                  </option>
                  {openTasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
                </select>
                {openTasks.length === 0 && (
                  <span className="modal-hint">
                    Plan tasks for today in Planner to link them here.
                  </span>
                )}
              </label>
            </div>
          </div>

          <section className="focus-sessions">
            <div className="section-heading focus-sessions-header">
              <h2>Recent Sessions</h2>
            </div>
            {recentSessions.length === 0 ? (
              <EmptyState
                className="focus-empty"
                title="No sessions yet"
                text="Hit Start above. Finished timers and stopped stopwatches show up here."
              />
            ) : (
              <div className="sessions-table-wrap">
                <table className="sessions-table">
                  <thead>
                    <tr>
                      <th>Mode</th>
                      <th>Task</th>
                      <th>Duration</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSessions.map((session) => (
                      <tr key={session.id}>
                        <td>
                          <span className="session-mode">
                            {session.mode || 'Timer'}
                          </span>
                        </td>
                        <td>{session.taskTitle || '—'}</td>
                        <td>
                          {formatDurationSeconds(
                            getSessionDurationSeconds(session),
                          )}
                        </td>
                        <td>{formatSessionTime(session.completedAt)}</td>
                        <td>
                          <span
                            className={`session-status ${
                              session.status === 'Interrupted' ||
                              session.status === 'Stopped Early'
                                ? 'stopped'
                                : 'completed'
                            }`}
                          >
                            {session.status === 'Stopped Early'
                              ? 'Interrupted'
                              : session.status || 'Completed'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </section>

        <aside className="focus-sidebar-panel">
          <article className="focus-stat-card">
            <div className="section-heading">
              <h2>Today&apos;s Focus</h2>
            </div>
            <div className="focus-stat-row">
              <div>
                <p className="summary-label">Sessions Completed</p>
                <p className="focus-stat-value">
                  {todayStats.sessionsCompleted}
                </p>
              </div>
              <div>
                <p className="summary-label">Total Focus Time</p>
                <p className="focus-stat-value">
                  {formatFocusDuration(todayStats.totalMinutes)}
                </p>
              </div>
            </div>
          </article>

          <article className="coming-soon-card">
            <div className="coming-soon-icon" aria-hidden="true">
              <Shield size={18} strokeWidth={1.75} />
            </div>
            <h3>Focus Shield</h3>
            <p>Coming in Android version</p>
          </article>

          <article className="coming-soon-card">
            <div className="coming-soon-icon" aria-hidden="true">
              <Coffee size={18} strokeWidth={1.75} />
            </div>
            <h3>Smart Breaks</h3>
            <p>Coming Soon</p>
          </article>
        </aside>
      </div>
    </main>
  )
}

export default FocusPage
