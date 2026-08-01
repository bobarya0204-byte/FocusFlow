import './App.css'
import { useFocusFlow } from './context/FocusFlowContext'
import Sidebar from './components/layout/Sidebar'
import Dashboard from './components/dashboard/Dashboard'
import MyTasks from './components/tasks/MyTasks'
import FocusPage from './components/focus/FocusPage'
import AnalyticsPage from './components/analytics/AnalyticsPage'
import PlannerPage from './components/Planner/PlannerPage'
import DeletedItemsPage from './components/deleted/DeletedItemsPage'
import TaskModal from './components/tasks/TaskModal'
import ProjectModal from './components/projects/ProjectModal'
import Toast from './components/ui/Toast'
import ArchivedProjectDialog from './components/projects/ArchivedProjectDialog'

function App() {
  const {
    tasks,
    projects,
    activePage,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    deletedCount,
    taskModal,
    projectModal,
    archivedGuardProject,
    dismissArchivedGuard,
    restoreArchivedGuardProject,
    toast,
    dismissToast,
    undoToast,
    navigateTo,
    openCreateTask,
    closeTaskModal,
    saveTask,
    closeProjectModal,
    saveProject,
  } = useFocusFlow()

  return (
    <div className="app">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        activePage={activePage}
        onNavigate={navigateTo}
        onAddTask={openCreateTask}
        deletedCount={deletedCount}
      />

      {activePage === 'dashboard' && <Dashboard />}
      {activePage === 'tasks' && <MyTasks />}
      {activePage === 'focus' && <FocusPage />}
      {activePage === 'analytics' && <AnalyticsPage />}
      {activePage === 'planner' && <PlannerPage />}
      {activePage === 'deleted' && <DeletedItemsPage />}

      {taskModal && (
        <TaskModal
          task={taskModal.task}
          defaults={taskModal.defaults}
          projects={projects}
          tasks={tasks}
          onClose={closeTaskModal}
          onSave={saveTask}
        />
      )}

      {projectModal && (
        <ProjectModal
          project={projectModal.project}
          defaults={projectModal.defaults}
          onClose={closeProjectModal}
          onSave={saveProject}
        />
      )}

      {archivedGuardProject && (
        <ArchivedProjectDialog
          project={archivedGuardProject}
          onCancel={dismissArchivedGuard}
          onRestore={restoreArchivedGuardProject}
        />
      )}

      <Toast toast={toast} onUndo={undoToast} onDismiss={dismissToast} />
    </div>
  )
}

export default App
