module.exports = async (req, res) => {
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

  try {
    // Call Polymarket API to search for users using fetch
    const url = new URL('https://gamma-api.polymarket.com/users');
    url.searchParams.append('search', query.trim());
    url.searchParams.append('limit', limit);

    console.log(`🔍 Calling: ${url.toString()}`);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PolymarketDashboard/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Polymarket API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Polymarket API response: ${data?.length || 0} profiles found`);

    // Transform the data to match our frontend format
    const profiles = (data || []).map(user => ({
      id: user.id || user.username,
      name: user.name || user.username,
      username: user.username,
      display_name: user.display_name || user.name || user.username,
      profileImage: user.profile_image || user.profileImage,
      proxyWallet: user.proxy_wallet || user.proxyWallet,
      bio: user.bio || ''
    }));

    res.status(200).json({
      success: true,
      data: profiles,
      count: profiles.length,
      query
    });
  } catch (error) {
    console.error('❌ Error searching users:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: 'Failed to search users',
      message: error.message,
      data: [],
      count: 0
    });
  }
};