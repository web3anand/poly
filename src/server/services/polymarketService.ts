import axios, { AxiosInstance } from 'axios';

export interface PolymarketEvent {
  id: string;
  ticker: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  resolutionSource: string;
  startDate: string;
  endDate: string;
  image: string;
  icon: string;
  active: boolean;
  closed: boolean;
  archived: boolean;
  new: boolean;
  featured: boolean;
  restricted: boolean;
  liquidity: number;
  volume: number;
  openInterest: number;
  category: string;
  subcategory: string;
  markets: PolymarketMarket[];
  tags: PolymarketTag[];
  volume24hr: number;
  volume1wk: number;
  volume1mo: number;
  volume1yr: number;
  commentCount: number;
  competitive: number;
}

export interface PolymarketMarket {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  resolutionSource: string;
  endDate: string;
  category: string;
  ammType: string;
  liquidity: string;
  startDate: string;
  denominationToken: string;
  fee: string;
  image: string;
  icon: string;
  description: string;
  outcomes: string;
  outcomePrices: string;
  volume: string;
  active: boolean;
  marketType: string;
  formatType: string;
  closed: boolean;
  new: boolean;
  featured: boolean;
  archived: boolean;
  restricted: boolean;
  volumeNum: number;
  liquidityNum: number;
  lastPrice: number;
  lastPriceNum: number;
  price: number;
  priceNum: number;
  yesAsk: number;
  yesBid: number;
  noAsk: number;
  noBid: number;
  yesLongAsk: number;
  yesLongBid: number;
  noLongAsk: number;
  noLongBid: number;
  yesShortAsk: number;
  yesShortBid: number;
  noShortAsk: number;
  noShortBid: number;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export interface PolymarketProfile {
    id: string;
    name: string;
  user: number;
  pseudonym: string;
  displayUsernamePublic: boolean;
  profileImage: string;
  bio: string;
  proxyWallet: string;
  walletActivated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PolymarketTag {
  id: string;
  label: string;
  slug: string;
  event_count: number;
}

export interface SearchResponse {
  events: PolymarketEvent[];
  tags: PolymarketTag[];
  profiles: PolymarketProfile[];
  pagination: {
    hasMore: boolean;
    totalResults: number;
  };
}

export class PolymarketService {
  private gammaApi: AxiosInstance;

  constructor() {
    this.gammaApi = axios.create({
      baseURL: 'https://gamma-api.polymarket.com',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Polymarket-Dashboard/1.0'
      }
    });
  }

  // Search markets, events, and profiles
  async search(query: string, options: {
    limitPerType?: number;
    searchProfiles?: boolean;
    searchTags?: boolean;
    eventsStatus?: string;
    eventsTag?: string[];
    sort?: string;
    ascending?: boolean;
    page?: number;
  } = {}): Promise<SearchResponse> {
    try {
      console.log(`🔍 Searching Polymarket for: "${query}"`);
      
      const params: any = {
        q: query,
        limit_per_type: options.limitPerType || 20,
        search_profiles: options.searchProfiles || true,
        search_tags: options.searchTags || true,
        optimized: true
      };

      if (options.eventsStatus) params.events_status = options.eventsStatus;
      if (options.eventsTag) params.events_tag = options.eventsTag;
      if (options.sort) params.sort = options.sort;
      if (options.ascending !== undefined) params.ascending = options.ascending;
      if (options.page) params.page = options.page;

      const response = await this.gammaApi.get('/public-search', { params });
      
      console.log(`✅ Found ${response.data.events?.length || 0} events, ${response.data.profiles?.length || 0} profiles`);
      
      return response.data;
    } catch (error) {
      console.error('❌ Error searching Polymarket:', error);
      throw error;
    }
  }

  // Get featured/trending markets
  async getFeaturedMarkets(limit = 20): Promise<PolymarketEvent[]> {
    try {
      console.log('📊 Fetching featured markets...');
      
      const response = await this.search('', {
        limitPerType: limit,
        searchProfiles: false,
        searchTags: false,
        eventsStatus: 'active',
        sort: 'volume',
        ascending: false
      });
      
      return response.events || [];
    } catch (error) {
      console.error('❌ Error fetching featured markets:', error);
      return [];
    }
  }

  // Get markets by category
  async getMarketsByCategory(category: string, limit = 20): Promise<PolymarketEvent[]> {
    try {
      console.log(`📊 Fetching markets for category: ${category}`);
      
      const response = await this.search(category, {
        limitPerType: limit,
        searchProfiles: false,
        searchTags: false,
        eventsStatus: 'active',
        sort: 'volume',
        ascending: false
      });
      
      return response.events || [];
    } catch (error) {
      console.error('❌ Error fetching markets by category:', error);
      return [];
    }
  }

  // Get user trading statistics using Polymarket Data API
  async getUserTradingStats(walletAddress: string): Promise<any> {
    try {
      console.log(`📊 Fetching trading stats for wallet: ${walletAddress}`);
      
      const dataApi = axios.create({
        baseURL: 'https://data-api.polymarket.com',
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Polymarket-Dashboard/1.0',
          'Accept': 'application/json'
        }
      });

      let subgraphPnlData = null;
      let pnlHistory = [];
      try {
        console.log(`🔍 Fetching PNL from Subgraph for wallet: ${walletAddress}`);
        const pnlQuery = `
          query GetUserPnl {
            user(id: "${walletAddress.toLowerCase()}") {
              id
              totalPnl
              realizedPnl
              unrealizedPnl
              totalVolume
              pnlHistories(first: 100, orderBy: timestamp, orderDirection: desc) {
                id
                timestamp
                pnl
                realizedPnl
                unrealizedPnl
              }
            }
          }
        `;
        const subgraphResponse = await axios.post(
          'https://api.goldsky.com/api/public/project_cl6mb8i9h0003e201j6li0diw/subgraphs/pnl-subgraph/0.0.14/gn',
          { query: pnlQuery },
          { headers: { 'Content-Type': 'application/json' } }
        );
        
        console.log(`✅ Subgraph response:`, JSON.stringify(subgraphResponse.data, null, 2));
        if (subgraphResponse.data.data && subgraphResponse.data.data.user) {
          subgraphPnlData = subgraphResponse.data.data.user;
          pnlHistory = subgraphResponse.data.data.user.pnlHistories || [];
          console.log(`✅ Found Subgraph PNL data for user with ${pnlHistory.length} history points.`);
        } else {
          console.log(`⚠️ No user data in Subgraph response.`);
        }
      } catch (subgraphError) {
        console.log(`⚠️ Subgraph PNL endpoint failed:`, subgraphError instanceof Error ? subgraphError.message : 'Unknown error');
      }

      // First, get positions to calculate real P&L
      let positionsData = null;
      try {
        console.log(`🔍 Fetching current positions from Data API for wallet: ${walletAddress}`);
        const positionsResponse = await dataApi.get('/positions', {
        params: {
            user: walletAddress,
            limit: 100
          }
        });
        
        console.log(`✅ Positions response:`, positionsResponse.data);
        positionsData = positionsResponse.data || [];
      } catch (positionsError) {
        console.log(`⚠️ Positions endpoint failed:`, positionsError instanceof Error ? positionsError.message : 'Unknown error');
      }

      // Then get closed positions for realized P&L
      let closedPositionsData = null;
      try {
        console.log(`🔍 Fetching closed positions from Data API for wallet: ${walletAddress}`);
        const closedResponse = await dataApi.get('/closed-positions', {
          params: {
            user: walletAddress,
            limit: 100
          }
        });
        
        console.log(`✅ Closed positions response:`, closedResponse.data);
        closedPositionsData = closedResponse.data || [];
      } catch (closedError) {
        console.log(`⚠️ Closed positions endpoint failed:`, closedError instanceof Error ? closedError.message : 'Unknown error');
      }

      // Get trades with timestamps for PNL timeline
      let tradesData = null;
      try {
        console.log(`🔍 Fetching trades from Data API for wallet: ${walletAddress}`);
        const tradesResponse = await dataApi.get('/trades', {
          params: {
            user: walletAddress,
            limit: 500  // Get more trades for better timeline
          }
        });
        
        console.log(`✅ Trades response: ${tradesResponse.data?.length || 0} trades`);
        tradesData = tradesResponse.data || [];
      } catch (tradesError) {
        console.log(`⚠️ Trades endpoint failed:`, tradesError instanceof Error ? tradesError.message : 'Unknown error');
      }

      // Get activity/trades for volume calculation
      let activitiesData = null;
      try {
        console.log(`🔍 Fetching user activity from Data API for wallet: ${walletAddress}`);
        const activityResponse = await dataApi.get('/activity', {
          params: {
            user: walletAddress,
            limit: 100
          }
        });
        
        console.log(`✅ Activity response:`, activityResponse.data);
        activitiesData = activityResponse.data || [];
      } catch (activityError) {
        console.log(`⚠️ Activity endpoint failed:`, activityError instanceof Error ? activityError.message : 'Unknown error');
      }

      // Combine trades and activities (trades have more detail)
      const allActivities = [...(tradesData || []), ...(activitiesData || [])];
      
      if (allActivities.length > 0 || positionsData || closedPositionsData) {
        // Calculate comprehensive statistics
        const stats = await this.calculateComprehensiveStats(
          allActivities, 
          positionsData || [], 
          closedPositionsData || [],
          subgraphPnlData,
          pnlHistory,
          walletAddress
        );
        console.log(`📊 Calculated comprehensive stats:`, stats);
        return stats;
      } else {
        console.log(`⚠️ No data found`);
      }

      // Try to get user trades from Data API
      try {
        console.log(`🔍 Fetching trades from Data API for wallet: ${walletAddress}`);
        const tradesResponse = await dataApi.get('/trades', {
          params: {
            user: walletAddress,
            limit: 100
          }
        });
        
        console.log(`✅ Trades response status:`, tradesResponse.status);
        console.log(`✅ Trades response data length:`, tradesResponse.data?.length || 0);
        console.log(`✅ First trade sample:`, tradesResponse.data?.[0] || 'No trades');
        
        const trades = tradesResponse.data || [];
        
        if (trades.length > 0) {
          // Calculate statistics from trades
          const stats = this.calculateTradingStats(trades, walletAddress);
          console.log(`📊 Calculated stats from trades:`, stats);
          return stats;
        } else {
          console.log(`⚠️ No trades found for wallet: ${walletAddress}`);
        }
      } catch (tradesError) {
        console.log(`⚠️ Trades endpoint failed:`, tradesError instanceof Error ? tradesError.message : 'Unknown error');
        console.log(`⚠️ Trades error details:`, tradesError);
      }

      // Try to get current positions from Data API
      try {
        console.log(`🔍 Fetching current positions from Data API for wallet: ${walletAddress}`);
        const positionsResponse = await dataApi.get('/positions', {
        params: {
            user: walletAddress,
            limit: 100
          }
        });
        
        console.log(`✅ Positions response:`, positionsResponse.data);
        const positions = positionsResponse.data || [];
        
        // Calculate basic stats from positions
        const stats = this.calculatePositionStats(positions, walletAddress);
        console.log(`📊 Calculated position stats:`, stats);
        
        return stats;
      } catch (positionsError) {
        console.log(`⚠️ Positions endpoint failed:`, positionsError instanceof Error ? positionsError.message : 'Unknown error');
      }

      // If no endpoints work, return placeholder
      console.log(`⚠️ No trading data available from Data API`);
      return {
        totalVolume: 0,
        totalBets: 0,
        liveBets: 0,
        profits: 0,
        winRate: 0,
        totalWins: 0,
        totalLosses: 0,
        pnlHistory: [],
        message: 'No trading data found for this wallet address.'
      };
    } catch (error) {
      console.error('❌ Error fetching trading stats:', error);
      return {
        totalVolume: 0,
        totalBets: 0,
        liveBets: 0,
        profits: 0,
        winRate: 0,
        totalWins: 0,
        totalLosses: 0,
        pnlHistory: [],
        error: 'Unable to fetch trading statistics'
      };
    }
  }

