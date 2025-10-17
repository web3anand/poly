module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { wallet } = req.query;

  console.log(`📊 Stats API called for wallet: ${wallet}`);

  if (!wallet) {
    return res.status(400).json({
      error: 'Wallet address is required'
    });
  }

  try {
    // Fetch all required data in parallel
    const [subgraphData, closedPositions, openPositions, totalValue] = await Promise.all([
      // Subgraph data
      fetch('https://api.goldsky.com/api/public/project_clrvmz5nrtw9o01tu7a8s3w0z/subgraphs/polymarket-matic-mainnet/prod/gn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `{
            user(id: "${wallet.toLowerCase()}") {
              id
              totalPnl
              totalVolume
              winRate
              biggestWin
              totalBets
            }
          }`
        })
      }).then(res => res.json()).then(data => data?.data?.user).catch(() => null),
      
      // Closed positions (fetch more to get complete history)
      fetch(`https://data-api.polymarket.com/closed-positions?user=${wallet}&limit=500`)
        .then(res => res.json())
        .catch(() => []),
      
      // Open positions (fetch more to get all current positions)
      fetch(`https://data-api.polymarket.com/positions?user=${wallet}&limit=500`)
        .then(res => res.json())
        .catch(() => []),
      
      // Total position value
      fetch(`https://data-api.polymarket.com/value?user=${wallet}`)
        .then(res => res.json())
        .catch(() => ({ value: 0 }))
    ]);

    console.log(`✅ Data fetched for ${wallet}`);
    console.log(`- Subgraph data:`, subgraphData ? 'Yes' : 'No');
    console.log(`- Closed positions: ${closedPositions.length}`);
    console.log(`- Open positions: ${openPositions.length}`);

    // Calculate comprehensive stats
    const stats = calculateStats(subgraphData, closedPositions, openPositions, totalValue);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error(`❌ Error fetching stats for ${wallet}:`, error.message);
    console.error('Error details:', error.response?.data || error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user stats',
      message: error.message
    });
  }
};

function calculateStats(subgraphData, closedPositions, openPositions, totalValue) {
  // Calculate realized PnL from closed positions
  const closedRealizedPnl = closedPositions.reduce((sum, pos) => sum + parseFloat(pos.realizedPnl || 0), 0);
  
  // Calculate realized PnL from open positions (past trades on these markets)
  const openRealizedPnl = openPositions.reduce((sum, pos) => sum + parseFloat(pos.realizedPnl || 0), 0);
  
  // Total realized PnL
  const realizedPnl = closedRealizedPnl + openRealizedPnl;
  
  // Calculate unrealized PnL from open positions (current holdings)
  const unrealizedPnl = openPositions.reduce((sum, pos) => {
    return sum + parseFloat(pos.cashPnl || 0);
  }, 0);
  
  // Total PnL (all-time)
  const totalPnl = realizedPnl + unrealizedPnl;
  
  // Calculate win rate from closed positions
  const wonPositions = closedPositions.filter(pos => parseFloat(pos.realizedPnl || 0) > 0).length;
  const winRate = closedPositions.length > 0 ? (wonPositions / closedPositions.length) * 100 : 0;
  
  // Find biggest win
  const biggestWin = Math.max(0, ...closedPositions.map(pos => parseFloat(pos.realizedPnl || 0)));
  
  // Calculate total volume (total bought)
  const closedVolume = closedPositions.reduce((sum, pos) => sum + parseFloat(pos.totalBought || 0), 0);
  const openVolume = openPositions.reduce((sum, pos) => sum + parseFloat(pos.totalBought || 0), 0);
  const totalVolume = closedVolume + openVolume;
  
  // Count unique markets (use conditionId as the unique identifier)
  const uniqueMarkets = new Set([
    ...closedPositions.map(pos => pos.conditionId || pos.eventSlug),
    ...openPositions.map(pos => pos.conditionId || pos.eventSlug)
  ]);
  
  // Build PnL history
  const pnlHistory = buildPnlHistory(closedPositions, openPositions, totalPnl);
  
  // Get live position values
  const livePositionValues = openPositions.map(pos => {
    const size = parseFloat(pos.size || 0);
    const currentValue = parseFloat(pos.currentValue || 0);
    const cashPnl = parseFloat(pos.cashPnl || 0);
    const percentPnl = parseFloat(pos.percentPnl || 0);
    const avgPrice = parseFloat(pos.avgPrice || 0);
    const initialValue = parseFloat(pos.initialValue || 0);

    return {
      market: pos.conditionId || pos.eventSlug || '',
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
    livePositionValues
  };
}

function buildPnlHistory(closedPositions, openPositions, finalPnl) {
  const events = [];
  
  // Add closed positions with their actual dates
  closedPositions.forEach(pos => {
    const date = pos.endDate || pos.end_date || Date.now();
    events.push({
      timestamp: new Date(date).getTime(),
      pnl: parseFloat(pos.realizedPnl || 0)
    });
  });
  
  // Sort by timestamp
  events.sort((a, b) => a.timestamp - b.timestamp);
  
  // Build cumulative PnL history
  const history = [];
  let cumulativePnl = 0;
  
  // Add starting point
  if (events.length > 0) {
    const firstDate = new Date(events[0].timestamp);
    firstDate.setMonth(firstDate.getMonth() - 1);
    history.push({
      timestamp: firstDate.getTime(),
      pnl: 0
    });
  }
  
  // Add each event
  events.forEach(event => {
    cumulativePnl += event.pnl;
    history.push({
      timestamp: event.timestamp,
      pnl: parseFloat(cumulativePnl.toFixed(2))
    });
  });
  
  // Add current point with final PnL (including unrealized)
  history.push({
    timestamp: Date.now(),
    pnl: parseFloat(finalPnl.toFixed(2))
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

