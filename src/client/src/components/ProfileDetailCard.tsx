import React, { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts'

interface ProfileDetailCardProps {
  profile: any
}

interface TradingMetrics {
  totalVolume: number
  totalBets: number
  liveBets: number
  profits: number
  realizedPnl?: number
  unrealizedPnl?: number
  biggestWin?: number
  totalPredictions?: number
  totalPositionValue?: number
  livePositionValues?: Array<{
    title: string
    currentValue: number
    cashPnl: number
    percentPnl: number
    size: number
    avgPrice: number
    curPrice: number
    outcome: string
    endDate: string
    redeemable: boolean
  }>
  winRate: number
  totalWins: number
  totalLosses: number
  pnlHistory?: Array<{
    timestamp: number
    pnl: number
    realizedPnl: number
    unrealizedPnl: number
  }>
}

export const ProfileDetailCard: React.FC<ProfileDetailCardProps> = ({ profile }) => {
  const [metrics, setMetrics] = useState<TradingMetrics>({
    totalVolume: 0,
    totalBets: 0,
    liveBets: 0,
    profits: 0,
    winRate: 0,
    totalWins: 0,
    totalLosses: 0,
    totalPositionValue: 0,
    livePositionValues: [],
    pnlHistory: []
  })
  const [loading, setLoading] = useState(true)
  const [hoveredData, setHoveredData] = useState<any>(null)
  const [sortBy, setSortBy] = useState<'date' | 'pnl' | 'size'>('pnl')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Fetch trading metrics for the profile
    const fetchMetrics = async () => {
      try {
        setLoading(true)
        
        if (!profile.proxyWallet) {
          console.log('⚠️ No wallet address available')
          setLoading(false)
          return
        }

        console.log(`📊 Fetching metrics for wallet: ${profile.proxyWallet}`)
        
        // Call the API endpoint to get trading stats
        const API_BASE = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001/api'
        const response = await fetch(`${API_BASE}/profiles/${profile.proxyWallet}/stats`)
        const result = await response.json()
        
        console.log(`✅ Metrics response:`, result)
        console.log(`📊 PNL History data:`, result.data?.pnlHistory)
        console.log(`📊 PNL History length:`, result.data?.pnlHistory?.length)
        
        if (result.success && result.data) {
          // Map API response to our metrics structure
          setMetrics({
            totalVolume: result.data.totalVolume || 0,
            totalBets: result.data.totalBets || 0,
            liveBets: result.data.liveBets || 0,
            profits: result.data.profits || 0,
            realizedPnl: result.data.realizedPnl || 0,
            unrealizedPnl: result.data.unrealizedPnl || 0,
            biggestWin: result.data.biggestWin || 0,
            totalPredictions: result.data.totalPredictions || 0,
            totalPositionValue: result.data.totalPositionValue || 0,
            livePositionValues: result.data.livePositionValues || [],
            winRate: result.data.winRate || 0,
            totalWins: result.data.totalWins || 0,
            totalLosses: result.data.totalLosses || 0,
            pnlHistory: result.data.pnlHistory || []
          })
          console.log(`📊 Metrics set - Total: $${result.data.profits}, Realized: $${result.data.realizedPnl}, Unrealized: $${result.data.unrealizedPnl}`)
          console.log(`📊 PNL History points:`, result.data.pnlHistory?.length || 0)
        } else {
          // If API doesn't have data, show zeros
          setMetrics({
            totalVolume: 0,
            totalBets: 0,
            liveBets: 0,
            profits: 0,
            winRate: 0,
            totalWins: 0,
            totalLosses: 0
          })
        }
        
        setLoading(false)
      } catch (error) {
        console.error('❌ Error fetching metrics:', error)
        // On error, show zeros
        setMetrics({
          totalVolume: 0,
          totalBets: 0,
          liveBets: 0,
          profits: 0,
          winRate: 0,
          totalWins: 0,
          totalLosses: 0
        })
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [profile])

  const formatCurrency = (value: number) => {
    if (value === null || value === undefined) return '$0.00'
    const sign = value < 0 ? '-' : ''
    const absValue = Math.abs(value)

    if (absValue >= 1_000_000) {
      return `${sign}$${(absValue / 1_000_000).toFixed(2)}M`
    }
    if (absValue >= 1_000) {
      return `${sign}$${(absValue / 1_000).toFixed(1)}K`
    }
    return `${sign}$${absValue.toFixed(2)}`
  }

  const formatLargeNumber = (num: number) => {
    if (num === null || num === undefined) return '0';
    if (Math.abs(num) >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(2)}M`
    }
    if (Math.abs(num) >= 1_000) {
      return `${(num / 1_000).toFixed(1)}K`
    }
    return num.toLocaleString();
  };

  const formatWalletAddress = (address: string) => {
    if (!address) return 'N/A'
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getInitials = (name: string) => {
    if (!name) return '?'
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2)
  }

  const getDisplayName = () => {
    return profile.pseudonym || profile.name || `User ${profile.id?.slice(0, 6)}` || 'Anonymous'
  }

  const getUsername = () => {
    return profile.name || profile.pseudonym || `user_${profile.id?.slice(0, 8)}` || 'anonymous'
  }

  const copyAddress = async () => {
    if (profile.proxyWallet) {
      try {
        await navigator.clipboard.writeText(profile.proxyWallet)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy address:', err)
      }
    }
  }

  // Sort positions based on selected criteria
  const getSortedPositions = () => {
    if (!metrics.livePositionValues || metrics.livePositionValues.length === 0) {
      return [];
    }

    const positions = [...metrics.livePositionValues];

    switch (sortBy) {
      case 'date':
        // Sort by end date (most recent first)
        return positions.sort((a, b) => {
          const dateA = new Date(a.endDate).getTime();
          const dateB = new Date(b.endDate).getTime();
          return dateB - dateA;
        });
      case 'pnl':
        // Sort by PnL (highest to lowest)
        return positions.sort((a, b) => b.cashPnl - a.cashPnl);
      case 'size':
        // Sort by position size (largest to smallest)
        return positions.sort((a, b) => b.currentValue - a.currentValue);
      default:
        return positions;
    }
  };

  return (
    <div className="bg-[#0a0e12] shadow-2xl overflow-hidden font-sans w-full rounded-lg border border-gray-700/30">
      {/* Compact Profile Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-700/50 bg-[#0f1419] backdrop-blur-sm">
        <div className="flex items-start space-x-3 sm:space-x-4">
          {/* Smaller Profile Avatar */}
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg overflow-hidden ring-2 ring-gray-700/50 flex-shrink-0">
            {profile.profileImage ? (
              <img 
                src={profile.profileImage} 
                alt={getDisplayName()}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.classList.add('bg-gradient-to-br', 'from-blue-500', 'to-purple-600', 'flex', 'items-center', 'justify-center');
                    parent.innerHTML = `<span class="text-white font-bold text-xl">${getInitials(getDisplayName())}</span>`;
                  }
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">{getInitials(getDisplayName())}</span>
              </div>
            )}
          </div>

          {/* Profile Info with Bio */}
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-white">
              {getUsername()}
            </h1>
            
            {/* Wallet Address - Clickable to Copy */}
            <button
              onClick={copyAddress}
              className="group flex items-center space-x-2 mt-1 text-xs font-mono text-gray-400 hover:text-gray-300 transition-colors"
              title="Click to copy address"
            >
              <span>
                {profile.proxyWallet ? `${profile.proxyWallet.slice(0, 8)}...${profile.proxyWallet.slice(-6)}` : 'No wallet'}
              </span>
              <svg 
                className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                {copied ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                )}
              </svg>
              {copied && <span className="text-green-400 text-xs">Copied!</span>}
            </button>

            {/* Bio */}
            {profile.bio && (
              <p className="text-xs sm:text-sm text-gray-400 mt-2 line-clamp-2">
                {profile.bio}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-800/50 rounded-lg"></div>
            <div className="h-96 bg-gray-800/50 rounded-lg"></div>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* PNL Chart - Full Width */}
            {(() => {
              let chartData = metrics.pnlHistory && metrics.pnlHistory.length > 0 
                ? metrics.pnlHistory
                : null;
                
                if (!chartData && metrics.totalBets > 0) {
                  const now = Date.now();
                  const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
                  chartData = [
                    { timestamp: thirtyDaysAgo, pnl: 0, realizedPnl: 0, unrealizedPnl: 0 },
                    { timestamp: now, pnl: metrics.profits, realizedPnl: metrics.profits, unrealizedPnl: 0 }
                  ];
                }
                
                if (!chartData || chartData.length === 0) {
                  return null;
                }

                const lastDataPoint = chartData[chartData.length - 1];
                const displayData = hoveredData || lastDataPoint;
                
                // Calculate min/max for Y-axis
                const pnlValues = chartData.map(d => d.pnl);
                const minPnl = Math.min(...pnlValues);
                const maxPnl = Math.max(...pnlValues);

              return (
                <div className="bg-[#0f1419] rounded-lg border border-gray-700/50 p-3 sm:p-4 h-[280px] sm:h-[380px] relative overflow-hidden">
                  {/* PNL Display with smooth transition */}
                  <div className="absolute top-4 sm:top-6 left-4 sm:left-6 z-10 pointer-events-none transition-all duration-300 ease-out">
                    <div className={`text-2xl sm:text-3xl font-bold transition-all duration-300 ease-out ${displayData.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {displayData.pnl >= 0 ? '+' : ''}{formatCurrency(displayData.pnl)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 transition-opacity duration-200">
                      {hoveredData ? 
                        (() => {
                          const date = new Date(displayData.timestamp);
                          if (isNaN(date.getTime()) || date > new Date()) {
                            return 'Recent';
                          }
                          return date.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          });
                        })() : 
                        'All-Time PnL'
                      }
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height="100%" className="outline-none">
                    <AreaChart 
                      data={chartData}
                      margin={{ top: 70, right: 10, left: 10, bottom: 10 }}
                      onMouseMove={(data: any) => {
                        if (data && data.activePayload && data.activePayload.length > 0) {
                          setHoveredData(data.activePayload[0].payload);
                        }
                      }}
                      onMouseLeave={() => setHoveredData(null)}
                    >
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={maxPnl >= 0 ? '#22c55e' : '#ef4444'} stopOpacity={0.4}/>
                          <stop offset="100%" stopColor={maxPnl >= 0 ? '#22c55e' : '#ef4444'} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="timestamp" hide />
                      <YAxis hide />
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" opacity={0.15} />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length > 0) {
                            setHoveredData(payload[0].payload);
                          } else {
                            setHoveredData(null);
                          }
                          return null;
                        }}
                        cursor={{ stroke: maxPnl >= 0 ? '#22c55e' : '#ef4444', strokeWidth: 2, strokeDasharray: '5 5' }}
                        animationDuration={150}
                        animationEasing="ease-out"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="pnl" 
                        stroke={maxPnl >= 0 ? '#22c55e' : '#ef4444'}
                        fill="url(#chartGradient)"
                        strokeWidth={2.5}
                        dot={false}
                        animationDuration={1000}
                        animationEasing="ease-in-out"
                        isAnimationActive={true}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              );
            })()}

            {/* Positions Table - Fixed Header with Scrollable Body */}
            {metrics.livePositionValues && metrics.livePositionValues.length > 0 && (
              <div className="bg-[#0f1419] rounded-lg border border-gray-700/50 overflow-hidden">
                {/* Fixed Header with Sort Options */}
                <div className="px-4 py-3 border-b border-gray-700/50 bg-[#0a0e12]">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">Asset Positions</h3>
                    
                    {/* Sort Options */}
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 mr-1 hidden sm:inline">Sort by:</span>
                      <button
                        onClick={() => setSortBy('pnl')}
                        className={`px-2 sm:px-3 py-1 text-xs font-medium rounded transition-all ${
                          sortBy === 'pnl'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                        }`}
                      >
                        PnL
                      </button>
                      <button
                        onClick={() => setSortBy('size')}
                        className={`px-2 sm:px-3 py-1 text-xs font-medium rounded transition-all ${
                          sortBy === 'size'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                        }`}
                      >
                        Size
                      </button>
                      <button
                        onClick={() => setSortBy('date')}
                        className={`px-2 sm:px-3 py-1 text-xs font-medium rounded transition-all ${
                          sortBy === 'date'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                        }`}
                      >
                        Date
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Scrollable Table Container */}
                <div className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm">
                      {/* Fixed Table Header */}
                      <thead className="bg-[#0a0e12] sticky top-0 z-10">
                        <tr className="border-b border-gray-700/50">
                          <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-xs font-medium text-gray-500 bg-[#0a0e12]">Asset</th>
                          <th className="text-right px-3 sm:px-4 py-2 sm:py-3 text-xs font-medium text-gray-500 bg-[#0a0e12]">Position Value</th>
                          <th className="text-right px-3 sm:px-4 py-2 sm:py-3 text-xs font-medium text-gray-500 bg-[#0a0e12]">Unrealized PnL</th>
                          <th className="text-right px-3 sm:px-4 py-2 sm:py-3 text-xs font-medium text-gray-500 bg-[#0a0e12] hidden sm:table-cell">Entry Price</th>
                          <th className="text-right px-3 sm:px-4 py-2 sm:py-3 text-xs font-medium text-gray-500 bg-[#0a0e12] hidden sm:table-cell">Current Price</th>
                        </tr>
                      </thead>
                    </table>
                  </div>
                  
                  {/* Scrollable Body - Max 5 Rows Visible */}
                  <div className="overflow-y-auto max-h-[400px] custom-scrollbar">
                    <table className="w-full text-xs sm:text-sm">
                      <tbody>
                        {getSortedPositions().map((position, index) => (
                          <tr 
                            key={index} 
                            className="border-b border-gray-800/30 hover:bg-gray-800/30 transition-colors"
                          >
                            <td className="px-3 sm:px-4 py-2 sm:py-3">
                              <div className="font-medium text-white truncate max-w-[200px] sm:max-w-xs">
                                {position.title}
                              </div>
                              <div className="text-xs text-gray-500">{position.outcome}</div>
                            </td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-right">
                              <div className="text-white font-medium">
                                {formatCurrency(position.currentValue)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {position.size.toFixed(2)} tokens
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-right">
                              <div className={`font-semibold ${
                                position.cashPnl >= 0 ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {position.cashPnl >= 0 ? '+' : ''}{formatCurrency(position.cashPnl)}
                              </div>
                              <div className={`text-xs ${
                                position.percentPnl >= 0 ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {position.percentPnl >= 0 ? '+' : ''}{position.percentPnl.toFixed(2)}%
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-right text-white hidden sm:table-cell">
                              ${position.avgPrice.toFixed(2)}
                            </td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-right text-white hidden sm:table-cell">
                              ${position.curPrice.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Stats Bar - Perfectly Aligned */}
      <div className="px-4 sm:px-6 py-4 border-t border-gray-700/50 bg-[#0f1419]">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-4 sm:gap-6">
          {/* Positions */}
          <div className="text-xs">
            <div className="text-gray-500 mb-1">Positions</div>
            <div className="text-white font-semibold">{metrics.liveBets} <span className="text-gray-500">({metrics.totalWins} win)</span></div>
          </div>
          
          {/* Total */}
          <div className="text-xs">
            <div className="text-gray-500 mb-1">Total</div>
            <div className="text-white font-semibold">{formatCurrency(metrics.totalPositionValue || 0)}</div>
          </div>
          
          {/* Total PnL */}
          <div className="text-xs">
            <div className="text-gray-500 mb-1">Total PnL</div>
            <div className={`font-semibold ${
              ((metrics.realizedPnl || 0) + (metrics.unrealizedPnl || 0)) >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {formatCurrency((metrics.realizedPnl || 0) + (metrics.unrealizedPnl || 0))}
            </div>
          </div>
          
          {/* Realized */}
          <div className="text-xs">
            <div className="text-gray-500 mb-1">Realized</div>
            <div className={`font-semibold ${(metrics.realizedPnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(metrics.realizedPnl || 0)}
            </div>
          </div>
          
          {/* Unrealized */}
          <div className="text-xs">
            <div className="text-gray-500 mb-1">Unrealized</div>
            <div className={`font-semibold ${
              (metrics.unrealizedPnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {formatCurrency(metrics.unrealizedPnl || 0)}
            </div>
          </div>
          
          {/* Volume */}
          <div className="text-xs">
            <div className="text-gray-500 mb-1">Volume</div>
            <div className="text-white font-semibold">{formatCurrency(metrics.totalVolume)}</div>
          </div>
          
          {/* Win Rate */}
          <div className="text-xs">
            <div className="text-gray-500 mb-1">Win Rate</div>
            <div className="text-green-400 font-semibold">{metrics.winRate.toFixed(1)}%</div>
          </div>
          
          {/* Biggest Win */}
          <div className="text-xs col-span-2 sm:col-span-1">
            <div className="text-gray-500 mb-1">Biggest Win</div>
            <div className="text-green-400 font-semibold">+{formatCurrency(metrics.biggestWin || 0)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}