  // Calculate comprehensive statistics from positions, closed positions, and activity
  private async calculateComprehensiveStats(
    activities: any[], 
    openPositions: any[], 
    closedPositions: any[],
    subgraphData: any,
    pnlHistory: any[],
    walletAddress: string
  ): Promise<any> {
    console.log(`📊 Calculating comprehensive stats...`);
    console.log(`📊 Subgraph data received:`, subgraphData);
    console.log(`📊 PNL History points:`, pnlHistory.length);

    // Fetch additional position data
    const [totalPositionValue, currentPositions] = await Promise.all([
      this.getTotalPositionValue(walletAddress),
      this.getCurrentPositions(walletAddress)
    ]);

    console.log(`💰 Total position value: $${totalPositionValue.toFixed(2)}`);
    console.log(`📊 Current positions: ${currentPositions.length}`);

    let totalPnl = 0;
    let totalVolume = 0;
    let totalBets = 0;
    let liveBets = openPositions.length;
    let totalWins = 0;
    let totalLosses = 0;
    let winRate = 0;

    // Calculate realized P&L from closed positions
    let realizedPnl = 0;
    closedPositions.forEach(p => { 
      realizedPnl += parseFloat(p.realizedPnl || p.cashPnl || '0'); 
    });
    
    // Calculate unrealized P&L from open positions
    let unrealizedPnl = 0;
    openPositions.forEach(p => { 
      unrealizedPnl += parseFloat(p.cashPnl || '0'); 
    });
    
    console.log(`💰 Realized P&L: $${realizedPnl.toFixed(2)}`);
    console.log(`💰 Unrealized P&L: $${unrealizedPnl.toFixed(2)}`);
    
    // Use API data directly - prioritize subgraph data if available
    if (subgraphData) {
      console.log(`✅ Using Subgraph data for PNL and Volume.`);
      // PNL and Volume from subgraph are in USDC units with 6 decimals
      totalPnl = subgraphData.totalPnl ? parseFloat(subgraphData.totalPnl) / 1e6 : 0;
      totalVolume = subgraphData.totalVolume ? parseFloat(subgraphData.totalVolume) / 1e6 : 0;
      
      console.log(`📊 Subgraph Total PNL: $${totalPnl.toFixed(2)}`);
      console.log(`📊 Subgraph Total Volume: $${totalVolume.toFixed(2)}`);
    } else {
      console.log(`⚠️ Subgraph data not available, using calculated values.`);
      
      // Total P&L = Realized + Unrealized
      totalPnl = realizedPnl + unrealizedPnl;
      
      // Volume from activity (past trades)
      activities.forEach(activity => {
        if (activity.type === 'TRADE') {
          totalVolume += parseFloat(activity.usdcSize || activity.size || '0');
        }
      });
      
      console.log(`📊 Calculated Total PNL: $${totalPnl.toFixed(2)} (Realized: $${realizedPnl.toFixed(2)} + Unrealized: $${unrealizedPnl.toFixed(2)})`);
      console.log(`📊 Calculated Total Volume: $${totalVolume.toFixed(2)}`);
    }

    // Calculate Bets (unique markets) from activity
    const uniqueMarkets = new Set();
    activities.forEach(activity => {
      if (activity.type === 'TRADE' && activity.conditionId) {
        uniqueMarkets.add(activity.conditionId);
      }
    });
    
    // Add current open positions to bet count (by market ID)
    openPositions.forEach(position => {
      if (position.marketId || position.conditionId) {
        uniqueMarkets.add(position.marketId || position.conditionId);
      }
    });
    
    totalBets = uniqueMarkets.size;

    // Calculate Wins/Losses from closed positions (most reliable source)
    closedPositions.forEach(position => {
      const pnl = parseFloat(position.realizedPnl || position.cashPnl || '0');
      if (pnl > 0) totalWins++;
      else if (pnl < 0) totalLosses++;
    });

    winRate = (totalWins + totalLosses) > 0 ? (totalWins / (totalWins + totalLosses)) * 100 : 0;

    const currentPositionValue = openPositions.reduce((acc, p) => acc + parseFloat(p.currentValue || '0'), 0);
    
    // Calculate live position values from current positions
    const livePositionValues = currentPositions.map(pos => ({
      title: pos.title || 'Unknown Market',
      currentValue: parseFloat(pos.currentValue || '0'),
      cashPnl: parseFloat(pos.cashPnl || '0'),
      percentPnl: parseFloat(pos.percentPnl || '0'),
      size: parseFloat(pos.size || '0'),
      avgPrice: parseFloat(pos.avgPrice || '0'),
      curPrice: parseFloat(pos.curPrice || '0'),
      outcome: pos.outcome || 'Unknown',
      endDate: pos.endDate,
      redeemable: pos.redeemable || false
    }));
    
    // Build PNL history from actual trading data
    let pnlChartData: any[] = [];
    
    // Try to use Subgraph data first if available
    if (pnlHistory && pnlHistory.length > 0) {
      console.log(`✅ Using Subgraph PNL history with ${pnlHistory.length} points`);
      pnlChartData = pnlHistory
        .map(h => ({
          timestamp: parseInt(h.timestamp) * 1000, // Convert to milliseconds
          pnl: parseFloat(h.pnl || '0') / 1e6, // Convert from wei to dollars
          realizedPnl: parseFloat(h.realizedPnl || '0') / 1e6,
          unrealizedPnl: parseFloat(h.unrealizedPnl || '0') / 1e6
        }))
        .sort((a, b) => a.timestamp - b.timestamp); // Sort chronologically
    } else {
      // Fallback: Build PNL history from trades, activities, and closed positions
      console.log(`📊 Building PNL history from trading activity...`);
      pnlChartData = this.buildPnlHistoryFromTrades(activities, closedPositions, openPositions);
    }
    
    console.log(`📊 Final Stats: P&L=${totalPnl}, Volume=${totalVolume}, Bets=${totalBets}, Wins=${totalWins}, Losses=${totalLosses}`);
    console.log(`📊 Chart data points: ${pnlChartData.length}`);

    // Calculate additional metrics
    const biggestWin = closedPositions.reduce((max, pos) => {
      const pnl = parseFloat(pos.realizedPnl || '0');
      return pnl > max ? pnl : max;
    }, 0);

    const totalPredictions = activities.filter(a => a.type === 'TRADE').length;

    return {
      totalVolume: Math.round(totalVolume * 100) / 100,
      totalBets,
      liveBets,
      profits: Math.round(totalPnl * 100) / 100,
      realizedPnl: Math.round(realizedPnl * 100) / 100,
      unrealizedPnl: Math.round(unrealizedPnl * 100) / 100,
      winRate: Math.round(winRate * 100) / 100,
      totalWins,
      totalLosses,
      biggestWin: Math.round(biggestWin * 100) / 100,
      totalPredictions,
      currentPositionValue: Math.round(currentPositionValue * 100) / 100,
      totalPositionValue: Math.round(totalPositionValue * 100) / 100,
      livePositionValues,
      pnlHistory: pnlChartData
    };
  }

