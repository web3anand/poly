        // Function to fetch ALL positions with optimized parallel batch execution
        // Balanced for Vercel's 10s timeout limit while maximizing data
        async function fetchAllPositions(baseUrl) {
          console.log(`🚀 Starting optimized parallel fetch: ${baseUrl}`);
          
          // VERCEL-OPTIMIZED: 50 batches x 50 size = 2,500 position coverage
          // This avoids timeout while still getting 1,250+ closed positions
          const batchSize = 50; // Optimal batch size
          const maxParallel = 50; // 50 parallel requests (fast but safe for Vercel)
          
          const batchPromises = [];
          for (let i = 0; i < maxParallel; i++) {
            const offset = i * batchSize;
            const url = `${baseUrl}&limit=${batchSize}&offset=${offset}`;
            
            batchPromises.push(
              fetch(url, {
                method: 'GET',
                headers: {
                  'Accept': 'application/json',
                  'User-Agent': 'Polymarket-Dashboard/1.0'
                }
              }).then(async response => {
                if (!response.ok) {
                  console.error(`❌ Batch ${i + 1} failed: ${response.status}`);
                  return [];
                }
                const data = await response.json();
                const positions = Array.isArray(data) ? data : [];
                if (positions.length > 0) {
                  console.log(`✅ Batch ${i + 1}: ${positions.length} positions`);
                }
                return positions;
              }).catch(error => {
                console.error(`❌ Batch ${i + 1} error: ${error.message}`);
                return [];
              })
            );
          }
          
          // Execute all batches in parallel
          console.log(`🚀 Executing ${maxParallel} parallel requests...`);
          const startTime = Date.now();
          
          const batchResults = await Promise.all(batchPromises);
          
          const endTime = Date.now();
          console.log(`⏱️  Parallel execution completed in ${endTime - startTime}ms`);
          
          // Combine all results
          const allPositions = batchResults.flat();
          
          // Remove duplicates
          const uniquePositions = allPositions.filter((position, index, self) => 
            index === self.findIndex(p => 
              p.conditionId === position.conditionId && 
              p.asset === position.asset &&
              Math.abs(parseFloat(p.size || 0) - parseFloat(position.size || 0)) < 0.0001
            )
          );
          
          console.log(`🎯 Total positions: ${allPositions.length} (${uniquePositions.length} unique)`);
          return uniquePositions;
        }

        // Function to fetch ALL trades with parallel batch execution
async function fetchAllTradesWithPagination(baseUrl) {
  console.log(`🔄 Starting proper pagination for trades: ${baseUrl}`);
  
  let allTrades = [];
  let offset = 0;
  const limit = 500; // Max limit per API docs
  const maxOffset = 1000; // Max offset per API docs
  let page = 1;
  
  console.log(`📊 Fetching trades with limit=${limit}, max offset=${maxOffset}`);
  
  while (offset < maxOffset) {
    try {
      const url = `${baseUrl}&limit=${limit}&offset=${offset}`;
      console.log(`📡 Fetching page ${page}: offset=${offset}, limit=${limit}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Polymarket-Dashboard/1.0'
        }
      });
      
      if (!response.ok) {
        console.error(`❌ Trades page ${page} failed: ${response.status}`);
        break;
      }
      
      const data = await response.json();
      const trades = Array.isArray(data) ? data : [];
      
      console.log(`✅ Page ${page}: ${trades.length} trades`);
      
      if (trades.length === 0) {
        console.log('📭 No more trades - reached end');
        break;
      }
      
      allTrades = allTrades.concat(trades);
      offset += limit;
      page++;
      
      if (trades.length < limit) {
        console.log('📭 Got fewer than 500 - reached end');
        break;
      }
      
      // Optimal delay for 75 req/10s rate limit
      await new Promise(resolve => setTimeout(resolve, 140));
      
    } catch (error) {
      console.error(`❌ Trades page ${page} error: ${error.message}`);
      break;
    }
  }
  
  // Remove duplicates (in case of overlap)
  const uniqueTrades = allTrades.filter((trade, index, self) => 
    index === self.findIndex(t => t.transactionHash === trade.transactionHash && t.timestamp === trade.timestamp)
  );
  
  console.log(`🎯 Total trades fetched: ${allTrades.length} (${uniqueTrades.length} unique)`);
  console.log(`📊 Pages fetched: ${page - 1}, Max offset reached: ${offset >= maxOffset}`);
  
  return uniqueTrades;
}

async function fetchAllActivitiesWithPagination(baseUrl) {
  console.log(`🔄 Starting proper pagination for activities: ${baseUrl}`);
  
  let allActivities = [];
  let offset = 0;
  const limit = 500; // Max limit per API docs
  const maxOffset = 1000; // Max offset per API docs
  let page = 1;
  
  console.log(`📊 Fetching activities with limit=${limit}, max offset=${maxOffset}`);
  
  while (offset < maxOffset) {
    try {
      const url = `${baseUrl}&limit=${limit}&offset=${offset}`;
      console.log(`📡 Fetching page ${page}: offset=${offset}, limit=${limit}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Polymarket-Dashboard/1.0'
        }
      });
      
      if (!response.ok) {
        console.error(`❌ Activities page ${page} failed: ${response.status}`);
        break;
      }
      
      const data = await response.json();
      const activities = Array.isArray(data) ? data : [];
      
      console.log(`✅ Page ${page}: ${activities.length} activities`);
      
      if (activities.length === 0) {
        console.log('📭 No more activities - reached end');
        break;
      }
      
      allActivities = allActivities.concat(activities);
      offset += limit;
      page++;
      
      if (activities.length < limit) {
        console.log('📭 Got fewer than 500 - reached end');
        break;
      }
      
      // Add small delay to respect rate limits (200 requests/10s)
      await new Promise(resolve => setTimeout(resolve, 50));
      
    } catch (error) {
      console.error(`❌ Activities page ${page} error: ${error.message}`);
      break;
    }
  }
  
  // Remove duplicates (in case of overlap)
  const uniqueActivities = allActivities.filter((activity, index, self) => 
    index === self.findIndex(a => a.id === activity.id && a.timestamp === activity.timestamp)
  );
  
  console.log(`🎯 Total activities fetched: ${allActivities.length} (${uniqueActivities.length} unique)`);
  console.log(`📊 Pages fetched: ${page - 1}, Max offset reached: ${offset >= maxOffset}`);
  
  return uniqueActivities;
}

