import React, { useState, useEffect } from 'react'
import { SearchBar } from './SearchBar'
import { ProfileDetailCard } from './ProfileDetailCard'

const API_BASE = 'http://localhost:3001/api'

export const Dashboard: React.FC = () => {
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<any>(null)

  // Debug: Track when selectedProfile changes
  useEffect(() => {
    console.log('🎯 Selected profile changed:', selectedProfile ? (selectedProfile.name || selectedProfile.pseudonym) : 'null')
    console.trace('Stack trace for profile change:')
  }, [selectedProfile])

  // Search handlers
  const handleSearchResults = (results: any[], searchTerm: string) => {
    console.log('📊 Dashboard received search results:', results.length, 'results for term:', searchTerm)
    console.log('🔍 Current selectedProfile:', selectedProfile ? (selectedProfile.name || selectedProfile.pseudonym) : 'null')
    
    // Don't process if we already have a selected profile with matching wallet
    if (selectedProfile && results.some(r => r.proxyWallet === selectedProfile.proxyWallet)) {
      console.log('⏭️ Profile already selected, skipping auto-select logic')
      return
    }
    
    setSearchResults(results)
    setShowSearchResults(true)
    
    // Auto-select profile logic
    if (results.length === 0) {
      console.log('❌ No results found - setting profile to null')
      setSelectedProfile(null)
    } else if (results.length === 1) {
      // If only one result, show it directly
      console.log('✅ Auto-selecting single result:', results[0].name || results[0].pseudonym)
      setSelectedProfile(results[0])
    } else {
      // If multiple results, look for exact match first
      const exactMatch = results.find(profile => 
        profile.name?.toLowerCase() === searchTerm.toLowerCase() ||
        profile.pseudonym?.toLowerCase() === searchTerm.toLowerCase()
      )
      
      if (exactMatch) {
        // Show exact match
        console.log('✅ Auto-selecting exact match:', exactMatch.name || exactMatch.pseudonym, 'wallet:', exactMatch.proxyWallet)
        setSelectedProfile(exactMatch)
      } else {
        // Show list of results
        console.log('📋 Showing', results.length, 'results to choose from - setting profile to null')
        setSelectedProfile(null)
      }
    }
  }

  const handleSearching = (searching: boolean) => {
    setIsSearching(searching)
  }

  const handleClearSearch = () => {
    console.log('🧹 handleClearSearch called - clearing all search state')
    setSearchResults([])
    setShowSearchResults(false)
    setSelectedProfile(null)
  }

  const handleProfileSelect = (profile: any) => {
    setSelectedProfile(profile)
    setShowSearchResults(true)
  }

  return (
    <div className="min-h-screen bg-[#0a0e12] text-gray-300 font-sans flex flex-col">
      {/* Professional Header */}
      <header className="border-b border-gray-800/50 bg-[#0f1419]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <h1 className="text-lg font-semibold text-white">
                Polymarket Trader Search
              </h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500 font-medium">Live</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Conditional rendering for welcome vs. results */}
          {!showSearchResults ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-900/50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                Search for Traders
              </h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Type a username below to find Polymarket traders and view their stats.
              </p>
              <div className="max-w-xl mx-auto">
                <SearchBar 
                  onSearchResults={handleSearchResults}
                  onSearching={handleSearching}
                  onClearSearch={handleClearSearch}
                />
              </div>
              <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 mt-4">
                <span>Try:</span>
                <span className="px-2 py-1 bg-gray-800/60 rounded-md">imdaybot</span>
                <span className="px-2 py-1 bg-gray-800/60 rounded-md">crypto</span>
                <span className="px-2 py-1 bg-gray-800/60 rounded-md">trader</span>
              </div>
            </div>
          ) : (
            <div>
              {/* Search bar is now part of the results view for refinement */}
              <div className="mb-8">
                <SearchBar 
                  onSearchResults={handleSearchResults}
                  onSearching={handleSearching}
                  onClearSearch={handleClearSearch}
                />
              </div>
              
              {selectedProfile ? (
                // Show detailed profile card - Full Width
                <div key={selectedProfile.proxyWallet || selectedProfile.id} className="w-full">
                  <div className="flex items-center justify-between mb-4 px-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-white">
                      Profile Details
                    </h2>
                    <button
                      onClick={() => setSelectedProfile(null)}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors duration-200 border border-gray-600/50"
                    >
                      Back to Results
                    </button>
                  </div>
                  <ProfileDetailCard key={selectedProfile.proxyWallet} profile={selectedProfile} />
                </div>
              ) : (
                // Show list of profiles
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-white">
                      Search Results
                    </h2>
                    {searchResults.length > 0 && (
                      <span className="px-3 py-1 bg-blue-900/50 text-blue-300 rounded-full text-sm font-medium border border-blue-700/50">
                        {searchResults.length} found
                      </span>
                    )}
                  </div>
                  
                  {searchResults.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {searchResults.map((profile) => (
                        <div
                          key={profile.id || profile.proxyWallet}
                          onClick={() => handleProfileSelect(profile)}
                          className="group bg-[#0f1419] rounded-xl border border-gray-800/50 p-4 hover:border-blue-500/50 hover:bg-[#141a20] transition-all duration-200 cursor-pointer shadow-lg"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-700 rounded-lg flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                              {(profile.pseudonym || profile.name || '?').charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-md font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                                {profile.name || profile.pseudonym || 'Unknown'}
                              </h3>
                              {profile.pseudonym && profile.name !== profile.pseudonym && (
                                <p className="text-xs text-gray-500 truncate">
                                  {profile.pseudonym}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-700/50">
                            <div className="flex items-center space-x-1.5">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span className="text-xs text-green-400 font-medium">Active</span>
                            </div>
                            <span className="text-xs text-gray-500 group-hover:text-blue-400 transition-colors">
                              View Profile →
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-gray-800/50 rounded-xl border border-gray-700/50">
                      <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-white mb-1">No traders found</h3>
                      <p className="text-sm text-gray-400">Try a different username or check for typos.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-gray-700/50 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-gray-500">
            Made by <span className="font-semibold text-gray-400">daybot</span> • Follow me on X: 
            <a 
              href="https://x.com/hashvalue" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="font-semibold text-blue-400 hover:text-blue-300 transition-colors"
            >
              @hashvalue
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}