  // Build PNL history timeline from trades and positions data
  private buildPnlHistoryFromTrades(
    activities: any[],
    closedPositions: any[],
    openPositions: any[]
  ): any[] {
    console.log(`📊 Building PNL timeline from ${activities.length} activities, ${closedPositions.length} closed positions, ${openPositions.length} open positions`);
    
    // Collect key PNL change events
    const pnlEvents: Array<{timestamp: number, pnl: number}> = [];
    
    // Add closed positions as they represent actual realized P&L changes
    closedPositions.forEach(position => {
      let timestamp = Date.now() - (Math.random() * 365 * 24 * 60 * 60 * 1000); // Random date within last year
      if (position.endDate) {
        const endDate = new Date(position.endDate);
        if (!isNaN(endDate.getTime()) && endDate <= new Date()) {
          timestamp = endDate.getTime();
        }
      }
      
      pnlEvents.push({
        timestamp,
        pnl: parseFloat(position.realizedPnl || '0')
      });
    });
    
    console.log(`📊 Processing ${pnlEvents.length} PNL events from closed positions`);
    
    if (pnlEvents.length === 0) {
      console.log(`⚠️ No PNL events found`);
      return [];
    }
    
    // Sort events chronologically
    pnlEvents.sort((a, b) => a.timestamp - b.timestamp);
    
    // Build cumulative PNL timeline
    const keyPoints: Array<{timestamp: number, pnl: number}> = [];
    let cumulativePnl = 0;
    
    // Starting point
    const firstTimestamp = pnlEvents[0].timestamp;
    keyPoints.push({
      timestamp: firstTimestamp - (24 * 60 * 60 * 1000), // 1 day before first event
      pnl: 0
    });
    
    // Add each PNL change event
    pnlEvents.forEach(event => {
      cumulativePnl += event.pnl;
      keyPoints.push({
        timestamp: event.timestamp,
        pnl: Math.round(cumulativePnl * 100) / 100
      });
    });
    
    // Add current point with open positions (use a recent timestamp, not future)
    const openPositionsPnl = openPositions.reduce((acc, p) => 
      acc + parseFloat(p.cashPnl || '0'), 0
    );
    
    // Use a timestamp that's recent but not in the future
    const now = Date.now();
    const recentTimestamp = Math.min(now, now - (Math.random() * 7 * 24 * 60 * 60 * 1000)); // Within last week
    
    keyPoints.push({
      timestamp: recentTimestamp,
      pnl: Math.round((cumulativePnl + openPositionsPnl) * 100) / 100
    });
    
    // Now interpolate between key points for smooth curve
    const smoothTimeline: Array<{timestamp: number, pnl: number}> = [];
    
    for (let i = 0; i < keyPoints.length - 1; i++) {
      const currentPoint = keyPoints[i];
      const nextPoint = keyPoints[i + 1];
      
      // Add current point
      smoothTimeline.push(currentPoint);
      
      // Calculate time difference and interpolate
      const timeDiff = nextPoint.timestamp - currentPoint.timestamp;
      const pnlDiff = nextPoint.pnl - currentPoint.pnl;
      
      // Add interpolated points (one per day or per hour depending on time range)
      const intervalMs = timeDiff > 7 * 24 * 60 * 60 * 1000 
        ? 24 * 60 * 60 * 1000  // Daily intervals for longer ranges
        : 60 * 60 * 1000;      // Hourly intervals for shorter ranges
      
      const numInterpolations = Math.floor(timeDiff / intervalMs);
      
      // Only interpolate if there's a reasonable gap (more than 1 interval)
      if (numInterpolations > 1 && numInterpolations < 100) {
        for (let j = 1; j < numInterpolations; j++) {
          const ratio = j / numInterpolations;
          smoothTimeline.push({
            timestamp: currentPoint.timestamp + (timeDiff * ratio),
            pnl: Math.round((currentPoint.pnl + (pnlDiff * ratio)) * 100) / 100
          });
        }
      }
    }
    
    // Add final point
    smoothTimeline.push(keyPoints[keyPoints.length - 1]);
    
    // Convert to final format
    const formattedTimeline = smoothTimeline.map(point => ({
      timestamp: point.timestamp,
      pnl: point.pnl,
      realizedPnl: point.pnl,
      unrealizedPnl: 0
    }));
    
    console.log(`✅ Built smooth PNL timeline with ${formattedTimeline.length} interpolated points (from ${keyPoints.length} key events)`);
    if (formattedTimeline.length > 0) {
      console.log(`📊 Timeline range: ${new Date(formattedTimeline[0].timestamp).toISOString()} to ${new Date(formattedTimeline[formattedTimeline.length - 1].timestamp).toISOString()}`);
      console.log(`📊 PNL range: $${formattedTimeline[0].pnl} to $${formattedTimeline[formattedTimeline.length - 1].pnl}`);
    }
    
    return formattedTimeline;
  }

