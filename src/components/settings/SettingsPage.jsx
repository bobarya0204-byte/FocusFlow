import { Monitor, Moon, Sun } from 'lucide-react'
import { useFocusFlow } from '../../context/FocusFlowContext'
import { THEMES } from '../../utils/theme'
import PageHeader from '../ui/PageHeader'

function SettingsPage() {
  const { theme, setTheme } = useFocusFlow()

  const options = [
    {
      id: THEMES.LIGHT,
      label: 'Light',
      description: 'Default Fluent-inspired appearance',
      icon: Sun,
    },
    {
      id: THEMES.DARK,
      label: 'Dark',
      description: 'Reduced glare for low-light environments',
      icon: Moon,
    },
  ]

  return (
    <main className="main">
      <PageHeader
        title="Settings"
        subtitle="Personalize your FocusFlow experience"
      />

      <section className="settings-section" aria-labelledby="settings-appearance">
        <div className="settings-section-header">
          <Monitor size={18} strokeWidth={1.75} aria-hidden="true" />
          <div>
            <h2 id="settings-appearance">Appearance</h2>
            <p>Choose how FocusFlow looks on this device.</p>
          </div>
        </div>

        <div className="settings-theme-options" role="radiogroup" aria-label="Theme">
          {options.map(({ id, label, description, icon: Icon }) => {
            const isActive = theme === id
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={isActive}
                className={`settings-theme-option${isActive ? ' active' : ''}`}
                onClick={() => setTheme(id)}
              >
                <span className="settings-theme-icon" aria-hidden="true">
                  <Icon size={20} strokeWidth={1.75} />
                </span>
                <span className="settings-theme-copy">
                  <span className="settings-theme-label">{label}</span>
                  <span className="settings-theme-description">{description}</span>
                </span>
              </button>
            )
          })}
        </div>
      </section>
    </main>
  )
}

export default SettingsPage
