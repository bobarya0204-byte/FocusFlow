function TaskModal({
  isEditing,
  taskTitle,
  taskPriority,
  taskDueDate,
  onTitleChange,
  onPriorityChange,
  onDueDateChange,
  onClose,
  onSubmit,
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-labelledby="modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="modal-title">
          {isEditing ? 'Edit task' : 'Create a new task'}
        </h2>

        <form onSubmit={onSubmit}>
          <label className="modal-field">
            <span className="modal-label">Task title</span>
            <input
              type="text"
              className="modal-input"
              placeholder="Enter task title"
              value={taskTitle}
              onChange={(event) => onTitleChange(event.target.value)}
            />
          </label>

          <label className="modal-field">
            <span className="modal-label">Priority</span>
            <select
              className="modal-select"
              value={taskPriority}
              onChange={(event) => onPriorityChange(event.target.value)}
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </label>

          <label className="modal-field">
            <span className="modal-label">Due Date</span>
            <input
              type="date"
              className="modal-input"
              value={taskDueDate}
              onChange={(event) => onDueDateChange(event.target.value)}
              required
            />
          </label>

          <div className="modal-actions">
            <button
              type="button"
              className="modal-btn modal-btn-cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="modal-btn modal-btn-create">
              {isEditing ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TaskModal