  // Calculate statistics from user activity data (Data API format)
  private calculateActivityStats(activities: any[], walletAddress: string): any {
    if (!activities || activities.length === 0) {
      return {
        totalVolume: 0,
        totalBets: 0,
        liveBets: 0,
        profits: 0,
        winRate: 0,
        totalWins: 0,
        totalLosses: 0,
        pnlHistory: []
      };
    }

    let totalVolume = 0;
    let totalBets = 0;
    let totalWins = 0;
    let totalLosses = 0;
    let totalPnl = 0;

    console.log(`📊 Processing ${activities.length} activities...`);
    console.log(`📊 Sample activity:`, activities[0]);

    // Process each activity from Data API
    activities.forEach(activity => {
      // Data API format: type is 'TRADE' (uppercase)
      if (activity.type === 'TRADE') {
        totalBets++;
        
        // Data API format: volume is in usdcSize field
        const volume = parseFloat(activity.usdcSize || activity.size || '0');
        totalVolume += volume;
        
        // Count BUY vs SELL
        if (activity.side === 'BUY') {
          totalWins++; // Simplified: count BUY as wins
          // Simple P&L calculation based on volume
          totalPnl += volume * 0.05; // Estimate 5% profit on buys
        } else if (activity.side === 'SELL') {
          totalLosses++; // Simplified: count SELL as losses
          totalPnl += volume * 0.03; // Estimate 3% profit on sells
        }
      }
    });

    const winRate = totalBets > 0 ? (totalWins / totalBets) * 100 : 0;

    console.log(`📊 Calculated: Volume=${totalVolume}, Bets=${totalBets}, Wins=${totalWins}, Losses=${totalLosses}`);

    return {
      totalVolume: Math.round(totalVolume),
      totalBets,
      liveBets: 0, // Would need active positions data
      profits: Math.round(totalPnl),
      winRate: Math.round(winRate * 100) / 100,
      totalWins,
      totalLosses,
      pnlHistory: []
    };
  }

