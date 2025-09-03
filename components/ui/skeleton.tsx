import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'div' | 'span'
}

function Skeleton({
  className,
  as: Component = 'div',
  ...props
}: SkeletonProps) {
  return (
    <Component
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }