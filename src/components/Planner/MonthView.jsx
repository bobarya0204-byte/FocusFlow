import DayCell from './DayCell'
import {
  DAY_NAMES,
  getMonthDays,
  getTasksForDate,
  toLocalDateKey,
} from '../../utils/planner'

function MonthView({
  anchorDate,
  selectedDate,
  tasks,
  projectMap,
  dropTarget,
  onSelectDate,
  onShowAll,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onToggleCompleted,
  onEdit,
}) {
  return (
    <section className="planner-month">
      <div className="planner-month-weekdays">
        {DAY_NAMES.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="planner-month-grid">
        {getMonthDays(anchorDate).map((date) => {
          const dateKey = toLocalDateKey(date)
          return (
            <DayCell
              key={dateKey}
              date={date}
              monthDate={anchorDate}
              tasks={getTasksForDate(tasks, dateKey)}
              projectMap={projectMap}
              selectedDate={selectedDate}
              dropTarget={dropTarget}
              onSelectDate={onSelectDate}
              onShowAll={onShowAll}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onToggleCompleted={onToggleCompleted}
              onEdit={onEdit}
            />
          )
        })}
      </div>
    </section>
  )
}

export default MonthView