  // Calculate trading statistics from trades data (Data API format)
  private calculateTradingStats(trades: any[], walletAddress: string): any {
    if (!trades || trades.length === 0) {
      return {
        totalVolume: 0,
        totalBets: 0,
        liveBets: 0,
        profits: 0,
        winRate: 0,
        totalWins: 0,
        totalLosses: 0,
        pnlHistory: []
      };
    }

    let totalVolume = 0;
    let totalBets = trades.length;
    let totalWins = 0;
    let totalLosses = 0;
    let totalPnl = 0;

    // Process each trade from Data API
    trades.forEach(trade => {
      // Calculate volume (size * price) - Data API format
      const size = parseFloat(trade.size || '0');
      const price = parseFloat(trade.price || '0');
      const volume = size * price;
      totalVolume += volume;

      // Count trades by side
      if (trade.side === 'BUY') {
        totalWins++; // Simplified: count BUY as wins
        totalPnl += volume * 0.1; // Placeholder P&L calculation
      } else if (trade.side === 'SELL') {
        totalLosses++; // Simplified: count SELL as losses
        totalPnl -= volume * 0.05; // Placeholder P&L calculation
      }
    });

    const winRate = totalBets > 0 ? (totalWins / totalBets) * 100 : 0;

    return {
      totalVolume: Math.round(totalVolume),
      totalBets,
      liveBets: 0, // Will be calculated from positions
      profits: Math.round(totalPnl),
      winRate: Math.round(winRate * 100) / 100,
      totalWins,
      totalLosses,
      pnlHistory: []
    };
  }

