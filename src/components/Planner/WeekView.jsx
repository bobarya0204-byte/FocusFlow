import DayColumn from './DayColumn'
import {
  getTasksForDate,
  getWeekDays,
  toLocalDateKey,
} from '../../utils/planner'

function WeekView({
  anchorDate,
  selectedDate,
  tasks,
  projectMap,
  dropTarget,
  onSelectDate,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onToggleCompleted,
  onEdit,
}) {
  const days = getWeekDays(anchorDate)

  return (
    <section className="planner-week-grid">
      {days.map((date) => {
        const dateKey = toLocalDateKey(date)
        return (
          <DayColumn
            key={dateKey}
            date={date}
            tasks={getTasksForDate(tasks, dateKey)}
            projectMap={projectMap}
            isSelected={dateKey === selectedDate}
            isDropTarget={dropTarget === dateKey}
            onSelect={onSelectDate}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onToggleCompleted={onToggleCompleted}
            onEdit={onEdit}
          />
        )
      })}
    </section>
  )
}

export default WeekView
