import SeriesScopeDialog from '../tasks/SeriesScopeDialog'
import { SERIES_SCOPES } from '../../utils/recurrenceSeries'

const RESCHEDULE_OPTIONS = [
  {
    id: SERIES_SCOPES.OCCURRENCE,
    label: 'This occurrence only',
    description: 'Move only this instance and keep the rest of the series on schedule.',
  },
  {
    id: SERIES_SCOPES.FUTURE,
    label: 'This and future occurrences',
    description:
      'Shift this instance and all upcoming occurrences by the same amount.',
  },
  {
    id: SERIES_SCOPES.SERIES,
    label: 'Entire series',
    description: 'Move the full recurring schedule by the same amount.',
  },
]

function RescheduleScopeDialog({ onConfirm, onCancel }) {
  return (
    <SeriesScopeDialog
      title="Move recurring task"
      message="Choose how much of this recurring series to reschedule."
      options={RESCHEDULE_OPTIONS}
      confirmLabel="Move"
      confirmVariant="primary"
      stacked
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}

export default RescheduleScopeDialog
