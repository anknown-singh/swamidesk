'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Search,
  BookOpen,
  Play,
  Video,
  FileText,
  Star,
  Clock,
  Tag,
  ArrowRight,
  ExternalLink,
  Download,
  Eye,
  ThumbsUp,
  MessageCircle,
  Filter,
  Grid,
  List,
  X,
  Lightbulb,
  Target,
  Users,
  Award,
  HelpCircle,
  ChevronRight,
  TrendingUp
} from 'lucide-react'
import {
  helpSystem,
  type HelpContent,
  type Tour,
  HelpCategory,
  UserRole
} from '@/lib/help/help-system'
import { InteractiveTour, AvailableToursMenu } from './contextual-help'
import { OnboardingFlowComponent, OnboardingProgress } from './onboarding-flow'

interface HelpCenterProps {
  userId: string
  userRole: UserRole
  className?: string
  defaultCategory?: HelpCategory
  compact?: boolean
}

interface HelpState {
  searchQuery: string
  selectedCategory: HelpCategory | 'all' | 'recommended'
  selectedArticle: HelpContent | null
  viewMode: 'grid' | 'list'
  filterRole: UserRole | 'all'
  showFilters: boolean
  articles: HelpContent[]
  tours: Tour[]
  loading: boolean
}

export function HelpCenter({
  userId,
  userRole,
  className = '',
  defaultCategory = HelpCategory.GETTING_STARTED,
  compact = false
}: HelpCenterProps) {
  const [state, setState] = useState<HelpState>({
    searchQuery: '',
    selectedCategory: defaultCategory,
    selectedArticle: null,
    viewMode: 'grid',
    filterRole: 'all',
    showFilters: false,
    articles: [],
    tours: [],
    loading: false
  })

  const [userProgress, setUserProgress] = useState<any>(null)
  const [recommendations, setRecommendations] = useState<any>(null)

  useEffect(() => {
    loadHelpContent()
    loadUserProgress()
  }, [userRole, state.selectedCategory, state.searchQuery, state.filterRole])

  const loadHelpContent = () => {
    setState(prev => ({ ...prev, loading: true }))

    try {
      let articles: HelpContent[] = []
      let tours: Tour[] = []

      if (state.searchQuery) {
        // Search articles
        articles = helpSystem.searchHelpContent(
          state.searchQuery,
          state.filterRole === 'all' ? undefined : state.filterRole
        )
      } else if (state.selectedCategory === 'all') {
        // Get all articles
        articles = helpSystem.getHelpContent(
          undefined,
          state.filterRole === 'all' ? undefined : state.filterRole
        )
      } else if (state.selectedCategory === 'recommended') {
        // Get recommended content
        const recommended = helpSystem.getRecommendedContent(userId, userRole)
        articles = recommended.articles
        tours = recommended.tours
      } else {
        // Get category-specific articles
        articles = helpSystem.getHelpContent(
          state.selectedCategory as HelpCategory,
          state.filterRole === 'all' ? undefined : state.filterRole
        )
      }

      if (!state.searchQuery && state.selectedCategory !== 'recommended') {
        tours = helpSystem.getTours(userRole)
      }

      setState(prev => ({
        ...prev,
        articles,
        tours,
        loading: false
      }))
    } catch (error) {
      console.error('Failed to load help content:', error)
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  const loadUserProgress = () => {
    const progress = helpSystem.getUserProgress(userId)
    const recommended = helpSystem.getRecommendedContent(userId, userRole)
    
    setUserProgress(progress)
    setRecommendations(recommended)
  }

  const handleArticleClick = (article: HelpContent) => {
    setState(prev => ({ ...prev, selectedArticle: article }))
    
    // Track article view
    helpSystem.trackProgress(userId, 'view_article', article.id)
    loadUserProgress() // Refresh progress
  }

  const handleCategoryChange = (category: string) => {
    setState(prev => ({
      ...prev,
      selectedCategory: category as HelpCategory | 'all' | 'recommended',
      searchQuery: ''
    }))
  }

  const handleSearch = (query: string) => {
    setState(prev => ({
      ...prev,
      searchQuery: query,
      selectedCategory: 'all'
    }))
  }

  const formatCategory = (category: string) => {
    return category
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
  }

  const getCategoryIcon = (category: HelpCategory | string) => {
    switch (category) {
      case HelpCategory.GETTING_STARTED:
        return <Star className="h-4 w-4" />
      case HelpCategory.PATIENT_MANAGEMENT:
        return <Users className="h-4 w-4" />
      case HelpCategory.APPOINTMENTS:
        return <Clock className="h-4 w-4" />
      case HelpCategory.MEDICAL_RECORDS:
        return <FileText className="h-4 w-4" />
      case HelpCategory.PHARMACY:
        return <Target className="h-4 w-4" />
      case HelpCategory.BILLING:
        return <Award className="h-4 w-4" />
      case HelpCategory.REPORTS:
        return <TrendingUp className="h-4 w-4" />
      case HelpCategory.SETTINGS:
        return <BookOpen className="h-4 w-4" />
      case HelpCategory.TROUBLESHOOTING:
        return <HelpCircle className="h-4 w-4" />
      case HelpCategory.SECURITY:
        return <Badge className="h-4 w-4" />
      default:
        return <BookOpen className="h-4 w-4" />
    }
  }

  const getArticlesByCategory = () => {
    const categories = Object.values(HelpCategory)
    const articlesByCategory: Record<string, HelpContent[]> = {}

    categories.forEach(category => {
      articlesByCategory[category] = state.articles.filter(article => article.category === category)
    })

    return articlesByCategory
  }

  const getPopularArticles = () => {
    return state.articles
      .filter(article => article.priority === 'high')
      .slice(0, 6)
  }

  const renderArticleCard = (article: HelpContent) => (
    <Card 
      key={article.id}
      className="hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => handleArticleClick(article)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base group-hover:text-blue-600 transition-colors">
              {article.title}
            </CardTitle>
            <CardDescription className="text-sm mt-1 line-clamp-2">
              {article.description}
            </CardDescription>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors ml-2" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            {getCategoryIcon(article.category)}
            <span>{formatCategory(article.category)}</span>
          </div>
          
          {article.priority === 'high' && (
            <Badge variant="secondary" className="h-4 text-xs">
              Popular
            </Badge>
          )}

          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>5 min read</span>
          </div>
        </div>

        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {article.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs h-4 px-1">
                {tag}
              </Badge>
            ))}
            {article.tags.length > 3 && (
              <span className="text-xs text-gray-500">+{article.tags.length - 3} more</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )

  const renderArticleList = (article: HelpContent) => (
    <div
      key={article.id}
      className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer group border-b border-gray-100"
      onClick={() => handleArticleClick(article)}
    >
      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
        {getCategoryIcon(article.category)}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium group-hover:text-blue-600 transition-colors truncate">
            {article.title}
          </h3>
          {article.priority === 'high' && (
            <Star className="h-3 w-3 text-yellow-500" />
          )}
        </div>
        <p className="text-sm text-gray-600 line-clamp-1">{article.description}</p>
        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
          <span>{formatCategory(article.category)}</span>
          <span>•</span>
          <span>5 min read</span>
          {article.tags.length > 0 && (
            <>
              <span>•</span>
              <span>{article.tags.slice(0, 2).join(', ')}</span>
            </>
          )}
        </div>
      </div>
      
      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
    </div>
  )

  if (compact) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Quick Help
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search help articles..."
              value={state.searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {getPopularArticles().slice(0, 3).map((article) => (
            <div
              key={article.id}
              className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
              onClick={() => handleArticleClick(article)}
            >
              {getCategoryIcon(article.category)}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{article.title}</div>
                <div className="text-xs text-gray-500 truncate">{article.description}</div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          ))}

          <Button variant="outline" className="w-full" onClick={() => handleCategoryChange('all')}>
            View All Help
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className={`space-y-6 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Help Center</h1>
            <p className="text-gray-600">Find answers, tutorials, and guidance</p>
          </div>
          
          {userProgress && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Award className="h-3 w-3" />
              Progress: {userProgress.progressScore}%
            </Badge>
          )}
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search help articles and tutorials..."
              value={state.searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setState(prev => ({ ...prev, showFilters: !prev.showFilters }))}
            >
              <Filter className="h-4 w-4 mr-1" />
              Filters
            </Button>
            
            <div className="flex border rounded">
              <Button
                variant={state.viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setState(prev => ({ ...prev, viewMode: 'grid' }))}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={state.viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setState(prev => ({ ...prev, viewMode: 'list' }))}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        {state.showFilters && (
          <Card className="p-4">
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Role:</span>
                <select
                  value={state.filterRole}
                  onChange={(e) => setState(prev => ({ ...prev, filterRole: e.target.value as UserRole | 'all' }))}
                  className="px-2 py-1 border rounded text-sm"
                >
                  <option value="all">All Roles</option>
                  {Object.values(UserRole).map(role => (
                    <option key={role} value={role}>
                      {formatCategory(role)}
                    </option>
                  ))}
                </select>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setState(prev => ({ 
                  ...prev, 
                  filterRole: 'all',
                  searchQuery: '',
                  selectedCategory: 'all'
                }))}
              >
                Clear Filters
              </Button>
            </div>
          </Card>
        )}

        {/* Onboarding Progress */}
        {recommendations?.onboarding && (
          <OnboardingProgress
            userId={userId}
            userRole={userRole}
          />
        )}

        {/* Main Content Tabs */}
        <Tabs value={state.selectedCategory} onValueChange={handleCategoryChange}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="recommended">Recommended</TabsTrigger>
            <TabsTrigger value="all">All Articles</TabsTrigger>
            <TabsTrigger value={HelpCategory.GETTING_STARTED}>Getting Started</TabsTrigger>
            <TabsTrigger value={HelpCategory.PATIENT_MANAGEMENT}>Patients</TabsTrigger>
            <TabsTrigger value={HelpCategory.TROUBLESHOOTING}>Troubleshooting</TabsTrigger>
          </TabsList>

          {/* Recommended Tab */}
          <TabsContent value="recommended" className="space-y-6">
            {recommendations?.onboarding && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-500" />
                    Complete Your Setup
                  </CardTitle>
                  <CardDescription>
                    Finish onboarding to unlock all features
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <OnboardingFlowComponent
                    userId={userId}
                    userRole={userRole}
                    onComplete={loadUserProgress}
                  />
                </CardContent>
              </Card>
            )}

            {state.tours.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5 text-green-500" />
                    Interactive Tours
                  </CardTitle>
                  <CardDescription>
                    Learn by doing with guided tours
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AvailableToursMenu
                    userId={userId}
                    userRole={userRole}
                    className="space-y-3"
                  />
                </CardContent>
              </Card>
            )}

            {state.articles.length > 0 && (
              <div>
                <h3 className="font-semibold mb-4">Recommended Articles</h3>
                <div className={state.viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-2"}>
                  {state.articles.map(article => 
                    state.viewMode === 'grid' 
                      ? renderArticleCard(article)
                      : renderArticleList(article)
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* All Articles Tab */}
          <TabsContent value="all" className="space-y-6">
            {state.searchQuery && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Search results for "{state.searchQuery}"</span>
                <Badge variant="secondary">{state.articles.length} results</Badge>
              </div>
            )}

            <div className={state.viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "bg-white rounded-lg border"}>
              {state.articles.map(article => 
                state.viewMode === 'grid' 
                  ? renderArticleCard(article)
                  : renderArticleList(article)
              )}
            </div>

            {state.articles.length === 0 && !state.loading && (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No articles found</h3>
                <p className="text-gray-500">
                  {state.searchQuery 
                    ? 'Try adjusting your search terms'
                    : 'No articles available for the selected filters'
                  }
                </p>
              </div>
            )}
          </TabsContent>

          {/* Category Tabs */}
          {[HelpCategory.GETTING_STARTED, HelpCategory.PATIENT_MANAGEMENT, HelpCategory.TROUBLESHOOTING].map(category => (
            <TabsContent key={category} value={category} className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                {getCategoryIcon(category)}
                <div>
                  <h3 className="font-semibold text-lg">{formatCategory(category)}</h3>
                  <p className="text-sm text-gray-600">
                    {category === HelpCategory.GETTING_STARTED && 'Essential guides to get you started'}
                    {category === HelpCategory.PATIENT_MANAGEMENT && 'Everything about managing patient records'}
                    {category === HelpCategory.TROUBLESHOOTING && 'Solutions to common problems'}
                  </p>
                </div>
              </div>

              <div className={state.viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-2"}>
                {state.articles
                  .filter(article => article.category === category)
                  .map(article => 
                    state.viewMode === 'grid' 
                      ? renderArticleCard(article)
                      : renderArticleList(article)
                  )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Article Detail Modal */}
      {state.selectedArticle && (
        <Dialog 
          open={!!state.selectedArticle} 
          onOpenChange={(open) => !open && setState(prev => ({ ...prev, selectedArticle: null }))}
        >
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl">{state.selectedArticle.title}</DialogTitle>
                <div className="flex items-center gap-2">
                  {state.selectedArticle.attachments && (
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Resources
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setState(prev => ({ ...prev, selectedArticle: null }))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>
            
            <ScrollArea className="h-96 pr-4">
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-gray-600 pb-4 border-b">
                  <div className="flex items-center gap-1">
                    {getCategoryIcon(state.selectedArticle.category)}
                    <span>{formatCategory(state.selectedArticle.category)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>5 min read</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>Updated {new Date(state.selectedArticle.lastUpdated).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="prose prose-sm max-w-none">
                  <div dangerouslySetInnerHTML={{ 
                    __html: state.selectedArticle.content
                      .replace(/\n/g, '<br />')
                      .replace(/##\s*(.+)/g, '<h3>$1</h3>')
                      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.+?)\*/g, '<em>$1</em>')
                  }} />
                </div>

                {state.selectedArticle.attachments && state.selectedArticle.attachments.length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-3">Resources</h4>
                    <div className="space-y-2">
                      {state.selectedArticle.attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                          {attachment.type === 'video' && <Video className="h-4 w-4 text-blue-500" />}
                          {attachment.type === 'pdf' && <FileText className="h-4 w-4 text-red-500" />}
                          {attachment.type === 'link' && <ExternalLink className="h-4 w-4 text-green-500" />}
                          
                          <div className="flex-1">
                            <div className="font-medium text-sm">{attachment.name}</div>
                            {attachment.description && (
                              <div className="text-xs text-gray-600">{attachment.description}</div>
                            )}
                          </div>
                          
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {state.selectedArticle.relatedTopics && state.selectedArticle.relatedTopics.length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-3">Related Topics</h4>
                    <div className="flex flex-wrap gap-2">
                      {state.selectedArticle.relatedTopics.map((topicId) => {
                        const relatedArticle = helpSystem.getHelpArticle(topicId)
                        if (!relatedArticle) return null
                        
                        return (
                          <Button
                            key={topicId}
                            variant="outline"
                            size="sm"
                            onClick={() => setState(prev => ({ ...prev, selectedArticle: relatedArticle }))}
                          >
                            {relatedArticle.title}
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}