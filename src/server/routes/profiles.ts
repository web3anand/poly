import { Router } from 'express';
import { PolymarketService } from '../services/polymarketService';

const router = Router();
const polymarketService = new PolymarketService();

// Search profiles by username only
router.get('/search', async (req, res) => {
  try {
    const { q: query, limit = 20 } = req.query;

    console.log(`🔍 Search request received: query="${query}", limit=${limit}`);

    if (!query || typeof query !== 'string') {
      console.log('❌ Invalid query parameter');
      return res.status(400).json({ 
        error: 'Query parameter is required' 
      });
    }

    console.log(`🔍 Calling searchUsers with query: "${query}"`);
    
    // Use the dedicated searchUsers method that only searches by username
    const profiles = await polymarketService.searchUsers(query, parseInt(limit as string));

    console.log(`✅ Search completed: found ${profiles.length} profiles`);

    res.json({
      success: true,
      data: profiles,
      count: profiles.length,
      query
    });

  } catch (error) {
    console.error('❌ Error searching profiles:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    res.status(500).json({ 
      error: 'Failed to search profiles',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    });
  }
});

// Get trending profiles
router.get('/trending', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const trendingProfiles = await polymarketService.getTrendingProfiles(parseInt(limit as string));

    res.json({
      success: true,
      data: trendingProfiles,
      count: trendingProfiles.length
    });

  } catch (error) {
    console.error('Error fetching trending profiles:', error);
    res.status(500).json({ 
      error: 'Failed to fetch trending profiles',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get trading stats for a wallet
router.get('/:wallet/stats', async (req, res) => {
  try {
    const { wallet } = req.params;
    
    console.log(`📊 API called for wallet: ${wallet}`);
    const stats = await polymarketService.getUserTradingStats(wallet);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching trading stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch trading stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test endpoint to verify Data API integration
router.get('/test/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;
    
    console.log(`🧪 Testing Data API for wallet: ${wallet}`);
    
    // Test direct Data API call
    const axios = require('axios');
    const dataApi = axios.create({
      baseURL: 'https://data-api.polymarket.com',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Polymarket-Dashboard/1.0',
        'Accept': 'application/json'
      }
    });

    const tradesResponse = await dataApi.get('/trades', {
      params: {
        user: wallet,
        limit: 5
      }
    });

    res.json({
      success: true,
      message: 'Data API test successful',
      data: {
        status: tradesResponse.status,
        tradesCount: tradesResponse.data?.length || 0,
        firstTrade: tradesResponse.data?.[0] || null
      }
    });

  } catch (error) {
    console.error('Data API test error:', error);
    res.status(500).json({ 
      error: 'Data API test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get recent profit claims across all users
router.get('/recent-claims/feed', async (req, res) => {
  try {
    // This feature is deprecated as Polymarket API requires a user for closed positions.
    console.log("⚠️ Deprecated endpoint '/recent-claims/feed' was called.");
    res.json({
      success: true,
      data: [],
      count: 0,
      message: "This feature is currently unavailable."
    });
  } catch (error) {
    console.error('Error fetching recent claims:', error);
    res.status(500).json({ 
      error: 'Failed to fetch recent claims',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get profile details
router.get('/:profileId', async (req, res) => {
  try {
    const { profileId } = req.params;
    
    const profile = await polymarketService.getProfileDetails(profileId);

    if (!profile) {
      return res.status(404).json({ 
        error: 'Profile not found' 
      });
    }

    res.json({
      success: true,
      data: profile
    });

  } catch (error) {
    console.error('Error fetching profile details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch profile details',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
