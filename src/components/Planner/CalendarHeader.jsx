import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import PageHeader from '../ui/PageHeader'

function CalendarHeader({
  heading,
  view,
  onPrevious,
  onToday,
  onNext,
  onViewChange,
  onAddTask,
}) {
  return (
    <>
      <PageHeader
        className="planner-page-header"
        title="Planner"
        subtitle="Drag unplanned tasks onto a day, or add a task for the selected date."
        actions={
          <button type="button" className="page-add-btn" onClick={onAddTask}>
            <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
            Add Task
          </button>
        }
      />

      <section className="planner-toolbar">
        <div className="planner-navigation">
          <button
            type="button"
            className="page-secondary-btn planner-nav-btn"
            onClick={onPrevious}
          >
            <ChevronLeft size={16} strokeWidth={1.75} aria-hidden="true" />
            Previous
          </button>
          <button
            type="button"
            className="page-secondary-btn planner-today-btn"
            onClick={onToday}
          >
            Today
          </button>
          <button
            type="button"
            className="page-secondary-btn planner-nav-btn"
            onClick={onNext}
          >
            Next
            <ChevronRight size={16} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>

        <h2 className="planner-period">{heading}</h2>

        <div
          className="segmented-control planner-view-toggle"
          aria-label="Calendar view"
        >
          <button
            type="button"
            className={view === 'week' ? 'active' : ''}
            onClick={() => onViewChange('week')}
          >
            Week
          </button>
          <button
            type="button"
            className={view === 'month' ? 'active' : ''}
            onClick={() => onViewChange('month')}
          >
            Month
          </button>
        </div>
      </section>
    </>
  )
}

export default CalendarHeader
