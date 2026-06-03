type StateProps = {
  message: string
}

export function LoadingState({ message }: StateProps) {
  return <div className="loading-state">{message}</div>
}

export function ErrorState({ message }: StateProps) {
  return <div className="error">{message}</div>
}

export function EmptyState({ message }: StateProps) {
  return (
    <div className="empty-state">
      <p>{message}</p>
    </div>
  )
}
