import React from 'react'

interface FeaturedMarketsProps {
  markets: any[]
}

export const FeaturedMarkets: React.FC<FeaturedMarketsProps> = ({ markets }) => {
  if (!markets || markets.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No featured markets</h3>
        <p className="text-gray-500 dark:text-gray-400">Check back later for new featured markets</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {markets.map((market) => (
        <FeaturedMarketCard key={market.id} market={market} />
      ))}
    </div>
  )
}

const FeaturedMarketCard: React.FC<{ market: any }> = ({ market }) => {
  const formatPrice = (price: number) => {
    return `${(price * 100).toFixed(1)}%`
  }

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `$${(volume / 1000000).toFixed(1)}M`
    } else if (volume >= 1000) {
      return `$${(volume / 1000).toFixed(1)}K`
    } else {
      return `$${volume.toFixed(0)}`
    }
  }

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'politics': 'from-red-500 to-pink-500',
      'crypto': 'from-yellow-500 to-orange-500',
      'sports': 'from-green-500 to-emerald-500',
      'economics': 'from-blue-500 to-cyan-500',
      'entertainment': 'from-purple-500 to-violet-500',
      'technology': 'from-indigo-500 to-blue-500',
      'default': 'from-gray-500 to-slate-500'
    }
    return colors[category?.toLowerCase()] || colors.default
  }

  const getStatusColor = (active: boolean, closed: boolean) => {
    if (closed) return 'bg-gray-500'
    if (active) return 'bg-green-500'
    return 'bg-yellow-500'
  }

  const getStatusText = (active: boolean, closed: boolean) => {
    if (closed) return 'Closed'
    if (active) return 'Live'
    return 'Pending'
  }

  return (
    <div className="group bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 hover:shadow-3xl hover:scale-105 transition-all duration-300 cursor-pointer">
      {/* Header with image */}
      <div className="relative mb-6">
        {market.image && (
          <div className="w-full h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-4 overflow-hidden">
            <img 
              src={market.image} 
              alt={market.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        )}
        
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(market.active, market.closed)} animate-pulse`}></div>
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                {getStatusText(market.active, market.closed)}
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 line-clamp-2">
              {market.title}
            </h3>
            {market.subtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                {market.subtitle}
              </p>
            )}
          </div>
          
          {market.featured && (
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
              ⭐ Featured
            </div>
          )}
        </div>
      </div>

      {/* Category */}
      {market.category && (
        <div className="mb-4">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getCategoryColor(market.category)} text-white shadow-lg`}>
            {market.category}
          </div>
        </div>
      )}

      {/* Market Info */}
      <div className="space-y-3 mb-6">
        {market.markets && market.markets.length > 0 && (
          <div className="space-y-2">
            {market.markets.slice(0, 2).map((m: any, index: number) => (
              <div key={index} className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl p-4 border border-gray-200/50 dark:border-gray-600/50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">
                    {m.question}
                  </h4>
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full">
                    {m.marketType}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatPrice(m.lastPriceNum || 0)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Last Price
                      </div>
                    </div>
                    <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatVolume(m.volumeNum || 0)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Volume
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {formatVolume(market.volume || 0)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Volume
          </div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {formatVolume(market.liquidity || 0)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Liquidity
          </div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {market.commentCount || 0}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Comments
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            {market.endDate ? new Date(market.endDate).toLocaleDateString() : 'No end date'}
          </span>
          <div className="flex items-center space-x-2">
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <span>Polymarket</span>
          </div>
        </div>
      </div>
    </div>
  )
}
