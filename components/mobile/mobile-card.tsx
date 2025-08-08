'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MobileCardProps {
  title?: string
  children: React.ReactNode
  className?: string
  compact?: boolean
  icon?: React.ComponentType<any>
  actions?: React.ReactNode
}

export function MobileCard({ 
  title, 
  children, 
  className, 
  compact = false,
  icon: Icon,
  actions
}: MobileCardProps) {
  return (
    <Card className={cn(
      "w-full transition-all duration-200",
      compact ? "p-2" : "p-1",
      className
    )}>
      {title && (
        <CardHeader className={cn(
          "flex flex-row items-center justify-between space-y-0",
          compact ? "pb-2 px-3 pt-3" : "pb-3 px-4 pt-4"
        )}>
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
            <CardTitle className={cn(
              "font-semibold",
              compact ? "text-sm" : "text-base"
            )}>
              {title}
            </CardTitle>
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </CardHeader>
      )}
      <CardContent className={cn(
        compact ? "px-3 pb-3" : "px-4 pb-4",
        !title && (compact ? "pt-3" : "pt-4")
      )}>
        {children}
      </CardContent>
    </Card>
  )
}

interface MobileMetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ComponentType<any>
  trend?: {
    value: string
    positive?: boolean
  }
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo'
  onClick?: () => void
}

export function MobileMetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'blue',
  onClick
}: MobileMetricCardProps) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100', 
    purple: 'text-purple-600 bg-purple-100',
    orange: 'text-orange-600 bg-orange-100',
    red: 'text-red-600 bg-red-100',
    indigo: 'text-indigo-600 bg-indigo-100'
  }

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md active:scale-95",
        onClick && "select-none"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between space-x-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className={cn("p-1.5 rounded-full", colorClasses[color])}>
                <Icon className="h-3 w-3" />
              </div>
              <p className="text-xs font-medium text-muted-foreground truncate">
                {title}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold text-gray-900 leading-none">
                {value}
              </p>
              {subtitle && (
                <p className="text-xs text-muted-foreground truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {trend && (
            <div className="text-right">
              <div className={cn(
                "text-xs font-medium",
                trend.positive ? 'text-green-600' : 'text-red-600'
              )}>
                {trend.value}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface MobileListCardProps {
  title: string
  items: Array<{
    id: string
    primary: string
    secondary?: string
    tertiary?: string
    status?: 'success' | 'warning' | 'error' | 'info'
    action?: {
      label: string
      onClick: () => void
    }
  }>
  emptyMessage?: string
  maxItems?: number
  onViewAll?: () => void
}

export function MobileListCard({
  title,
  items,
  emptyMessage = "No items available",
  maxItems = 5,
  onViewAll
}: MobileListCardProps) {
  const displayItems = items.slice(0, maxItems)
  const hasMore = items.length > maxItems

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      case 'error': return 'bg-red-100 text-red-800'
      case 'info': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <MobileCard 
      title={title}
      actions={
        onViewAll && (
          <button 
            onClick={onViewAll}
            className="text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            View All
          </button>
        )
      }
    >
      <div className="space-y-3">
        {displayItems.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {emptyMessage}
          </p>
        ) : (
          displayItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between space-x-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {item.primary}
                </p>
                {item.secondary && (
                  <p className="text-xs text-muted-foreground truncate">
                    {item.secondary}
                  </p>
                )}
                {item.tertiary && (
                  <p className="text-xs text-muted-foreground truncate">
                    {item.tertiary}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {item.status && (
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    getStatusColor(item.status)
                  )}>
                    {item.status}
                  </span>
                )}
                {item.action && (
                  <button
                    onClick={item.action.onClick}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800"
                  >
                    {item.action.label}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
        {hasMore && onViewAll && (
          <div className="pt-2 border-t">
            <button 
              onClick={onViewAll}
              className="w-full text-center text-xs font-medium text-blue-600 hover:text-blue-800 py-1"
            >
              View {items.length - maxItems} more items
            </button>
          </div>
        )}
      </div>
    </MobileCard>
  )
}