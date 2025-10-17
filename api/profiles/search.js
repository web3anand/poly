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

  // Only handle GET requests
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    console.log('🔍 Search endpoint hit');
    
    const { q: query, limit = 20 } = req.query;

    console.log(`🔍 Search request received: query="${query}", limit=${limit}`);

    if (!query || typeof query !== 'string') {
      console.log('❌ Invalid query parameter');
      return res.status(400).json({ 
        error: 'Query parameter is required' 
      });
    }

    // For now, return mock data to test if the endpoint works
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

  } catch (error) {
    console.error('❌ Error searching profiles:', error);
    
    res.status(500).json({ 
      error: 'Failed to search profiles',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};