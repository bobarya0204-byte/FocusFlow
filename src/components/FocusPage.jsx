import { useEffect, useRef, useState } from 'react'
import { Play, Pause, RotateCcw, Shield, Coffee } from 'lucide-react'
import {
  formatFocusDuration,
  formatSessionTime,
  formatTimerDisplay,
  getTodayFocusStats,
} from '../utils/focus'

const PRESET_DURATIONS = [25, 45, 60]

function FocusPage({ tasks, sessions, onSessionsChange }) {
  const [durationMinutes, setDurationMinutes] = useState(25)
  const [durationMode, setDurationMode] = useState('25')
  const [customMinutes, setCustomMinutes] = useState(30)
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState('')
  const hasFinishedSessionRef = useRef(false)

  const openTasks = tasks.filter((task) => !task.completed)
  const todayStats = getTodayFocusStats(sessions)
  const recentSessions = [...sessions].sort(
    (a, b) => new Date(b.completedAt) - new Date(a.completedAt),
  )

  useEffect(() => {
    if (!isRunning) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      setSecondsLeft((previous) => Math.max(0, previous - 1))
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [isRunning])

  useEffect(() => {
    if (!isRunning || secondsLeft > 0 || hasFinishedSessionRef.current) {
      return
    }

    hasFinishedSessionRef.current = true

    const linkedTask = tasks.find(
      (task) =>
        !task.completed && String(task.id) === String(selectedTaskId),
    )

    const session = {
      id: Date.now(),
      durationMinutes,
      taskId: linkedTask ? linkedTask.id : null,
      taskTitle: linkedTask ? linkedTask.title : null,
      completedAt: new Date().toISOString(),
    }

    setIsRunning(false)
    onSessionsChange((current) => [session, ...current])
    setSecondsLeft(durationMinutes * 60)
  }, [
    isRunning,
    secondsLeft,
    durationMinutes,
    selectedTaskId,
    tasks,
    onSessionsChange,
  ])

  function applyDuration(minutes) {
    hasFinishedSessionRef.current = false
    setDurationMinutes(minutes)
    setSecondsLeft(minutes * 60)
    setIsRunning(false)
  }

  function handlePresetSelect(minutes) {
    setDurationMode(String(minutes))
    applyDuration(minutes)
  }

  function handleCustomSelect() {
    setDurationMode('custom')
    const minutes = Math.max(1, Number(customMinutes) || 1)
    setCustomMinutes(minutes)
    applyDuration(minutes)
  }

  function handleCustomMinutesChange(value) {
    setCustomMinutes(value)
    if (durationMode === 'custom' && !isRunning) {
      const minutes = Math.max(1, Number(value) || 1)
      setDurationMinutes(minutes)
      setSecondsLeft(minutes * 60)
    }
  }

  function handleStart() {
    hasFinishedSessionRef.current = false
    if (secondsLeft <= 0) {
      setSecondsLeft(durationMinutes * 60)
    }
    setIsRunning(true)
  }

  function handlePause() {
    setIsRunning(false)
  }

  function handleReset() {
    hasFinishedSessionRef.current = false
    setIsRunning(false)
    setSecondsLeft(durationMinutes * 60)
  }

  return (
    <main className="main focus-page">
      <header className="main-header">
        <h1>Focus</h1>
        <p className="subtitle">
          Stay locked in with timed deep-work sessions.
        </p>
      </header>

      <div className="focus-layout">
        <section className="focus-primary">
          <div className="timer-card">
            <p className="timer-label">
              {isRunning ? 'Session in progress' : 'Ready to focus'}
            </p>
            <p className="timer-display" aria-live="polite">
              {formatTimerDisplay(secondsLeft)}
            </p>

            <div className="timer-controls">
              {!isRunning ? (
                <button
                  type="button"
                  className="timer-btn timer-btn-primary"
                  onClick={handleStart}
                >
                  <Play size={16} strokeWidth={1.75} aria-hidden="true" />
                  Start
                </button>
              ) : (
                <button
                  type="button"
                  className="timer-btn timer-btn-primary"
                  onClick={handlePause}
                >
                  <Pause size={16} strokeWidth={1.75} aria-hidden="true" />
                  Pause
                </button>
              )}
              <button
                type="button"
                className="timer-btn"
                onClick={handleReset}
              >
                <RotateCcw size={16} strokeWidth={1.75} aria-hidden="true" />
                Reset
              </button>
            </div>

            <div className="session-setup">
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
                      disabled={isRunning}
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
                    disabled={isRunning}
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
                      disabled={isRunning}
                    />
                  </label>
                )}
              </div>

              <label className="setup-group">
                <span className="setup-label">Current task</span>
                <select
                  className="focus-select"
                  value={selectedTaskId}
                  onChange={(event) => setSelectedTaskId(event.target.value)}
                  disabled={isRunning}
                >
                  <option value="">No task selected</option>
                  {openTasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <section className="focus-sessions">
            <div className="focus-sessions-header">
              <h2>Recent Sessions</h2>
            </div>
            {recentSessions.length === 0 ? (
              <div className="empty-state focus-empty">
                <p className="empty-state-title">No focus sessions yet.</p>
                <p className="empty-state-text">
                  Start a timer to build your focus history.
                </p>
              </div>
            ) : (
              <div className="sessions-table-wrap">
                <table className="sessions-table">
                  <thead>
                    <tr>
                      <th>Completed</th>
                      <th>Duration</th>
                      <th>Task</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSessions.map((session) => (
                      <tr key={session.id}>
                        <td>{formatSessionTime(session.completedAt)}</td>
                        <td>
                          {formatFocusDuration(session.durationMinutes)}
                        </td>
                        <td>{session.taskTitle || '—'}</td>
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
            <h2>Today&apos;s Focus</h2>
            <div className="focus-stat-row">
              <div>
                <p className="mini-stat-label">Sessions Completed</p>
                <p className="focus-stat-value">
                  {todayStats.sessionsCompleted}
                </p>
              </div>
              <div>
                <p className="mini-stat-label">Total Focus Time</p>
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
