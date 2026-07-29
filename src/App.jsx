import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  ListTodo,
  Focus,
  BarChart3,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import './App.css'

const DEFAULT_TASKS = [
  { id: 1, title: 'Finish presentation', priority: 'High' },
  { id: 2, title: 'Review project report', priority: 'Medium' },
  { id: 3, title: "Plan tomorrow's schedule", priority: 'Low' },
]

const TASKS_STORAGE_KEY = 'focusflow-tasks'

function getInitialTasks() {
  const saved = localStorage.getItem(TASKS_STORAGE_KEY)
  if (!saved) {
    return DEFAULT_TASKS
  }

  try {
    const parsed = JSON.parse(saved)
    if (Array.isArray(parsed)) {
      return parsed
    }
  } catch {
    // Ignore invalid JSON and fall back to defaults
  }

  return DEFAULT_TASKS
}

function App() {
  const [tasks, setTasks] = useState(getInitialTasks)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskPriority, setTaskPriority] = useState('Medium')

  useEffect(() => {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  function openModal() {
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
  }

  function handleCreateTask(event) {
    event.preventDefault()

    const trimmedTitle = taskTitle.trim()
    if (!trimmedTitle) {
      return
    }

    const newTask = {
      id: Date.now(),
      title: trimmedTitle,
      priority: taskPriority,
    }

    setTasks([...tasks, newTask])
    setTaskTitle('')
    setTaskPriority('Medium')
    setIsModalOpen(false)
  }

  return (
    <div className="app">
      <aside
        className={`sidebar${isSidebarCollapsed ? ' collapsed' : ''}`}
      >
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="brand-mark" aria-hidden="true">
              F
            </span>
            <span className="brand-text">FocusFlow</span>
          </div>
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            aria-label={
              isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
            }
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen size={16} strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <PanelLeftClose size={16} strokeWidth={1.75} aria-hidden="true" />
            )}
          </button>
        </div>
        <nav className="sidebar-nav">
          <a href="#" className="nav-item active" title="Dashboard">
            <span className="nav-icon" aria-hidden="true">
              <LayoutDashboard size={18} strokeWidth={1.75} />
            </span>
            <span className="nav-label">Dashboard</span>
          </a>
          <a href="#" className="nav-item" title="My Tasks">
            <span className="nav-icon" aria-hidden="true">
              <ListTodo size={18} strokeWidth={1.75} />
            </span>
            <span className="nav-label">My Tasks</span>
          </a>
          <a href="#" className="nav-item" title="Focus">
            <span className="nav-icon" aria-hidden="true">
              <Focus size={18} strokeWidth={1.75} />
            </span>
            <span className="nav-label">Focus</span>
          </a>
          <a href="#" className="nav-item" title="Analytics">
            <span className="nav-icon" aria-hidden="true">
              <BarChart3 size={18} strokeWidth={1.75} />
            </span>
            <span className="nav-label">Analytics</span>
          </a>
        </nav>
        <button
          type="button"
          className="add-task-btn"
          onClick={openModal}
          title="Add Task"
        >
          <span className="add-task-icon" aria-hidden="true">
            <Plus size={18} strokeWidth={1.75} />
          </span>
          <span className="add-task-label">Add Task</span>
        </button>
      </aside>

      <main className="main">
        <header className="main-header">
          <h1>Good evening</h1>
          <p className="subtitle">Here&apos;s what needs your attention today.</p>
        </header>

        <section className="summary-grid">
          <article className="summary-card">
            <p className="summary-label">Tasks Today</p>
            <p className="summary-value">{tasks.length}</p>
          </article>
          <article className="summary-card">
            <p className="summary-label">Completed</p>
            <p className="summary-value">2</p>
          </article>
          <article className="summary-card">
            <p className="summary-label">In Progress</p>
            <p className="summary-value">3</p>
          </article>
          <article className="summary-card">
            <p className="summary-label">Overdue</p>
            <p className="summary-value overdue">1</p>
          </article>
        </section>

        <section className="tasks-section">
          <h2>Today&apos;s Tasks</h2>
          <div className="task-list">
            {tasks.map((task) => (
              <article key={task.id} className="task-card">
                <p className="task-title">{task.title}</p>
                <span
                  className={`priority priority-${task.priority.toLowerCase()}`}
                >
                  {task.priority} Priority
                </span>
              </article>
            ))}
          </div>
        </section>
      </main>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal"
            role="dialog"
            aria-labelledby="modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="modal-title">Create a new task</h2>

            <form onSubmit={handleCreateTask}>
              <label className="modal-field">
                <span className="modal-label">Task title</span>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="Enter task title"
                  value={taskTitle}
                  onChange={(event) => setTaskTitle(event.target.value)}
                />
              </label>

              <label className="modal-field">
                <span className="modal-label">Priority</span>
                <select
                  className="modal-select"
                  value={taskPriority}
                  onChange={(event) => setTaskPriority(event.target.value)}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-btn modal-btn-cancel"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button type="submit" className="modal-btn modal-btn-create">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
