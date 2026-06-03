import Button from '../ui/Button'

type ActionVariant = 'primary' | 'secondary' | 'soft' | 'accent' | 'danger' | 'ghost'

export type ProjectActionCardItem = {
  title: string
  actionLabel: string
  variant: ActionVariant
  onClick: () => void
  disabled?: boolean
}

export type ProjectActionCardGroup = {
  title: string
  actions: ProjectActionCardItem[]
}

type ProjectActionCardsProps = {
  groups: ProjectActionCardGroup[]
}

export default function ProjectActionCards({ groups }: ProjectActionCardsProps) {
  return (
    <section className="project-quick-actions">
      <div className="project-quick-actions-heading">
        <h2>Acciones rápidas</h2>
      </div>

      <div className="project-quick-actions-grid">
        {groups.map((group) => (
          <div key={group.title} className="project-quick-actions-group">
            <h3>{group.title}</h3>
            <div className="project-quick-actions-buttons">
              {group.actions.map((action) => (
                <Button key={action.title} variant={action.variant} onClick={action.onClick} disabled={action.disabled}>
                  {action.actionLabel}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
