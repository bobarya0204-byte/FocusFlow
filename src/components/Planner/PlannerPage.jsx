import { useEffect, useMemo, useState } from 'react'
import { useFocusFlow } from '../../context/FocusFlowContext'
import CalendarHeader from './CalendarHeader'
import WeekView from './WeekView'
import MonthView from './MonthView'
import UnplannedPanel from './UnplannedPanel'
import DayTasksDrawer from './DayTasksDrawer'
import {
  addDays,
  addMonths,
  buildProjectMap,
  formatPlannerHeading,
  fromLocalDateKey,
  getInitialPlannerState,
  getTasksForDate,
  isSameMonth,
  persistPlannerState,
  toLocalDateKey,
} from '../../utils/planner'

function PlannerPage() {
  const {
    tasks,
    projects,
    openCreateTask: onAddTask,
    openEditTask: onEdit,
    toggleTaskCompleted: onToggleCompleted,
    planTask: onPlanTask,
  } = useFocusFlow()

  const [plannerState, setPlannerState] = useState(getInitialPlannerState)
  const [dropTarget, setDropTarget] = useState(null)
  const [drawerDate, setDrawerDate] = useState(null)

  const { view, selectedDate, anchorDate, isUnplannedCollapsed } =
    plannerState
  const anchor = fromLocalDateKey(anchorDate)
  const projectMap = useMemo(() => buildProjectMap(projects), [projects])
  const unplannedTasks = useMemo(
    () => tasks.filter((task) => !task.plannedDate),
    [tasks],
  )
  const drawerTasks = useMemo(
    () => (drawerDate ? getTasksForDate(tasks, drawerDate) : []),
    [drawerDate, tasks],
  )

  useEffect(() => {
    persistPlannerState(plannerState)
  }, [plannerState])

  function updatePlannerState(changes) {
    setPlannerState((current) => ({ ...current, ...changes }))
  }

  function navigate(direction) {
    const next =
      view === 'week'
        ? addDays(anchor, direction * 7)
        : addMonths(anchor, direction)
    updatePlannerState({ anchorDate: toLocalDateKey(next) })
  }

  function goToToday() {
    const today = toLocalDateKey(new Date())
    updatePlannerState({ selectedDate: today, anchorDate: today })
  }

  function selectDate(date) {
    const dateKey = toLocalDateKey(date)
    const changes = { selectedDate: dateKey }

    if (view === 'month' && !isSameMonth(date, anchor)) {
      changes.anchorDate = dateKey
    }

    updatePlannerState(changes)
  }

  function handleDragStart(event, taskId) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(taskId))
  }

  function handleDragOver(event, target) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setDropTarget(target)
  }

  function handleDrop(event, plannedDate) {
    event.preventDefault()
    const taskId = event.dataTransfer.getData('text/plain')
    if (taskId) {
      const exists = tasks.some((task) => String(task.id) === String(taskId))
      if (exists) {
        onPlanTask(taskId, plannedDate)
        if (plannedDate) {
          updatePlannerState({ selectedDate: plannedDate })
        }
      }
    }
    setDropTarget(null)
  }

  function showAllTasks(date) {
    const dateKey = toLocalDateKey(date)
    updatePlannerState({ selectedDate: dateKey })
    setDrawerDate(dateKey)
  }

  const calendarProps = {
    anchorDate: anchor,
    selectedDate,
    tasks,
    projectMap,
    dropTarget,
    onSelectDate: selectDate,
    onDragStart: handleDragStart,
    onDragOver: handleDragOver,
    onDragLeave: () => setDropTarget(null),
    onDrop: handleDrop,
    onToggleCompleted,
    onEdit,
  }

  return (
    <main className="main">
      <CalendarHeader
        heading={formatPlannerHeading(anchor, view)}
        view={view}
        onPrevious={() => navigate(-1)}
        onToday={goToToday}
        onNext={() => navigate(1)}
        onViewChange={(nextView) => updatePlannerState({ view: nextView })}
        onAddTask={() => onAddTask(selectedDate)}
      />

      <div
        className={`planner-workspace${
          isUnplannedCollapsed ? ' panel-collapsed' : ''
        }`}
      >
        <div className="planner-calendar-area">
          {view === 'week' ? (
            <WeekView {...calendarProps} />
          ) : (
            <MonthView {...calendarProps} onShowAll={showAllTasks} />
          )}
        </div>

        <UnplannedPanel
          tasks={unplannedTasks}
          projectMap={projectMap}
          isCollapsed={isUnplannedCollapsed}
          isDropTarget={dropTarget === 'unplanned'}
          onToggleCollapse={() =>
            updatePlannerState({
              isUnplannedCollapsed: !isUnplannedCollapsed,
            })
          }
          onDragStart={handleDragStart}
          onDragOver={(event) => handleDragOver(event, 'unplanned')}
          onDragLeave={() => setDropTarget(null)}
          onDrop={(event) => handleDrop(event, null)}
          onToggleCompleted={onToggleCompleted}
          onEdit={onEdit}
        />
      </div>

      <DayTasksDrawer
        dateKey={drawerDate}
        tasks={drawerTasks}
        projectMap={projectMap}
        onClose={() => setDrawerDate(null)}
        onDragStart={handleDragStart}
        onToggleCompleted={onToggleCompleted}
        onEdit={onEdit}
      />
    </main>
  )
}

export default PlannerPage
