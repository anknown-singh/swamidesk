'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/components/ui/command'
import {
  Search,
  X,
  User,
  Calendar,
  Pill,
  FileText,
  CreditCard,
  Settings,
  ArrowRight,
  History,
  TrendingUp,
  Sparkles,
  Loader2,
  Command as CommandIcon
} from 'lucide-react'
import { useQuickSearch } from '@/hooks/use-search'
import type { SearchResult, SearchSuggestion } from '@/lib/search/search-engine'

interface QuickSearchProps {
  className?: string
  placeholder?: string
  trigger?: 'button' | 'input' | 'both'
  showShortcut?: boolean
  onResultSelect?: (result: SearchResult) => void
}

export function QuickSearch({ 
  className = '',
  placeholder = "Search anything...",
  trigger = 'both',
  showShortcut = true,
  onResultSelect
}: QuickSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const {
    query,
    results,
    suggestions,
    loading,
    error,
    searchHistory,
    setQuery,
    selectResult,
    clearResults
  } = useQuickSearch()

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowDialog(true)
      }
      
      if (e.key === 'Escape') {
        setIsOpen(false)
        setShowDialog(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Focus input when dialog opens
  useEffect(() => {
    if (showDialog && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [showDialog])

  const handleResultClick = (result: SearchResult) => {
    selectResult(result)
    onResultSelect?.(result)
    setIsOpen(false)
    setShowDialog(false)
    clearResults()
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text)
    setIsOpen(false)
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'patient':
        return <User className="h-4 w-4 text-blue-500" />
      case 'appointment':
        return <Calendar className="h-4 w-4 text-green-500" />
      case 'medicine':
        return <Pill className="h-4 w-4 text-purple-500" />
      case 'service':
        return <Settings className="h-4 w-4 text-orange-500" />
      case 'invoice':
        return <CreditCard className="h-4 w-4 text-red-500" />
      case 'user':
        return <User className="h-4 w-4 text-gray-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'recent':
        return <History className="h-3 w-3 text-gray-400" />
      case 'popular':
        return <TrendingUp className="h-3 w-3 text-blue-400" />
      case 'suggestion':
        return <Sparkles className="h-3 w-3 text-purple-400" />
      default:
        return <Search className="h-3 w-3 text-gray-400" />
    }
  }

  const formatResultType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  // Compact search for header/navbar
  const CompactSearch = () => (
    <div className={`relative ${className}`}>
      {trigger === 'button' || trigger === 'both' ? (
        <Button
          variant="outline"
          className="w-64 justify-start text-muted-foreground"
          onClick={() => setShowDialog(true)}
        >
          <Search className="mr-2 h-4 w-4" />
          {placeholder}
          {showShortcut && (
            <div className="ml-auto flex items-center gap-1">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <CommandIcon className="h-3 w-3" />
                K
              </kbd>
            </div>
          )}
        </Button>
      ) : null}

      {trigger === 'input' || trigger === 'both' ? (
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            className="pl-10 pr-10 w-64"
          />
          
          {loading && (
            <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
          )}
          
          {query && !loading && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-8 w-8 p-0"
              onClick={() => {
                setQuery('')
                setIsOpen(false)
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : null}

      {/* Dropdown Results */}
      {isOpen && (query || suggestions.length > 0 || searchHistory.length > 0) && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-96 overflow-hidden shadow-lg">
          <ScrollArea className="max-h-96">
            <div className="p-2">
              {/* Recent Searches */}
              {!query && searchHistory.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-gray-500 mb-2 px-2">Recent Searches</p>
                  {searchHistory.slice(0, 3).map((historyItem) => (
                    <button
                      key={historyItem}
                      onClick={() => setQuery(historyItem)}
                      className="w-full flex items-center gap-3 p-2 text-sm hover:bg-gray-50 rounded"
                    >
                      <History className="h-3 w-3 text-gray-400" />
                      <span>{historyItem}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Suggestions */}
              {suggestions.length > 0 && !query && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-gray-500 mb-2 px-2">Suggestions</p>
                  {suggestions.slice(0, 3).map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full flex items-center gap-3 p-2 text-sm hover:bg-gray-50 rounded"
                    >
                      {getSuggestionIcon(suggestion.type)}
                      <span>{suggestion.text}</span>
                      {suggestion.count && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {suggestion.count}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Results */}
              {results.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2 px-2">
                    Results ({results.length})
                  </p>
                  {results.slice(0, 6).map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className="w-full flex items-start gap-3 p-2 text-sm hover:bg-gray-50 rounded text-left"
                    >
                      {getResultIcon(result.type)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{result.title}</p>
                        <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          {formatResultType(result.type)}
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                      </div>
                    </button>
                  ))}
                  
                  <div className="p-2 text-center border-t mt-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => setShowDialog(true)}
                    >
                      View all results
                    </Button>
                  </div>
                </div>
              )}

              {/* No results */}
              {query && results.length === 0 && !loading && (
                <div className="p-4 text-center text-sm text-gray-500">
                  No results found for "{query}"
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div className="p-4 text-center">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  <p className="text-sm text-gray-500 mt-2">Searching...</p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="p-4 text-center text-sm text-red-600">
                  {error}
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>
      )}
    </div>
  )

  // Full screen search dialog
  const SearchDialog = () => (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="sr-only">Search</DialogTitle>
        </DialogHeader>
        
        <Command className="rounded-none border-none">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 text-gray-500" />
            <CommandInput
              ref={inputRef}
              placeholder={placeholder}
              value={query}
              onValueChange={setQuery}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-none focus:ring-0"
            />
            {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
          </div>
          
          <CommandList className="max-h-80">
            <CommandEmpty className="py-6 text-center text-sm">
              {query ? `No results found for "${query}"` : 'Start typing to search...'}
            </CommandEmpty>

            {/* Recent Searches Group */}
            {!query && searchHistory.length > 0 && (
              <CommandGroup heading="Recent Searches">
                {searchHistory.slice(0, 5).map((historyItem) => (
                  <CommandItem
                    key={historyItem}
                    value={historyItem}
                    onSelect={() => setQuery(historyItem)}
                    className="flex items-center gap-3"
                  >
                    <History className="h-4 w-4 text-gray-400" />
                    <span>{historyItem}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Suggestions Group */}
            {suggestions.length > 0 && (
              <CommandGroup heading="Suggestions">
                {suggestions.slice(0, 5).map((suggestion) => (
                  <CommandItem
                    key={suggestion.id}
                    value={suggestion.text}
                    onSelect={() => handleSuggestionClick(suggestion)}
                    className="flex items-center gap-3"
                  >
                    {getSuggestionIcon(suggestion.type)}
                    <span>{suggestion.text}</span>
                    {suggestion.count && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {suggestion.count}
                      </Badge>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Results Groups by Type */}
            {results.length > 0 && (
              <>
                {/* Group results by type */}
                {['patient', 'appointment', 'medicine', 'service', 'invoice', 'user'].map(type => {
                  const typeResults = results.filter(r => r.type === type)
                  if (typeResults.length === 0) return null

                  return (
                    <CommandGroup key={type} heading={`${formatResultType(type)}s`}>
                      {typeResults.slice(0, 3).map((result) => (
                        <CommandItem
                          key={result.id}
                          value={result.title}
                          onSelect={() => handleResultClick(result)}
                          className="flex items-start gap-3 py-2"
                        >
                          {getResultIcon(result.type)}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{result.title}</div>
                            <div className="text-xs text-gray-500 truncate">{result.subtitle}</div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-400 mt-0.5" />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )
                })}
              </>
            )}
          </CommandList>

          {/* Footer */}
          <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <kbd className="h-5 w-5 rounded border bg-gray-100 flex items-center justify-center font-mono text-xs">↑</kbd>
                <kbd className="h-5 w-5 rounded border bg-gray-100 flex items-center justify-center font-mono text-xs">↓</kbd>
                <span>to navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="h-5 w-5 rounded border bg-gray-100 flex items-center justify-center font-mono text-xs">↵</kbd>
                <span>to select</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="h-5 w-5 rounded border bg-gray-100 flex items-center justify-center font-mono text-xs">esc</kbd>
                <span>to close</span>
              </div>
            </div>
            
            {results.length > 0 && (
              <span>{results.length} results found</span>
            )}
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  )

  return (
    <>
      <CompactSearch />
      <SearchDialog />
    </>
  )
}

// Export variants for different use cases
export function HeaderSearch(props: Omit<QuickSearchProps, 'trigger'>) {
  return <QuickSearch {...props} trigger="button" />
}

export function NavbarSearch(props: Omit<QuickSearchProps, 'trigger'>) {
  return <QuickSearch {...props} trigger="input" />
}

export function GlobalSearch(props: QuickSearchProps) {
  return <QuickSearch {...props} trigger="both" showShortcut={true} />
}