// Comprehensive stats API using all available Polymarket endpoints
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { wallet } = req.query;

  console.log(`📊 Comprehensive Stats API called for wallet: ${wallet}`);

  if (!wallet) {
    return res.status(400).json({
      error: 'Wallet address is required'
    });
  }

  try {
    // Fetch ALL data with pagination to get complete history
    const [openPositions, closedPositions, totalValue, allTrades, allActivities] = await Promise.all([
      // Fetch ALL open positions with pagination
      fetchAllPositions(`https://data-api.polymarket.com/positions?user=${wallet}`),
      
      // Fetch ALL closed positions with pagination  
      fetchAllPositions(`https://data-api.polymarket.com/closed-positions?user=${wallet}`),
      
      // Total current position value
      fetch(`https://data-api.polymarket.com/value?user=${wallet}`)
        .then(res => res.json())
        .catch(err => {
          console.error('Error fetching total value:', err.message);
          return [];
        }),
      
      // Fetch ALL trades with proper pagination (max 1000 offset, 500 limit)
      Promise.race([
        fetchAllTradesWithPagination(`https://data-api.polymarket.com/trades?user=${wallet}`),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Trades fetch timeout')), 20000))
      ]).catch(err => {
        console.error('Error fetching trades:', err.message);
        return [];
      }),
      
      // Fetch ALL activities with proper pagination (max 1000 offset, 500 limit)
      Promise.race([
        fetchAllActivitiesWithPagination(`https://data-api.polymarket.com/activity?user=${wallet}`),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Activities fetch timeout')), 20000))
      ]).catch(err => {
        console.error('Error fetching activities:', err.message);
        return [];
      })
    ]);

    console.log(`✅ Data fetched for ${wallet}`);
    console.log(`- Open positions: ${openPositions.length}`);
    console.log(`- Closed positions: ${closedPositions.length}`);
    console.log(`- Total trades: ${allTrades.length}`);
    console.log(`- Total activities: ${allActivities.length}`);
    console.log(`- Total position value: $${Array.isArray(totalValue) ? totalValue[0]?.value : totalValue?.value || 0}`);

    // Calculate comprehensive stats using trades and activities data for more accurate results
    const stats = calculateComprehensiveStats(openPositions, closedPositions, totalValue, allTrades, allActivities);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error(`❌ Error fetching stats for ${wallet}:`, error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user stats',
      message: error.message
    });
  }
};

