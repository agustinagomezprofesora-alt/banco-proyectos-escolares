import { HTMLAttributes, ReactNode } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
}

export default function Card({ className = '', children, ...props }: CardProps) {
  return (
    <div className={`ui-card ${className}`.trim()} {...props}>
      {children}
    </div>
  )
}
