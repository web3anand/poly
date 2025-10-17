module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Get the path from the URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  console.log('🔍 API request received:', path);

  // Handle different endpoints
  if (path === '/api/health') {
    res.json({ 
      status: 'API is working', 
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (path === '/api/profiles/search') {
    const { q: query, limit = 20 } = url.searchParams;

    console.log(`🔍 Search request received: query="${query}", limit=${limit}`);

    if (!query || typeof query !== 'string') {
      console.log('❌ Invalid query parameter');
      return res.status(400).json({ 
        error: 'Query parameter is required' 
      });
    }

    // Return mock data for testing
    const mockProfiles = [
      {
        id: '1',
        name: 'Test User',
        username: 'testuser',
        display_name: 'Test User',
        profileImage: null,
        proxyWallet: '0x1234567890123456789012345678901234567890'
      }
    ];

    console.log(`✅ Search completed: found ${mockProfiles.length} profiles`);

    res.json({
      success: true,
      data: mockProfiles,
      count: mockProfiles.length,
      query
    });
    return;
  }

  // Default response for unknown endpoints
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: path
  });
};