function calculateComprehensiveStats(openPositions, closedPositions, totalValue, allTrades = [], allActivities = []) {
  // ==================== PNL CALCULATIONS ====================
  
  // 1. Realized PnL from CLOSED positions
  const closedRealizedPnl = closedPositions.reduce((sum, pos) => {
    return sum + parseFloat(pos.realizedPnl || 0);
  }, 0);
  
  // 2. Realized PnL from OPEN positions (past trades on these markets)
  const openRealizedPnl = openPositions.reduce((sum, pos) => {
    return sum + parseFloat(pos.realizedPnl || 0);
  }, 0);
  
  // 3. Total Realized PnL (all-time closed trades)
  const realizedPnl = closedRealizedPnl + openRealizedPnl;
  
  // 4. Unrealized PnL (current open positions)
  const unrealizedPnl = openPositions.reduce((sum, pos) => {
    return sum + parseFloat(pos.cashPnl || 0);
  }, 0);
  
  // 5. Total PnL (realized + unrealized)
  const totalPnl = realizedPnl + unrealizedPnl;
  
  console.log('🔍 Debug totalPnl calculation:');
  console.log(`   realizedPnl: ${realizedPnl} (type: ${typeof realizedPnl})`);
  console.log(`   unrealizedPnl: ${unrealizedPnl} (type: ${typeof unrealizedPnl})`);
  console.log(`   totalPnl before parseFloat: ${totalPnl} (type: ${typeof totalPnl})`);
  console.log(`   isNaN(totalPnl): ${isNaN(totalPnl)}`);
  console.log(`   totalPnl === undefined: ${totalPnl === undefined}`);
  
  console.log('📊 PnL Breakdown:');
  console.log(`   Closed Realized: $${closedRealizedPnl.toFixed(2)}`);
  console.log(`   Open Realized: $${openRealizedPnl.toFixed(2)}`);
  console.log(`   Total Realized: $${realizedPnl.toFixed(2)}`);
  console.log(`   Unrealized: $${unrealizedPnl.toFixed(2)}`);
  console.log(`   TOTAL PNL: $${totalPnl.toFixed(2)}`);
  console.log(`   totalPnl type: ${typeof totalPnl}`);
  console.log(`   totalPnl value: ${totalPnl}`);
  
  // ==================== VOLUME CALCULATIONS ====================
  
  // Total volume from closed positions
  const closedVolume = closedPositions.reduce((sum, pos) => {
    return sum + parseFloat(pos.totalBought || 0);
  }, 0);
  
  // Total volume from open positions (includes all historical trades on these markets)
  const openVolume = openPositions.reduce((sum, pos) => {
    return sum + parseFloat(pos.totalBought || 0);
  }, 0);
  
  // Total volume (all-time trading volume)
  const totalVolume = closedVolume + openVolume;
  
  // ==================== WIN RATE ====================
  
  // For closed positions, use realizedPnl
  const wonClosed = closedPositions.filter(pos => parseFloat(pos.realizedPnl || 0) > 0).length;
  
  // For open positions, use cashPnl (unrealized PnL) to determine if currently winning
  const wonOpen = openPositions.filter(pos => parseFloat(pos.cashPnl || 0) > 0).length;
  
  // Total finished bets = all closed positions + open positions that have any PnL (positive or negative)
  const totalFinishedBets = closedPositions.length + openPositions.filter(pos => parseFloat(pos.cashPnl || 0) !== 0).length;
  
  const winRate = totalFinishedBets > 0 ? ((wonClosed + wonOpen) / totalFinishedBets) * 100 : 0;
  
  console.log('🎯 Win Rate Calculation:');
  console.log(`   wonClosed: ${wonClosed} (closed positions with realizedPnl > 0)`);
  console.log(`   wonOpen: ${wonOpen} (open positions with cashPnl > 0)`);
  console.log(`   totalWins: ${wonClosed + wonOpen}`);
  console.log(`   totalFinishedBets: ${totalFinishedBets}`);
  console.log(`   winRate: ${winRate.toFixed(2)}%`);
  
  // ==================== BIGGEST WIN ====================
  
  const biggestWinClosed = closedPositions.length > 0 ? Math.max(...closedPositions.map(pos => parseFloat(pos.realizedPnl || 0))) : 0;
  const biggestWinOpen = openPositions.length > 0 ? Math.max(...openPositions.map(pos => parseFloat(pos.cashPnl || 0))) : 0;
  const biggestWin = Math.max(biggestWinClosed, biggestWinOpen);
  
  // ==================== MARKETS TRADED ====================
  
  // Count unique markets using conditionId
  const uniqueMarkets = new Set([
    ...closedPositions.map(pos => pos.conditionId),
    ...openPositions.map(pos => pos.conditionId)
  ]);
  
  // ==================== POSITION VALUES ====================
  
  const livePositionValues = openPositions.map(pos => {
    const size = parseFloat(pos.size || 0);
    const currentValue = parseFloat(pos.currentValue || 0);
    const initialValue = parseFloat(pos.initialValue || 0);
    const cashPnl = parseFloat(pos.cashPnl || 0);
    const percentPnl = parseFloat(pos.percentPnl || 0);
    const avgPrice = parseFloat(pos.avgPrice || 0);

    return {
      market: pos.conditionId || '',
      title: pos.title || 'Unknown Market',
      outcome: pos.outcome || '',
      size: size,
      currentValue: currentValue,
      costBasis: initialValue,
      cashPnl: parseFloat(cashPnl.toFixed(2)),
      percentPnl: parseFloat(percentPnl.toFixed(2)),
      avgPrice: parseFloat(avgPrice.toFixed(4)),
      endDate: pos.endDate || new Date().toISOString()
    };
  });
  
  // ==================== TRADES-BASED CALCULATIONS ====================
  
  let tradesBasedStats = {};
  
  if (allTrades && allTrades.length > 0) {
    console.log(`📊 Calculating stats from ${allTrades.length} trades...`);
    
    // Group trades by conditionId to calculate position P&L
    const tradesByMarket = {};
    allTrades.forEach(trade => {
      const key = trade.conditionId;
      if (!tradesByMarket[key]) {
        tradesByMarket[key] = {
          title: trade.title,
          trades: []
        };
      }
      tradesByMarket[key].trades.push(trade);
    });
    
    let tradesTotalPnl = 0;
    let tradesTotalVolume = 0;
    let tradesWinningPositions = 0;
    let tradesTotalPositions = 0;
    let tradesUniqueMarkets = new Set();
    
    Object.values(tradesByMarket).forEach(market => {
      const trades = market.trades.sort((a, b) => a.timestamp - b.timestamp);
      
      // Calculate position P&L from trades
      let positionPnl = 0;
      let positionVolume = 0;
      let netTokens = 0;
      
      trades.forEach(trade => {
        const tradeValue = trade.size * trade.price;
        positionVolume += tradeValue;
        tradesUniqueMarkets.add(trade.conditionId);
        
        if (trade.side === 'BUY') {
          netTokens += trade.size;
          positionPnl -= tradeValue; // Cost
        } else { // SELL
          netTokens -= trade.size;
          positionPnl += tradeValue; // Revenue
        }
      });
      
      // If we still have tokens, calculate current value (simplified)
      if (netTokens > 0) {
        // For open positions, use the last trade price as approximation
        const lastTrade = trades[trades.length - 1];
        positionPnl += netTokens * lastTrade.price;
      }
      
      tradesTotalPnl += positionPnl;
      tradesTotalVolume += positionVolume;
      tradesTotalPositions++;
      
      if (positionPnl > 0) {
        tradesWinningPositions++;
      }
    });
    
    const tradesWinRate = tradesTotalPositions > 0 ? (tradesWinningPositions / tradesTotalPositions) * 100 : 0;
    
    tradesBasedStats = {
      tradesTotalPnl: parseFloat(tradesTotalPnl.toFixed(2)),
      tradesTotalVolume: parseFloat(tradesTotalVolume.toFixed(2)),
      tradesWinRate: parseFloat(tradesWinRate.toFixed(2)),
      tradesTotalPositions: tradesTotalPositions,
      tradesWinningPositions: tradesWinningPositions,
      tradesUniqueMarkets: tradesUniqueMarkets.size,
      tradesCount: allTrades.length
    };
    
    console.log(`📊 Trades-based stats:`, tradesBasedStats);
  }
  
  // ==================== ACTIVITIES-BASED CALCULATIONS ====================
  
  let activitiesBasedStats = {};
  
  if (allActivities && allActivities.length > 0) {
    console.log(`📊 Calculating stats from ${allActivities.length} activities...`);
    
    // Group activities by conditionId to calculate position P&L
    const activitiesByMarket = {};
    allActivities.forEach(activity => {
      const key = activity.conditionId;
      if (!activitiesByMarket[key]) {
        activitiesByMarket[key] = {
          title: activity.title,
          activities: []
        };
      }
      activitiesByMarket[key].activities.push(activity);
    });
    
    let activitiesTotalPnl = 0;
    let activitiesTotalVolume = 0;
    let activitiesWinningPositions = 0;
    let activitiesTotalPositions = 0;
    let activitiesUniqueMarkets = new Set();
    
    Object.values(activitiesByMarket).forEach(market => {
      const activities = market.activities.sort((a, b) => a.timestamp - b.timestamp);
      
      // Calculate position P&L from activities
      let positionPnl = 0;
      let positionVolume = 0;
      let netTokens = 0;
      
      activities.forEach(activity => {
        if (activity.type === 'TRADE') {
          const tradeValue = activity.size * activity.price;
          positionVolume += tradeValue;
          activitiesUniqueMarkets.add(activity.conditionId);
          
          if (activity.side === 'BUY') {
            netTokens += activity.size;
            positionPnl -= tradeValue; // Cost
          } else if (activity.side === 'SELL') {
            netTokens -= activity.size;
            positionPnl += tradeValue; // Revenue
          }
        } else if (activity.type === 'YIELD' || activity.type === 'REWARD') {
          // Add yield/rewards as profit
          positionPnl += parseFloat(activity.size || 0);
        } else if (activity.type === 'REDEEM') {
          // Add redemption as profit
          positionPnl += parseFloat(activity.size || 0);
        }
      });
      
      // If we still have tokens, calculate current value (simplified)
      if (netTokens > 0) {
        // For open positions, use the last trade price as approximation
        const lastTrade = activities.filter(a => a.type === 'TRADE').pop();
        if (lastTrade) {
          positionPnl += netTokens * lastTrade.price;
        }
      }
      
      activitiesTotalPnl += positionPnl;
      activitiesTotalVolume += positionVolume;
      activitiesTotalPositions++;
      
      if (positionPnl > 0) {
        activitiesWinningPositions++;
      }
    });
    
    const activitiesWinRate = activitiesTotalPositions > 0 ? (activitiesWinningPositions / activitiesTotalPositions) * 100 : 0;
    
    activitiesBasedStats = {
      activitiesTotalPnl: parseFloat(activitiesTotalPnl.toFixed(2)),
      activitiesTotalVolume: parseFloat(activitiesTotalVolume.toFixed(2)),
      activitiesWinRate: parseFloat(activitiesWinRate.toFixed(2)),
      activitiesTotalPositions: activitiesTotalPositions,
      activitiesWinningPositions: activitiesWinningPositions,
      activitiesUniqueMarkets: activitiesUniqueMarkets.size,
      activitiesCount: allActivities.length
    };
    
    console.log(`📊 Activities-based stats:`, activitiesBasedStats);
  }
  
  // ==================== PNL HISTORY ====================
  
  const pnlHistory = buildPnlHistory(closedPositions, openPositions, realizedPnl, totalPnl);
  
  // ==================== RETURN DATA ====================
  
  // Prioritize activities-based stats (most comprehensive), then trades, then positions
  const useActivitiesStats = allActivities && allActivities.length > 0 && activitiesBasedStats.activitiesTotalPnl !== 0;
  const useTradesStats = !useActivitiesStats && allTrades && allTrades.length > 0 && tradesBasedStats.tradesTotalPnl !== 0;
  
  return {
    // Use activities-based P&L if available (most comprehensive), otherwise trades, then positions
    totalPnl: useActivitiesStats ? activitiesBasedStats.activitiesTotalPnl : 
              useTradesStats ? tradesBasedStats.tradesTotalPnl : 
              parseFloat(totalPnl.toFixed(2)),
    realizedPnl: parseFloat(realizedPnl.toFixed(2)),
    unrealizedPnl: parseFloat(unrealizedPnl.toFixed(2)),
    // Use activities-based volume if available (most comprehensive)
    totalVolume: useActivitiesStats ? activitiesBasedStats.activitiesTotalVolume :
                 useTradesStats ? tradesBasedStats.tradesTotalVolume : 
                 parseFloat(totalVolume.toFixed(2)),
    // Use activities-based win rate if available
    winRate: useActivitiesStats ? activitiesBasedStats.activitiesWinRate :
             useTradesStats ? tradesBasedStats.tradesWinRate : 
             parseFloat(winRate.toFixed(2)),
    biggestWin: parseFloat(biggestWin.toFixed(2)),
    // Use activities-based counts if available (most comprehensive)
    totalBets: useActivitiesStats ? activitiesBasedStats.activitiesUniqueMarkets :
               useTradesStats ? tradesBasedStats.tradesUniqueMarkets : 
               uniqueMarkets.size,
    totalPredictions: useActivitiesStats ? activitiesBasedStats.activitiesTotalPositions :
                      useTradesStats ? tradesBasedStats.tradesTotalPositions : 
                      (closedPositions.length + openPositions.length),
    totalPositionValue: parseFloat((Array.isArray(totalValue) ? totalValue[0]?.value : totalValue?.value || 0).toFixed(2)),
    pnlHistory,
    livePositionValues,
    // Frontend expects these field names
    liveBets: openPositions.length,  // Current open positions count
    totalWins: useActivitiesStats ? activitiesBasedStats.activitiesWinningPositions :
               useTradesStats ? tradesBasedStats.tradesWinningPositions : 
               (wonClosed + wonOpen),  // Total winning positions
    totalLosses: useActivitiesStats ? (activitiesBasedStats.activitiesTotalPositions - activitiesBasedStats.activitiesWinningPositions) :
                 useTradesStats ? (tradesBasedStats.tradesTotalPositions - tradesBasedStats.tradesWinningPositions) : 
                 (totalFinishedBets - (wonClosed + wonOpen)),  // Total losing positions
    // Additional metadata
    openPositionsCount: openPositions.length,
    closedPositionsCount: closedPositions.length,
    // Data source metadata
    tradesCount: allTrades ? allTrades.length : 0,
    activitiesCount: allActivities ? allActivities.length : 0,
    dataSource: useActivitiesStats ? 'activities' : useTradesStats ? 'trades' : 'positions'
  };
}

