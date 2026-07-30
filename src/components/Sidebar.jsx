import {
  LayoutDashboard,
  ListTodo,
  Focus,
  BarChart3,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'

function Sidebar({
  isCollapsed,
  onToggleCollapse,
  activePage,
  onNavigate,
  onAddTask,
}) {
  return (
    <aside className={`sidebar${isCollapsed ? ' collapsed' : ''}`}>
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
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <PanelLeftOpen size={16} strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <PanelLeftClose size={16} strokeWidth={1.75} aria-hidden="true" />
          )}
        </button>
      </div>

      <nav className="sidebar-nav">
        <button
          type="button"
          className={`nav-item${activePage === 'dashboard' ? ' active' : ''}`}
          title="Dashboard"
          onClick={() => onNavigate('dashboard')}
        >
          <span className="nav-icon" aria-hidden="true">
            <LayoutDashboard size={18} strokeWidth={1.75} />
          </span>
          <span className="nav-label">Dashboard</span>
        </button>
        <button
          type="button"
          className={`nav-item${activePage === 'tasks' ? ' active' : ''}`}
          title="My Tasks"
          onClick={() => onNavigate('tasks')}
        >
          <span className="nav-icon" aria-hidden="true">
            <ListTodo size={18} strokeWidth={1.75} />
          </span>
          <span className="nav-label">My Tasks</span>
        </button>
        <button
          type="button"
          className={`nav-item${activePage === 'focus' ? ' active' : ''}`}
          title="Focus"
          onClick={() => onNavigate('focus')}
        >
          <span className="nav-icon" aria-hidden="true">
            <Focus size={18} strokeWidth={1.75} />
          </span>
          <span className="nav-label">Focus</span>
        </button>
        <button
          type="button"
          className={`nav-item${activePage === 'analytics' ? ' active' : ''}`}
          title="Analytics"
          onClick={() => onNavigate('analytics')}
        >
          <span className="nav-icon" aria-hidden="true">
            <BarChart3 size={18} strokeWidth={1.75} />
          </span>
          <span className="nav-label">Analytics</span>
        </button>
      </nav>

      <button
        type="button"
        className="add-task-btn"
        onClick={onAddTask}
        title="Add Task"
      >
        <span className="add-task-icon" aria-hidden="true">
          <Plus size={18} strokeWidth={1.75} />
        </span>
        <span className="add-task-label">Add Task</span>
      </button>
    </aside>
  )
}

export default Sidebar
