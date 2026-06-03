import { getStatusBadgeClass, normalizeStatus } from '../../utils/ui'

type StatusBadgeProps = {
  status: string
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`badge ${getStatusBadgeClass(status)}`}>{normalizeStatus(status)}</span>
}
