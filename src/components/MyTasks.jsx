import { useState } from 'react'
import { Plus, Search, RotateCcw } from 'lucide-react'
import TaskCard from './TaskCard'
import {
  DEFAULT_SORT,
  filterAndSortTasks,
  getTaskCounts,
} from '../utils/tasks'

function MyTasks({
  tasks,
  menuOpenTaskId,
  onAddTask,
  onToggleCompleted,
  onToggleMenu,
  onEdit,
  onDelete,
}) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [sortBy, setSortBy] = useState(DEFAULT_SORT)

  const counts = getTaskCounts(tasks)
  const visibleTasks = filterAndSortTasks(tasks, {
    search,
    status: statusFilter,
    priority: priorityFilter,
    sort: sortBy,
  })

  const filtersAreActive =
    search.trim() !== '' ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    sortBy !== DEFAULT_SORT

  function clearFilters() {
    setSearch('')
    setStatusFilter('all')
    setPriorityFilter('all')
    setSortBy(DEFAULT_SORT)
  }

  return (
    <main className="main my-tasks">
      <header className="page-header">
        <div className="page-header-text">
          <h1>My Tasks</h1>
          <p className="subtitle">
            Manage, prioritize, and complete your work.
          </p>
        </div>
        <button
          type="button"
          className="page-add-btn"
          onClick={onAddTask}
        >
          <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
          Add Task
        </button>
      </header>

      <section className="my-tasks-summary">
        <article className="mini-stat">
          <span className="mini-stat-label">All Tasks</span>
          <span className="mini-stat-value">{counts.total}</span>
        </article>
        <article className="mini-stat">
          <span className="mini-stat-label">Open</span>
          <span className="mini-stat-value">{counts.open}</span>
        </article>
        <article className="mini-stat">
          <span className="mini-stat-label">Completed</span>
          <span className="mini-stat-value">{counts.completed}</span>
        </article>
        <article className="mini-stat">
          <span className="mini-stat-label">Overdue</span>
          <span className="mini-stat-value overdue">{counts.overdue}</span>
        </article>
      </section>

      <section className="tasks-toolbar">
        <label className="search-field">
          <Search size={16} strokeWidth={1.75} aria-hidden="true" />
          <input
            type="search"
            className="search-input"
            placeholder="Search tasks..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <div className="filter-controls">
          <label className="filter-field">
            <span className="filter-label">Status</span>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
          </label>

          <label className="filter-field">
            <span className="filter-label">Priority</span>
            <select
              className="filter-select"
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </label>

          <label className="filter-field">
            <span className="filter-label">Sort By</span>
            <select
              className="filter-select"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              <option value="due-earliest">Due Date: Earliest First</option>
              <option value="due-latest">Due Date: Latest First</option>
              <option value="priority-high">Priority: High to Low</option>
              <option value="priority-low">Priority: Low to High</option>
              <option value="recent">Recently Added</option>
            </select>
          </label>

          {filtersAreActive && (
            <button
              type="button"
              className="clear-filters-btn"
              onClick={clearFilters}
            >
              <RotateCcw size={14} strokeWidth={1.75} aria-hidden="true" />
              Clear filters
            </button>
          )}
        </div>
      </section>

      <section className="tasks-section">
        {tasks.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-title">No tasks yet.</p>
            <p className="empty-state-text">
              Create your first task to start organizing your work.
            </p>
            <button
              type="button"
              className="page-add-btn"
              onClick={onAddTask}
            >
              <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
              Add Task
            </button>
          </div>
        ) : visibleTasks.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-title">No tasks match your filters.</p>
            <p className="empty-state-text">
              Try adjusting search, status, priority, or sorting.
            </p>
            {filtersAreActive && (
              <button
                type="button"
                className="clear-filters-btn"
                onClick={clearFilters}
              >
                <RotateCcw size={14} strokeWidth={1.75} aria-hidden="true" />
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="task-list">
            {visibleTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                isMenuOpen={menuOpenTaskId === task.id}
                onToggleCompleted={onToggleCompleted}
                onToggleMenu={onToggleMenu}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default MyTasks
