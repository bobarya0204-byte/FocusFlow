import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  ListTodo,
  Focus,
  BarChart3,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  EllipsisVertical,
  Pencil,
  Trash2,
} from 'lucide-react'
import './App.css'

const DEFAULT_TASKS = [
  {
    id: 1,
    title: 'Finish presentation',
    priority: 'High',
    completed: false,
    dueDate: '2026-07-20',
  },
  {
    id: 2,
    title: 'Review project report',
    priority: 'Medium',
    completed: false,
    dueDate: '2026-07-29',
  },
  {
    id: 3,
    title: "Plan tomorrow's schedule",
    priority: 'Low',
    completed: true,
    dueDate: '2026-07-25',
  },
]

const TASKS_STORAGE_KEY = 'focusflow-tasks'

function normalizeTasks(tasks) {
  return tasks.map((task) => {
    const { status, ...rest } = task
    const completed =
      typeof task.completed === 'boolean'
        ? task.completed
        : status === 'Completed'

    return {
      ...rest,
      completed,
    }
  })
}

function getInitialTasks() {
  const saved = localStorage.getItem(TASKS_STORAGE_KEY)
  if (!saved) {
    return DEFAULT_TASKS
  }

  try {
    const parsed = JSON.parse(saved)
    if (Array.isArray(parsed)) {
      return normalizeTasks(parsed)
    }
  } catch {
    // Ignore invalid JSON and fall back to defaults
  }

  return DEFAULT_TASKS
}

function getTodayLocalDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isTaskOverdue(task) {
  if (task.completed || !task.dueDate) {
    return false
  }

  return task.dueDate < getTodayLocalDate()
}

function formatDueDate(dueDate) {
  const [year, month, day] = dueDate.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function App() {
  const [tasks, setTasks] = useState(getInitialTasks)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [menuOpenTaskId, setMenuOpenTaskId] = useState(null)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskPriority, setTaskPriority] = useState('Medium')
  const [taskDueDate, setTaskDueDate] = useState('')

  useEffect(() => {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    if (menuOpenTaskId === null) {
      return
    }

    function handlePointerDown(event) {
      if (!event.target.closest('.task-menu')) {
        setMenuOpenTaskId(null)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [menuOpenTaskId])

  const completedCount = tasks.filter((task) => task.completed).length
  const openCount = tasks.filter((task) => !task.completed).length
  const overdueCount = tasks.filter((task) => isTaskOverdue(task)).length
  const isEditing = editingTaskId !== null

  function resetModalFields() {
    setTaskTitle('')
    setTaskPriority('Medium')
    setTaskDueDate('')
    setEditingTaskId(null)
  }

  function openCreateModal() {
    resetModalFields()
    setMenuOpenTaskId(null)
    setIsModalOpen(true)
  }

  function openEditModal(task) {
    setEditingTaskId(task.id)
    setTaskTitle(task.title)
    setTaskPriority(task.priority)
    setTaskDueDate(task.dueDate || '')
    setMenuOpenTaskId(null)
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    resetModalFields()
  }

  function handleSubmitTask(event) {
    event.preventDefault()

    const trimmedTitle = taskTitle.trim()
    if (!trimmedTitle || !taskDueDate) {
      return
    }

    if (isEditing) {
      setTasks(
        tasks.map((task) =>
          task.id === editingTaskId
            ? {
                ...task,
                title: trimmedTitle,
                priority: taskPriority,
                dueDate: taskDueDate,
              }
            : task,
        ),
      )
    } else {
      const newTask = {
        id: Date.now(),
        title: trimmedTitle,
        priority: taskPriority,
        completed: false,
        dueDate: taskDueDate,
      }
      setTasks([...tasks, newTask])
    }

    closeModal()
  }

  function deleteTask(taskId) {
    setTasks(tasks.filter((task) => task.id !== taskId))
    setMenuOpenTaskId(null)
  }

  function toggleTaskCompleted(taskId) {
    setTasks(
      tasks.map((task) =>
        task.id === taskId
          ? { ...task, completed: !task.completed }
          : task,
      ),
    )
  }

  function toggleTaskMenu(taskId) {
    setMenuOpenTaskId((currentId) => (currentId === taskId ? null : taskId))
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
          onClick={openCreateModal}
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
          <h1>Ssup Bro!</h1>
          <p className="subtitle">Here&apos;s what needs your attention today.</p>
        </header>

        <section className="summary-grid">
          <article className="summary-card">
            <p className="summary-label">Tasks Today</p>
            <p className="summary-value">{tasks.length}</p>
          </article>
          <article className="summary-card">
            <p className="summary-label">Completed</p>
            <p className="summary-value">{completedCount}</p>
          </article>
          <article className="summary-card">
            <p className="summary-label">Open</p>
            <p className="summary-value">{openCount}</p>
          </article>
          <article className="summary-card">
            <p className="summary-label">Overdue</p>
            <p className="summary-value overdue">{overdueCount}</p>
          </article>
        </section>

        <section className="tasks-section">
          <h2>Today&apos;s Tasks</h2>
          <div className="task-list">
            {tasks.map((task) => {
              const overdue = isTaskOverdue(task)
              const isMenuOpen = menuOpenTaskId === task.id

              return (
                <article
                  key={task.id}
                  className={`task-card${task.completed ? ' completed' : ''}${
                    overdue ? ' overdue' : ''
                  }`}
                >
                  <label className="task-check">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTaskCompleted(task.id)}
                      aria-label={`Mark "${task.title}" as ${
                        task.completed ? 'open' : 'completed'
                      }`}
                    />
                  </label>
                  <div className="task-content">
                    <p className="task-title">{task.title}</p>
                    {task.dueDate && (
                      <p className={`task-due${overdue ? ' overdue' : ''}`}>
                        Due {formatDueDate(task.dueDate)}
                      </p>
                    )}
                  </div>
                  <div className="task-meta">
                    <span
                      className={`priority priority-${task.priority.toLowerCase()}`}
                    >
                      {task.priority} Priority
                    </span>
                    <div className="task-menu">
                      <button
                        type="button"
                        className="task-menu-btn"
                        onClick={() => toggleTaskMenu(task.id)}
                        aria-label={`Open menu for ${task.title}`}
                        aria-expanded={isMenuOpen}
                      >
                        <EllipsisVertical size={16} strokeWidth={1.75} />
                      </button>
                      {isMenuOpen && (
                        <div className="task-menu-dropdown" role="menu">
                          <button
                            type="button"
                            className="task-menu-item"
                            role="menuitem"
                            onClick={() => openEditModal(task)}
                          >
                            <Pencil size={14} strokeWidth={1.75} />
                            Edit
                          </button>
                          <button
                            type="button"
                            className="task-menu-item danger"
                            role="menuitem"
                            onClick={() => deleteTask(task.id)}
                          >
                            <Trash2 size={14} strokeWidth={1.75} />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
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
            <h2 id="modal-title">
              {isEditing ? 'Edit task' : 'Create a new task'}
            </h2>

            <form onSubmit={handleSubmitTask}>
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

              <label className="modal-field">
                <span className="modal-label">Due Date</span>
                <input
                  type="date"
                  className="modal-input"
                  value={taskDueDate}
                  onChange={(event) => setTaskDueDate(event.target.value)}
                  required
                />
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
                  {isEditing ? 'Save Changes' : 'Create Task'}
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