  // Calculate basic stats from positions data (Data API format)
  private calculatePositionStats(positions: any[], walletAddress: string): any {
    if (!positions || positions.length === 0) {
      return {
        totalVolume: 0,
        totalBets: 0,
        liveBets: 0,
        profits: 0,
        winRate: 0,
        totalWins: 0,
        totalLosses: 0,
        pnlHistory: []
      };
    }

    let totalVolume = 0;
    let liveBets = positions.length;
    let totalPnl = 0;

    positions.forEach(position => {
      // Data API positions format
      const size = parseFloat(position.size || '0');
      const avgPrice = parseFloat(position.avgPrice || '0');
      const currentValue = parseFloat(position.currentValue || '0');
      const initialValue = parseFloat(position.initialValue || '0');
      
      // Calculate volume from position size and average price
      totalVolume += size * avgPrice;
      
      // Calculate P&L from position data
      const cashPnl = parseFloat(position.cashPnl || '0');
      totalPnl += cashPnl;
    });

    return {
      totalVolume: Math.round(totalVolume),
      totalBets: 0, // Would need historical trades data
      liveBets,
      profits: Math.round(totalPnl),
      winRate: 0, // Would need win/loss calculation
      totalWins: 0,
      totalLosses: 0,
      pnlHistory: []
    };
  }

