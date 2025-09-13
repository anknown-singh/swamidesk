'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, BellRing, X, Check, CheckCheck, Trash2, AlertCircle, Clock, Package, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { usePharmacyNotifications } from '@/lib/hooks/use-pharmacy-notifications'
import { NotificationPriority, NotificationType } from '@/lib/notifications/notification-system'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface PharmacyNotificationCenterProps {
  pharmacistId?: string
  className?: string
}

export function PharmacyNotificationCenter({ 
  pharmacistId, 
  className 
}: PharmacyNotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  
  const {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refresh
  } = usePharmacyNotifications({
    pharmacistId,
    enableToasts: true,
    enableSound: true
  })

  // Get priority icon and styling
  const getPriorityDetails = (priority: NotificationPriority, type: NotificationType) => {
    switch (priority) {
      case NotificationPriority.CRITICAL:
        return {
          icon: AlertCircle,
          className: 'text-red-600 bg-red-50 border-red-200',
          iconClassName: 'text-red-600'
        }
      case NotificationPriority.URGENT:
        return {
          icon: AlertCircle,
          className: 'text-orange-600 bg-orange-50 border-orange-200',
          iconClassName: 'text-orange-600'
        }
      case NotificationPriority.HIGH:
        return {
          icon: getTypeIcon(type),
          className: 'text-blue-600 bg-blue-50 border-blue-200',
          iconClassName: 'text-blue-600'
        }
      default:
        return {
          icon: getTypeIcon(type),
          className: 'text-gray-600 bg-gray-50 border-gray-200',
          iconClassName: 'text-gray-600'
        }
    }
  }

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.MEDICATION_OUT_OF_STOCK:
        return Package
      case NotificationType.PRESCRIPTION_READY:
      case NotificationType.PRESCRIPTION_DISPENSED:
      case NotificationType.PRESCRIPTION_READY_FOR_PICKUP:
        return FileText
      case NotificationType.MEDICATION_EXPIRING:
        return Clock
      default:
        return Bell
    }
  }

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read_at) {
      await markAsRead(notification.id)
    }
    
    if (notification.action_url) {
      router.push(notification.action_url)
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn('relative', className)}
        >
          {unreadCount > 0 ? (
            <BellRing className="h-4 w-4" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          {!isConnected && (
            <div className="absolute -bottom-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Pharmacy Notifications</span>
          <div className="flex items-center space-x-2">
            {!isConnected && (
              <Badge variant="secondary" className="text-xs">
                Offline
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={refresh}
              disabled={isLoading}
            >
              Refresh
            </Button>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {error && (
          <div className="px-4 py-2 text-sm text-red-600 bg-red-50 border-b">
            {error}
          </div>
        )}
        
        {notifications.length > 0 && (
          <div className="px-4 py-2 border-b">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark All Read
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAll}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            </div>
          </div>
        )}
        
        <ScrollArea className="max-h-96">
          {isLoading ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => {
                const { icon: Icon, className, iconClassName } = getPriorityDetails(
                  notification.priority,
                  notification.type
                )
                
                return (
                  <Card
                    key={notification.id}
                    className={cn(
                      'mx-2 my-1 cursor-pointer transition-colors hover:bg-muted/50',
                      className,
                      !notification.read_at && 'ring-2 ring-blue-200'
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <Icon className={cn('h-4 w-4', iconClassName)} />
                          <CardTitle className="text-sm font-medium">
                            {notification.title}
                          </CardTitle>
                        </div>
                        <div className="flex items-center space-x-1">
                          {!notification.read_at && (
                            <div className="h-2 w-2 bg-blue-600 rounded-full" />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotification(notification.id)
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0 pb-3">
                      <p className="text-xs text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                        </span>
                        
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant="outline"
                            className="text-xs"
                          >
                            {notification.priority}
                          </Badge>
                          
                          {!notification.read_at && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 px-1 text-xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                markAsRead(notification.id)
                              }}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-4 py-2 text-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => {
                  setIsOpen(false)
                  router.push('/pharmacy/notifications')
                }}
              >
                View All Notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}