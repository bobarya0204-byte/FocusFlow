import { useEffect, useMemo, useRef, useState } from 'react'
import { useFocusFlow } from '../../context/FocusFlowContext'
import CalendarHeader from './CalendarHeader'
import WeekView from './WeekView'
import MonthView from './MonthView'
import UnplannedPanel from './UnplannedPanel'
import DayTasksDrawer from './DayTasksDrawer'
import RescheduleScopeDialog from './RescheduleScopeDialog'
import { getTodayLocalDate } from '../../utils/dates'
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
import { isMasterRecurringTask } from '../../utils/recurrence'
import {
  findMasterTask,
  isVirtualOccurrenceId,
  parseVirtualOccurrenceId,
} from '../../utils/virtualTasks'

function PlannerPage() {
  const {
    tasks,
    projects,
    openCreateTask: onAddTask,
    openEditTask: onEdit,
    toggleTaskCompleted: onToggleCompleted,
    planTask: onPlanTask,
    rescheduleRecurringTask: onRescheduleRecurringTask,
  } = useFocusFlow()

  const [plannerState, setPlannerState] = useState(getInitialPlannerState)
  const [dropTarget, setDropTarget] = useState(null)
  const [drawerDate, setDrawerDate] = useState(null)
  const [currentDate, setCurrentDate] = useState(getTodayLocalDate)
  const [pendingReschedule, setPendingReschedule] = useState(null)
  const currentDateRef = useRef(currentDate)

  const { view, selectedDate, anchorDate, isUnplannedCollapsed } =
    plannerState
  const anchor = fromLocalDateKey(anchorDate)
  const projectMap = useMemo(() => buildProjectMap(projects), [projects])
  const unplannedTasks = useMemo(
    () =>
      tasks.filter(
        (task) => !isMasterRecurringTask(task) && !task.plannedDate,
      ),
    [tasks],
  )
  const drawerTasks = useMemo(
    () => (drawerDate ? getTasksForDate(tasks, drawerDate) : []),
    [drawerDate, tasks],
  )

  useEffect(() => {
    persistPlannerState(plannerState)
  }, [plannerState])

  useEffect(() => {
    currentDateRef.current = currentDate
  }, [currentDate])

  useEffect(() => {
    function rollCurrentDateIfNeeded() {
      const today = getTodayLocalDate()
      const previousToday = currentDateRef.current

      if (today === previousToday) {
        return
      }

      setCurrentDate(today)

      setPlannerState((current) => {
        if (current.selectedDate !== previousToday) {
          return current
        }

        return {
          ...current,
          selectedDate: today,
          anchorDate: today,
          lastSessionTodayDate: today,
        }
      })
    }

    rollCurrentDateIfNeeded()

    const intervalId = window.setInterval(rollCurrentDateIfNeeded, 60_000)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        rollCurrentDateIfNeeded()
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

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
    const today = getTodayLocalDate()
    setCurrentDate(today)
    updatePlannerState({
      selectedDate: today,
      anchorDate: today,
      lastSessionTodayDate: today,
    })
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

  function resolveTaskFromDateKey(taskId) {
    const parsed = parseVirtualOccurrenceId(taskId)
    if (parsed) {
      return parsed.dateKey
    }

    const task = tasks.find((item) => String(item.id) === String(taskId))
    return task?.plannedDate || task?.occurrenceDate || null
  }

  function isRecurringDragTarget(taskId) {
    if (isVirtualOccurrenceId(taskId)) {
      return Boolean(findMasterTask(tasks, taskId))
    }

    const task = tasks.find((item) => String(item.id) === String(taskId))
    return Boolean(task && isMasterRecurringTask(task))
  }

  function handleDrop(event, plannedDate) {
    event.preventDefault()
    const taskId = event.dataTransfer.getData('text/plain')
    if (!taskId) {
      setDropTarget(null)
      return
    }

    const isPlainTask = tasks.some((task) => String(task.id) === String(taskId))
    const isRecurring = isRecurringDragTarget(taskId)

    if (!isPlainTask && !isRecurring) {
      setDropTarget(null)
      return
    }

    if (isRecurring) {
      const fromDateKey = resolveTaskFromDateKey(taskId)
      if (!fromDateKey || !plannedDate || fromDateKey === plannedDate) {
        setDropTarget(null)
        return
      }

      setPendingReschedule({
        taskId,
        fromDateKey,
        toDateKey: plannedDate,
      })
      setDropTarget(null)
      return
    }

    onPlanTask(taskId, plannedDate)
    if (plannedDate) {
      updatePlannerState({ selectedDate: plannedDate })
    }
    setDropTarget(null)
  }

  function handleRescheduleConfirm(scope) {
    if (!pendingReschedule) {
      return
    }

    onRescheduleRecurringTask(
      pendingReschedule.taskId,
      pendingReschedule.fromDateKey,
      pendingReschedule.toDateKey,
      scope,
    )
    updatePlannerState({ selectedDate: pendingReschedule.toDateKey })
    setPendingReschedule(null)
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
      {pendingReschedule && (
        <RescheduleScopeDialog
          onCancel={() => setPendingReschedule(null)}
          onConfirm={handleRescheduleConfirm}
        />
      )}

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
