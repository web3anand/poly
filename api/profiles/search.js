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
    // Use Polymarket's public-search endpoint
    const url = new URL('https://gamma-api.polymarket.com/public-search');
    url.searchParams.append('q', query.trim());
    url.searchParams.append('search_profiles', 'true');
    url.searchParams.append('search_tags', 'false');
    url.searchParams.append('limit_per_type', limit);

    console.log(`🔍 Calling: ${url.toString()}`);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error: ${response.status} - ${errorText}`);
      throw new Error(`Polymarket API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const profiles = data.profiles || [];
    console.log(`✅ Polymarket API response: ${profiles.length} profiles found`);

    // Transform the data to match our frontend format
    const transformedProfiles = profiles.map(user => ({
      id: user.proxyWallet || user.name,
      name: user.name,
      username: user.name,
      display_name: user.displayUsernamePublic ? user.name : user.pseudonym,
      profileImage: user.profileImage || '',
      proxyWallet: user.proxyWallet,
      bio: user.bio || ''
    }));

    res.status(200).json({
      success: true,
      data: transformedProfiles,
      count: transformedProfiles.length,
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