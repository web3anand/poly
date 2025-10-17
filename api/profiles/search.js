const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Simple search endpoint
app.get('/', async (req, res) => {
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
});

module.exports = app;
