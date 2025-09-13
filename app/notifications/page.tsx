'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { 
  Bell, 
  BellRing, 
  Check, 
  CheckCheck, 
  Trash2, 
  AlertCircle, 
  Clock, 
  Package, 
  FileText,
  Search,
  Filter,
  RotateCcw,
  Users,
  Calendar,
  Activity
} from 'lucide-react'
import { useNotifications } from '@/contexts/notification-context'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

export default function NotificationsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refreshNotifications
  } = useNotifications()

  // Filter notifications based on search and tab
  const filteredNotifications = notifications.filter((notification: any) => {
    const matchesSearch = searchQuery === '' || 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTab = activeTab === 'all' || 
      (activeTab === 'unread' && !notification.read_at) ||
      (activeTab === 'read' && notification.read_at)

    return matchesSearch && matchesTab
  })

  // Get priority styling
  const getPriorityDetails = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return {
          className: 'border-red-200 bg-red-50',
          iconClassName: 'text-red-600',
          badgeVariant: 'destructive' as const
        }
      case 'urgent':
        return {
          className: 'border-orange-200 bg-orange-50',
          iconClassName: 'text-orange-600',
          badgeVariant: 'secondary' as const
        }
      case 'high':
        return {
          className: 'border-blue-200 bg-blue-50',
          iconClassName: 'text-blue-600',
          badgeVariant: 'outline' as const
        }
      default:
        return {
          className: 'border-gray-200 bg-gray-50',
          iconClassName: 'text-gray-600',
          badgeVariant: 'outline' as const
        }
    }
  }

  const getTypeIcon = (type: string) => {
    if (type?.includes('stock') || type?.includes('inventory')) return Package
    if (type?.includes('prescription') || type?.includes('medical')) return FileText
    if (type?.includes('appointment') || type?.includes('schedule')) return Calendar
    if (type?.includes('patient') || type?.includes('user')) return Users
    if (type?.includes('expiring') || type?.includes('time')) return Clock
    if (type?.includes('system') || type?.includes('activity')) return Activity
    return Bell
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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">All Notifications</h1>
          <p className="text-muted-foreground">
            Manage all your system notifications and alerts
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshNotifications}
            disabled={isLoading}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <BellRing className="h-4 w-4 mr-2 text-blue-600" />
              Total Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Bell className="h-4 w-4 mr-2 text-orange-600" />
              Unread
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{unreadCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 text-red-600" />
              Critical
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {notifications.filter((n: any) => n.priority === 'critical').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Activity className="h-4 w-4 mr-2 text-green-600" />
              System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {notifications.filter((n: any) => n.category === 'system').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Notifications</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark All Read
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // For now, just show a message that this feature is coming soon
                  alert('Clear all functionality coming soon')
                }}
                disabled={notifications.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
              <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
              <TabsTrigger value="read">Read ({notifications.length - unreadCount})</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-6">
              
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading notifications...
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No notifications found matching your search.' : 'No notifications yet.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredNotifications.map((notification: any) => {
                    const { className, iconClassName, badgeVariant } = getPriorityDetails(notification.priority)
                    const Icon = getTypeIcon(notification.type)
                    
                    return (
                      <Card
                        key={notification.id}
                        className={cn(
                          'cursor-pointer transition-colors hover:bg-muted/50',
                          className,
                          !notification.read_at && 'ring-2 ring-blue-200'
                        )}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <Icon className={cn('h-5 w-5', iconClassName)} />
                              <div>
                                <CardTitle className="text-base font-medium">
                                  {notification.title}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {notification.message}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {!notification.read_at && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full" />
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  // For now, just show a message that this feature is coming soon
                                  alert('Delete notification functionality coming soon')
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              {format(new Date(notification.created_at || Date.now()), 'MMM d, yyyy h:mm a')}
                            </span>
                            
                            <div className="flex items-center space-x-2">
                              {notification.priority && (
                                <Badge variant={badgeVariant} className="text-xs">
                                  {notification.priority}
                                </Badge>
                              )}
                              
                              {notification.category && (
                                <Badge variant="outline" className="text-xs">
                                  {notification.category}
                                </Badge>
                              )}
                              
                              {!notification.read_at && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    markAsRead(notification.id)
                                  }}
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Mark Read
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}