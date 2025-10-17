// Function to fetch ALL positions with pagination
async function fetchAllPositions(baseUrl) {
  let allPositions = [];
  let offset = 0;
  const limit = 1000; // Max per request
  let hasMore = true;
  
  console.log(`🔄 Starting paginated fetch for: ${baseUrl}`);
  
  while (hasMore) {
    try {
      const url = `${baseUrl}&limit=${limit}&offset=${offset}`;
      console.log(`📡 Fetching page ${Math.floor(offset/limit) + 1}: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Polymarket-Dashboard/1.0'
        }
      });
      
      if (!response.ok) {
        console.error(`❌ API error: ${response.status} ${response.statusText}`);
        break;
      }
      
      const data = await response.json();
      const positions = Array.isArray(data) ? data : [];
      
      console.log(`✅ Fetched ${positions.length} positions (offset: ${offset})`);
      
      if (positions.length === 0) {
        hasMore = false;
      } else {
        allPositions = allPositions.concat(positions);
        offset += limit;
        
        // If we got less than the limit, we've reached the end
        if (positions.length < limit) {
          hasMore = false;
        }
        
        // Small delay between requests to be respectful to the API
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Safety break to prevent infinite loops
      if (offset > 50000) { // Max 50k positions
        console.log('⚠️ Reached safety limit of 50k positions');
        break;
      }
      
    } catch (error) {
      console.error(`❌ Error fetching page at offset ${offset}:`, error.message);
      break;
    }
  }
  
  console.log(`🎯 Total positions fetched: ${allPositions.length}`);
  return allPositions;
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
    const [openPositions, closedPositions, totalValue] = await Promise.all([
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
        })
    ]);

    console.log(`✅ Data fetched for ${wallet}`);
    console.log(`- Open positions: ${openPositions.length}`);
    console.log(`- Closed positions: ${closedPositions.length}`);
    console.log(`- Total position value: $${Array.isArray(totalValue) ? totalValue[0]?.value : totalValue?.value || 0}`);

    // Calculate comprehensive stats
    const stats = calculateComprehensiveStats(openPositions, closedPositions, totalValue);

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

function calculateComprehensiveStats(openPositions, closedPositions, totalValue) {
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
  
  // ==================== PNL HISTORY ====================
  
  const pnlHistory = buildPnlHistory(closedPositions, openPositions, realizedPnl, totalPnl);
  
  // ==================== RETURN DATA ====================
  
  return {
    totalPnl: parseFloat(totalPnl.toFixed(2)),
    realizedPnl: parseFloat(realizedPnl.toFixed(2)),
    unrealizedPnl: parseFloat(unrealizedPnl.toFixed(2)),
    totalVolume: parseFloat(totalVolume.toFixed(2)),
    winRate: parseFloat(winRate.toFixed(2)),
    biggestWin: parseFloat(biggestWin.toFixed(2)),
    totalBets: uniqueMarkets.size,
    totalPredictions: closedPositions.length + openPositions.length,
    totalPositionValue: parseFloat((Array.isArray(totalValue) ? totalValue[0]?.value : totalValue?.value || 0).toFixed(2)),
    pnlHistory,
    livePositionValues,
    // Frontend expects these field names
    liveBets: openPositions.length,  // Current open positions count
    totalWins: wonClosed + wonOpen,  // Total winning positions (closed + open)
    totalLosses: totalFinishedBets - (wonClosed + wonOpen),  // Total losing positions
    // Additional metadata
    openPositionsCount: openPositions.length,
    closedPositionsCount: closedPositions.length
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
