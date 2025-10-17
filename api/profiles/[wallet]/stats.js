const axios = require('axios');

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
      axios.post('https://api.goldsky.com/api/public/project_clrvmz5nrtw9o01tu7a8s3w0z/subgraphs/polymarket-matic-mainnet/prod/gn', {
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
      }).then(res => res.data?.data?.user).catch(() => null),
      
      // Closed positions
      axios.get(`https://data-api.polymarket.com/closed-positions?user=${wallet}&limit=100`)
        .then(res => res.data)
        .catch(() => []),
      
      // Open positions
      axios.get(`https://data-api.polymarket.com/positions?user=${wallet}&limit=100`)
        .then(res => res.data)
        .catch(() => []),
      
      // Total position value
      axios.get(`https://data-api.polymarket.com/value?user=${wallet}`)
        .then(res => res.data)
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
  const realizedPnl = closedPositions.reduce((sum, pos) => sum + parseFloat(pos.pnl || 0), 0);
  
  // Calculate unrealized PnL from open positions
  const unrealizedPnl = openPositions.reduce((sum, pos) => {
    const value = parseFloat(pos.value || 0);
    const cost = parseFloat(pos.cost_basis || 0);
    return sum + (value - cost);
  }, 0);
  
  // Total PnL
  const totalPnl = realizedPnl + unrealizedPnl;
  
  // Calculate win rate from closed positions
  const wonPositions = closedPositions.filter(pos => parseFloat(pos.pnl || 0) > 0).length;
  const winRate = closedPositions.length > 0 ? (wonPositions / closedPositions.length) * 100 : 0;
  
  // Find biggest win
  const biggestWin = Math.max(0, ...closedPositions.map(pos => parseFloat(pos.pnl || 0)));
  
  // Calculate total volume
  const closedVolume = closedPositions.reduce((sum, pos) => sum + parseFloat(pos.size || 0), 0);
  const openVolume = openPositions.reduce((sum, pos) => sum + parseFloat(pos.cost_basis || 0), 0);
  const totalVolume = closedVolume + openVolume;
  
  // Count unique markets
  const uniqueMarkets = new Set([
    ...closedPositions.map(pos => pos.market),
    ...openPositions.map(pos => pos.market)
  ]);
  
  // Build PnL history
  const pnlHistory = buildPnlHistory(closedPositions, openPositions, totalPnl);
  
  // Get live position values
  const livePositionValues = openPositions.map(pos => ({
    market: pos.market,
    title: pos.market_title || pos.market,
    outcome: pos.outcome,
    size: parseFloat(pos.size || 0),
    value: parseFloat(pos.value || 0),
    costBasis: parseFloat(pos.cost_basis || 0),
    pnl: parseFloat(pos.value || 0) - parseFloat(pos.cost_basis || 0)
  }));

  return {
    totalPnl: parseFloat(totalPnl.toFixed(2)),
    realizedPnl: parseFloat(realizedPnl.toFixed(2)),
    unrealizedPnl: parseFloat(unrealizedPnl.toFixed(2)),
    totalVolume: parseFloat(totalVolume.toFixed(2)),
    winRate: parseFloat(winRate.toFixed(2)),
    biggestWin: parseFloat(biggestWin.toFixed(2)),
    totalBets: uniqueMarkets.size,
    totalPredictions: closedPositions.length + openPositions.length,
    totalPositionValue: parseFloat((totalValue?.value || 0).toFixed(2)),
    pnlHistory,
    livePositionValues
  };
}

function buildPnlHistory(closedPositions, openPositions, finalPnl) {
  const events = [];
  
  // Add closed positions with their actual dates
  closedPositions.forEach(pos => {
    const date = pos.end_date || pos.created_at || Date.now();
    events.push({
      timestamp: new Date(date).getTime(),
      pnl: parseFloat(pos.pnl || 0)
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

