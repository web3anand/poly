import React, { useState, useEffect } from 'react'

interface SearchBarProps {
  onSearchResults: (results: any[], searchTerm: string) => void
  onSearching: (searching: boolean) => void
  onClearSearch: () => void
}

const API_BASE = 'http://localhost:3001/api'

export const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearchResults, 
  onSearching, 
  onClearSearch 
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [hasPerformedSearch, setHasPerformedSearch] = useState(false)

  // Debounced search for suggestions
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim() && searchTerm.trim().length >= 2) {
        fetchSuggestions(searchTerm)
      } else if (searchTerm.trim().length === 0) {
        // Only clear if search term is completely empty AND we've performed a search
        setSuggestions([])
        setShowSuggestions(false)
        if (hasPerformedSearch) {
          onClearSearch()
          setHasPerformedSearch(false)
        }
      } else {
        // Less than 2 characters, just hide suggestions but don't clear search results
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 300) // Faster debounce for suggestions

    return () => clearTimeout(timeoutId)
  }, [searchTerm, hasPerformedSearch])

  const fetchSuggestions = async (query: string) => {
    try {
      setIsSearching(true)
      onSearching(true)

      console.log(`🔍 Fetching suggestions for: "${query}"`)
      
      const response = await fetch(`${API_BASE}/profiles/search?q=${encodeURIComponent(query)}&limit=10`)
      const data = await response.json()

      if (data.success) {
        // Extract usernames from profiles for suggestions
        const usernames = data.data?.map((profile: any) => 
          profile.name || profile.pseudonym || profile.display_name || 'Unknown'
        ).filter((name: string) => name !== 'Unknown') || []
        
        console.log(`✅ Found ${usernames.length} username suggestions`)
        setSuggestions(usernames)
        setShowSuggestions(true)
        
        // Don't trigger onSearchResults here - only show suggestions
      } else {
        console.error('Suggestions failed:', data.error)
        setSuggestions([])
        setShowSuggestions(false)
      }
    } catch (error) {
      console.error('Suggestions error:', error)
      setSuggestions([])
      setShowSuggestions(false)
    } finally {
      setIsSearching(false)
      onSearching(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion)
    setShowSuggestions(false)
    performFullSearch(suggestion)
  }

  const performFullSearch = async (query: string) => {
    try {
      setIsSearching(true)
      onSearching(true)

      console.log(`🔍 Performing full search for: "${query}"`)
      
      const response = await fetch(`${API_BASE}/profiles/search?q=${encodeURIComponent(query)}&limit=20`)
      const data = await response.json()

          if (data.success) {
            console.log(`✅ Found ${data.data?.length || 0} profiles`)
            onSearchResults(data.data || [], query)
            setHasPerformedSearch(true)
          } else {
            console.error('Search failed:', data.error)
            onSearchResults([], query)
            setHasPerformedSearch(true)
          }
    } catch (error) {
      console.error('Search error:', error)
      onSearchResults([], query)
      setHasPerformedSearch(true)
    } finally {
      setIsSearching(false)
      onSearching(false)
    }
  }

  const handleClear = () => {
    setSearchTerm('')
    setSuggestions([])
    setShowSuggestions(false)
    setHasPerformedSearch(false)
    onClearSearch()
  }

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true)
    }
  }

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      setShowSuggestions(false)
    }, 200)
  }

  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <input
          type="text"
          placeholder="Search traders by username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          className="w-full pl-11 pr-28 py-3 text-sm bg-gray-800 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-500"
        />
        
        {isSearching && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        )}
        
        {searchTerm && !isSearching && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 space-x-1">
            <button
              onClick={() => performFullSearch(searchTerm)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-colors duration-200"
            >
              Search
            </button>
            <button
              onClick={handleClear}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
            >
              <svg className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
      
      {/* Username Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden z-50">
          <div className="max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors duration-200 border-b border-gray-700 last:border-b-0"
              >
                <div className="text-sm font-medium text-white">
                  {suggestion}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* No suggestions message */}
      {searchTerm.length > 0 && searchTerm.length < 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-3">
          <p className="text-xs text-gray-400 text-center">
            Type at least 2 characters to see suggestions
          </p>
        </div>
      )}
    </div>
  )
}
