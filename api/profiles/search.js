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

  console.log('🔍 Search API called:', req.url);

  // Get query parameters
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { q: query, limit = 20 } = url.searchParams;

  console.log(`🔍 Search request: query="${query}", limit=${limit}`);

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
};