function buildPnlHistory(closedPositions, openPositions, realizedPnl, totalPnl) {
  const events = [];
  
  // Add closed positions
  closedPositions.forEach(pos => {
    if (pos.realizedPnl && pos.endDate) {
      events.push({
        timestamp: new Date(pos.endDate).getTime(),
        pnl: parseFloat(pos.realizedPnl || 0),
        type: 'closed'
      });
    }
  });
  
  // Add realized trades from open positions
  openPositions.forEach(pos => {
    if (pos.realizedPnl && pos.realizedPnl !== 0) {
      // Use current date as approximation for when trades happened
      events.push({
        timestamp: new Date(pos.endDate || Date.now()).getTime(),
        pnl: parseFloat(pos.realizedPnl || 0),
        type: 'open_realized'
      });
    }
  });
  
  // Sort by timestamp
  events.sort((a, b) => a.timestamp - b.timestamp);
  
  // Build cumulative PnL history
  const history = [];
  let cumulativePnl = 0;
  
  // Add starting point (1 month before first trade)
  if (events.length > 0) {
    const firstDate = new Date(events[0].timestamp);
    firstDate.setMonth(firstDate.getMonth() - 1);
    history.push({
      timestamp: firstDate.getTime(),
      pnl: 0
    });
  }
  
  // Add each event's cumulative PnL
  events.forEach(event => {
    cumulativePnl += event.pnl;
    history.push({
      timestamp: event.timestamp,
      pnl: parseFloat(cumulativePnl.toFixed(2))
    });
  });
  
  // Add current point with total PnL (includes unrealized)
  history.push({
    timestamp: Date.now(),
    pnl: parseFloat(totalPnl.toFixed(2))
  });
  
  // Interpolate for smoother graph
  return interpolateHistory(history);
}

function interpolateHistory(history) {
  if (history.length < 2) return history;
  
  const interpolated = [];
  
  for (let i = 0; i < history.length - 1; i++) {
    const current = history[i];
    const next = history[i + 1];
    
    interpolated.push(current);
    
    const timeDiff = next.timestamp - current.timestamp;
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
    
    // Add interpolation points for gaps > 2 days
    if (daysDiff > 2) {
      const numPoints = Math.min(Math.floor(daysDiff / 2), 10);
      const pnlStep = (next.pnl - current.pnl) / (numPoints + 1);
      const timeStep = timeDiff / (numPoints + 1);
      
      for (let j = 1; j <= numPoints; j++) {
        interpolated.push({
          timestamp: current.timestamp + (timeStep * j),
          pnl: parseFloat((current.pnl + (pnlStep * j)).toFixed(2))
        });
      }
    }
  }
  
  interpolated.push(history[history.length - 1]);
  
  return interpolated;
}
