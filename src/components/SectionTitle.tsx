import type { LucideIcon } from 'lucide-react'

type SectionTitleProps = {
  icon: LucideIcon
  children: string
}

export function SectionTitle({ icon: Icon, children }: SectionTitleProps) {
  return (
    <div className="section-title">
      <Icon size={15} />
      {children}
    </div>
  )
}
