import {
  LayoutDashboard,
  ListTodo,
  CalendarDays,
  Focus,
  BarChart3,
  Inbox,
  Trash2,
  Plus,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
} from 'lucide-react'

function Sidebar({
  isCollapsed,
  onToggleCollapse,
  activePage,
  onNavigate,
  onAddTask,
  onOpenSearch,
  deletedCount = 0,
}) {
  return (
    <aside className={`sidebar${isCollapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-header-row">
          <span className="sidebar-app-avatar" aria-label="FocusFlow">
            F
          </span>
          <p className="sidebar-title">FocusFlow</p>
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
        <div className="sidebar-title-divider" aria-hidden="true" />
        <button
          type="button"
          className="sidebar-search-trigger"
          onClick={onOpenSearch}
          title="Search (Ctrl+K)"
          aria-label="Search tasks and projects"
        >
          <Search size={16} strokeWidth={1.75} aria-hidden="true" />
          <span className="sidebar-search-label">Search…</span>
          <kbd className="sidebar-search-kbd">Ctrl K</kbd>
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
          className={`nav-item${activePage === 'planner' ? ' active' : ''}`}
          title="Planner"
          onClick={() => onNavigate('planner')}
        >
          <span className="nav-icon" aria-hidden="true">
            <CalendarDays size={18} strokeWidth={1.75} />
          </span>
          <span className="nav-label">Planner</span>
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
        <button
          type="button"
          className={`nav-item${activePage === 'inbox' ? ' active' : ''}`}
          title="AI Inbox"
          onClick={() => onNavigate('inbox')}
        >
          <span className="nav-icon" aria-hidden="true">
            <Inbox size={18} strokeWidth={1.75} />
          </span>
          <span className="nav-label">AI Inbox</span>
        </button>
        <div className="sidebar-nav-divider" aria-hidden="true" />
        <button
          type="button"
          className={`nav-item${activePage === 'settings' ? ' active' : ''}`}
          title="Settings"
          onClick={() => onNavigate('settings')}
        >
          <span className="nav-icon" aria-hidden="true">
            <Settings size={18} strokeWidth={1.75} />
          </span>
          <span className="nav-label">Settings</span>
        </button>
        <button
          type="button"
          className={`nav-item${activePage === 'deleted' ? ' active' : ''}`}
          title="Deleted Items"
          onClick={() => onNavigate('deleted')}
        >
          <span className="nav-icon" aria-hidden="true">
            <Trash2 size={18} strokeWidth={1.75} />
          </span>
          <span className="nav-label">
            Deleted Items
            {deletedCount > 0 ? ` (${deletedCount})` : ''}
          </span>
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