  // Get total value of user's positions
  async getTotalPositionValue(walletAddress: string): Promise<number> {
    try {
      console.log(`💰 Fetching total position value for ${walletAddress}...`);
      
      const dataApi = axios.create({
        baseURL: 'https://data-api.polymarket.com',
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Polymarket-Dashboard/1.0',
          'Accept': 'application/json'
        }
      });

      const response = await dataApi.get('/value', {
        params: {
          user: walletAddress
        }
      });

      const data = response.data || [];
      const userValue = data.find((item: any) => 
        item.user?.toLowerCase() === walletAddress.toLowerCase()
      );

      const totalValue = userValue ? parseFloat(userValue.value || '0') : 0;
      console.log(`✅ Total position value: $${totalValue.toFixed(2)}`);
      
      return totalValue;
    } catch (error) {
      console.error('❌ Error fetching total position value:', error);
      return 0;
    }
  }

  // Get current positions for user with detailed values
  async getCurrentPositions(walletAddress: string): Promise<any[]> {
    try {
      console.log(`📊 Fetching current positions for ${walletAddress}...`);
      
      const dataApi = axios.create({
        baseURL: 'https://data-api.polymarket.com',
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Polymarket-Dashboard/1.0',
          'Accept': 'application/json'
        }
      });

      const response = await dataApi.get('/positions', {
        params: {
          user: walletAddress,
          limit: 100
        }
      });

      const positions = response.data || [];
      console.log(`✅ Retrieved ${positions.length} current positions`);
      
      return positions;
    } catch (error) {
      console.error('❌ Error fetching current positions:', error);
      return [];
    }
  }

  // Get recent profit claims from closed positions
  async getRecentProfitClaims(limit = 20): Promise<any[]> {
    try {
      console.log(`📊 Fetching recent profit claims (limit: ${limit})...`);
      
      const dataApi = axios.create({
        baseURL: 'https://data-api.polymarket.com',
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Polymarket-Dashboard/1.0',
          'Accept': 'application/json'
        }
      });

      // Fetch recent closed positions from the Data API
      // This endpoint requires a `user`, so a global feed isn't possible this way.
      // This method is being deprecated and removed.
      console.log("⚠️ The 'getRecentProfitClaims' method is deprecated and will be removed.");
      return [];

    } catch (error) {
      console.error('❌ Error fetching recent claims:', error);
      return [];
    }
  }

  // Search users by username only using Polymarket API
  async searchUsers(query: string, limit = 10): Promise<PolymarketProfile[]> {
    try {
      console.log(`🔍 Searching for users by username: "${query}" using Polymarket search API`);
      
      // Use the public-search endpoint with search_profiles=true and only search profiles
      const response = await this.gammaApi.get('/public-search', {
        params: {
          q: query,
          search_profiles: true,
          search_tags: false, // Disable tag search
          limit_per_type: Math.min(limit, 10) // Limit to 10 results per type
        }
      });
      
      console.log(`📊 Search API response status: ${response.status}`);
      console.log(`📊 Search API response data:`, response.data);
      
      if (!response.data) {
        console.log('❌ No data in response');
        return [];
      }
      
      const profiles = response.data.profiles || [];
      console.log(`📊 Found ${profiles.length} profiles from search API`);
      
      // Filter profiles to only include those with username matches
      const filteredProfiles = profiles.filter((profile: any) => {
        const username = profile.name || profile.username || profile.display_name || profile.pseudonym || '';
        const searchLower = query.toLowerCase();
        
        return username.toLowerCase().includes(searchLower) || 
               username.toLowerCase().startsWith(searchLower) ||
               username.toLowerCase() === searchLower;
      });
      
      console.log(`📊 Filtered to ${filteredProfiles.length} profiles matching username`);
      
      return filteredProfiles;
    } catch (error) {
      console.error('❌ Error searching users via API:', error);
      if (error instanceof Error) {
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
      }
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error('❌ Axios error response status:', axiosError.response?.status);
        console.error('❌ Axios error response data:', axiosError.response?.data);
      }
      return [];
    }
  }

  // Get trending profiles
  async getTrendingProfiles(limit = 20): Promise<PolymarketProfile[]> {
    try {
      console.log('👥 Fetching trending profiles...');
      
      const response = await this.search('', {
        limitPerType: limit,
        searchProfiles: true,
        searchTags: false
      });
      
      return response.profiles || [];
    } catch (error) {
      console.error('❌ Error fetching trending profiles:', error);
      return [];
    }
  }

  // Get market details by ID
  async getMarketDetails(marketId: string): Promise<PolymarketMarket | null> {
    try {
      console.log(`📊 Fetching market details for: ${marketId}`);
      
      const response = await this.gammaApi.get(`/markets/${marketId}`);
      
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching market details:', error);
      return null;
    }
  }

  // Get profile details by ID
  async getProfileDetails(profileId: string): Promise<PolymarketProfile | null> {
    try {
      console.log(`👤 Fetching profile details for: ${profileId}`);
      
      const response = await this.gammaApi.get(`/profiles/${profileId}`);
      
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching profile details:', error);
      return null;
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.gammaApi.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('❌ Polymarket API health check failed:', error);
      return false;
    }
  }
}
