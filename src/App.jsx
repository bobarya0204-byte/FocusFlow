import { useEffect, useState } from 'react'
import './App.css'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import MyTasks from './components/MyTasks'
import FocusPage from './components/FocusPage'
import AnalyticsPage from './components/AnalyticsPage'
import TaskModal from './components/TaskModal'
import { getInitialTasks, TASKS_STORAGE_KEY } from './utils/tasks'
import {
  FOCUS_SESSIONS_KEY,
  getInitialFocusSessions,
} from './utils/focus'

function App() {
  const [tasks, setTasks] = useState(getInitialTasks)
  const [focusSessions, setFocusSessions] = useState(getInitialFocusSessions)
  const [activePage, setActivePage] = useState('dashboard')
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
    localStorage.setItem(FOCUS_SESSIONS_KEY, JSON.stringify(focusSessions))
  }, [focusSessions])

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
      tasks.map((task) => {
        if (task.id !== taskId) {
          return task
        }

        const completed = !task.completed
        if (completed) {
          return {
            ...task,
            completed: true,
            completedAt: new Date().toISOString(),
          }
        }

        const { completedAt, ...rest } = task
        return {
          ...rest,
          completed: false,
        }
      }),
    )
  }

  function toggleTaskMenu(taskId) {
    setMenuOpenTaskId((currentId) => (currentId === taskId ? null : taskId))
  }

  const taskListProps = {
    tasks,
    menuOpenTaskId,
    onToggleCompleted: toggleTaskCompleted,
    onToggleMenu: toggleTaskMenu,
    onEdit: openEditModal,
    onDelete: deleteTask,
  }

  return (
    <div className="app">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        activePage={activePage}
        onNavigate={setActivePage}
        onAddTask={openCreateModal}
      />

      {activePage === 'dashboard' && <Dashboard {...taskListProps} />}
      {activePage === 'tasks' && (
        <MyTasks {...taskListProps} onAddTask={openCreateModal} />
      )}
      {activePage === 'focus' && (
        <FocusPage
          tasks={tasks}
          sessions={focusSessions}
          onSessionsChange={setFocusSessions}
        />
      )}
      {activePage === 'analytics' && (
        <AnalyticsPage tasks={tasks} focusSessions={focusSessions} />
      )}

      {isModalOpen && (
        <TaskModal
          isEditing={isEditing}
          taskTitle={taskTitle}
          taskPriority={taskPriority}
          taskDueDate={taskDueDate}
          onTitleChange={setTaskTitle}
          onPriorityChange={setTaskPriority}
          onDueDateChange={setTaskDueDate}
          onClose={closeModal}
          onSubmit={handleSubmitTask}
        />
      )}
    </div>
  )
}

export default App
