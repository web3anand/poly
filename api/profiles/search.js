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
  console.log('🔍 Query params:', req.query);

  // Get query parameters from Vercel's req.query
  const { q: query, limit = '20' } = req.query || {};

  console.log(`🔍 Search request: query="${query}", limit=${limit}`);

  if (!query || typeof query !== 'string' || query.trim() === '') {
    console.log('❌ Invalid query parameter');
    return res.status(400).json({ 
      error: 'Query parameter "q" is required and must not be empty' 
    });
  }

  // Return mock data for testing
  const mockProfiles = [
    {
      id: '1',
      name: 'Car Expert',
      username: 'carexpert',
      display_name: 'Car Expert',
      profileImage: null,
      proxyWallet: '0x1234567890123456789012345678901234567890',
      bio: 'Expert in car-related predictions'
    }
  ];

  console.log(`✅ Search completed: found ${mockProfiles.length} profiles for query "${query}"`);

  res.status(200).json({
    success: true,
    data: mockProfiles,
    count: mockProfiles.length,
    query
  });
};