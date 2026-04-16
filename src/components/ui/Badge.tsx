import { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  color?: string
  className?: string
}

export function Badge({ children, color, className = '' }: BadgeProps) {
  const style = color ? { backgroundColor: `${color}20`, color } : undefined
  return (
    <span
      style={style}
      className={`inline-flex items-center rounded-full border border-white/10 px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {children}
    </span>
  )
}
