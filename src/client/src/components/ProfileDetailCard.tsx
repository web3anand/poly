import React, { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

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
        const response = await fetch(`http://localhost:3001/api/profiles/${profile.proxyWallet}/stats`)
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

  return (
    <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-lg overflow-hidden font-sans max-w-6xl mx-auto">
      {/* Inline Profile Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Profile Avatar */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full shadow-lg overflow-hidden ring-2 ring-gray-700">
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
                        parent.innerHTML = `<span class="text-white font-bold text-3xl">${getInitials(getDisplayName())}</span>`;
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-bold text-3xl">{getInitials(getDisplayName())}</span>
                  </div>
                )}
              </div>
              {/* Online Status */}
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-400 rounded-full border-3 border-gray-800 shadow-md"></div>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">
                {getUsername()}
              </h1>
              <p className="text-sm text-gray-400 font-mono">
                {profile.proxyWallet ? `${profile.proxyWallet.slice(0, 8)}...${profile.proxyWallet.slice(-6)}` : 'No wallet'}
              </p>
              {profile.bio && (
                <p className="text-sm text-gray-300 mt-1 max-w-2xl line-clamp-1">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-green-500/10 text-green-400">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
            Active
          </div>
        </div>
      </div>

      {/* Trading Metrics - Redesigned */}
      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-700/50 rounded-xl p-4 animate-pulse h-24" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Metric Card Component */}
            {[
              { label: 'Win Rate', value: `${metrics.winRate.toFixed(1)}%`, color: 'text-white' },
              { label: 'Total Wins', value: metrics.totalWins, color: 'text-green-400' },
              { label: 'Total Losses', value: metrics.totalLosses, color: 'text-red-400' },
              { label: 'Total Volume', value: formatCurrency(metrics.totalVolume), color: 'text-white' },
              { label: 'Total Bets', value: formatLargeNumber(metrics.totalBets), color: 'text-white' },
              { label: 'Live Positions', value: formatLargeNumber(metrics.liveBets), color: 'text-white', pulse: metrics.liveBets > 0 },
              { label: 'Biggest Win', value: `+${formatCurrency(metrics.biggestWin || 0)}`, color: 'text-green-400', condition: metrics.biggestWin && metrics.biggestWin > 0 },
              { label: 'Predictions', value: formatLargeNumber(metrics.totalPredictions || 0), color: 'text-white', condition: metrics.totalPredictions && metrics.totalPredictions > 0 },
              { label: 'Position Value', value: formatCurrency(metrics.totalPositionValue || 0), color: 'text-blue-400', condition: metrics.totalPositionValue && metrics.totalPositionValue > 0 },
            ]
            .filter(item => item.condition !== false)
            .map(item => (
              <div key={item.label} className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50 transition-all hover:bg-gray-800/60 hover:border-gray-600">
                <div className="text-xs sm:text-sm text-gray-400">{item.label}</div>
                <div className={`mt-2 text-xl sm:text-2xl lg:text-3xl font-bold ${item.color} flex items-center`}>
                  {item.value}
                  {item.pulse && <span className="ml-2 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>}
                </div>
              </div>
            ))}

          </div>
        )}
      </div>

      {/* PNL Chart */}
      {!loading && (() => {
        // Use actual pnlHistory if available, otherwise create a simple visualization
        let chartData = metrics.pnlHistory && metrics.pnlHistory.length > 0 
          ? metrics.pnlHistory 
          : null;
        
        // If no history but we have profits data, create a simple 2-point chart
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

        return (
          <div className="px-4 sm:px-6 pb-4 relative">
            <div className="bg-[#0f1923] rounded-xl border border-gray-800/50 h-[250px] sm:h-[300px] w-full relative outline-none focus:outline-none focus-visible:outline-none">
              {/* Dynamic PNL Display - Always Visible */}
              <div className="absolute top-4 left-4 sm:left-6 z-10 pointer-events-none">
                <div className={`text-2xl sm:text-3xl font-bold ${displayData.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {displayData.pnl >= 0 ? '+' : ''}{formatCurrency(displayData.pnl)}
                </div>
                <div className="text-xs text-gray-400 mt-1">
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
                    'All-Time'
                  }
                </div>
              </div>

              <ResponsiveContainer width="100%" height="100%" className="outline-none focus:outline-none">
                <AreaChart 
                  data={chartData}
                  margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                  style={{ outline: 'none' }}
                  onMouseMove={(data: any) => {
                    console.log('Mouse move data:', data);
                    if (data && data.activePayload && data.activePayload.length > 0) {
                      console.log('Setting hovered data:', data.activePayload[0].payload);
                      setHoveredData(data.activePayload[0].payload);
                    }
                  }}
                  onMouseLeave={() => {
                    console.log('Mouse leave');
                    setHoveredData(null);
                  }}
                >
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={1}/>
                      <stop offset="50%" stopColor="#8b5cf6" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#ec4899" stopOpacity={1}/>
                    </linearGradient>
                    <linearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="timestamp" 
                    hide
                  />
                  <YAxis hide />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length > 0) {
                        setHoveredData(payload[0].payload);
                      }
                      return null;
                    }}
                    cursor={{ stroke: '#8b5cf6', strokeWidth: 1, strokeDasharray: '5 5' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="pnl" 
                    stroke="url(#colorGradient)"
                    fill="url(#fillGradient)"
                    strokeWidth={2}
                    dot={false}
                    animationDuration={1000}
                    animationEasing="ease-in-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })()}

      {/* Live Positions */}
      {!loading && metrics.livePositionValues && metrics.livePositionValues.length > 0 && (
        <div className="px-4 sm:px-6 py-5">
          <div className="bg-gray-900/50 rounded-lg p-4 sm:p-6 border border-gray-700/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-white">Live Positions</h3>
              <span className="text-sm text-gray-400">{metrics.livePositionValues.length} active</span>
            </div>
            
            <div className="space-y-3">
              {metrics.livePositionValues.slice(0, 5).map((position, index) => (
                <div key={index} className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-700/30">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm sm:text-base font-medium text-white truncate">
                        {position.title}
                      </h4>
                      <p className="text-xs text-gray-400 mt-1">
                        {position.outcome} • {position.size.toFixed(2)} tokens
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm sm:text-base font-semibold text-white">
                          {formatCurrency(position.currentValue)}
                        </div>
                        <div className={`text-xs ${
                          position.cashPnl >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {position.cashPnl >= 0 ? '+' : ''}{formatCurrency(position.cashPnl)}
                          ({position.percentPnl >= 0 ? '+' : ''}{position.percentPnl.toFixed(1)}%)
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xs text-gray-400">Avg Price</div>
                        <div className="text-sm text-white">
                          ${position.avgPrice.toFixed(2)}
                        </div>
                      </div>
                      
                      {position.redeemable && (
                        <div className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                          Redeemable
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {metrics.livePositionValues.length > 5 && (
                <div className="text-center text-sm text-gray-400 py-2">
                  +{metrics.livePositionValues.length - 5} more positions
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Account Info & Actions */}
      <div className="px-6 pb-5 border-t border-gray-700/50 pt-5">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
            <div className="text-sm text-gray-400 mb-2">Profile Settings</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Username Public</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  profile.displayUsernamePublic 
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-red-500/10 text-red-400'
                }`}>
                  {profile.displayUsernamePublic ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Wallet Status</span>
                <span className="flex items-center text-green-400 text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-1.5"></div>
                  Active
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
            <div className="text-sm text-gray-400 mb-2">Quick Actions</div>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all duration-200">
                View on Polymarket
              </button>
              <button className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm font-medium transition-all duration-200 border border-gray-600">
                Save Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}