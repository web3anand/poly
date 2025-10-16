import { Router } from 'express';
import { PolymarketService } from '../services/polymarketService';

const router = Router();
const polymarketService = new PolymarketService();

// Search markets, events, and profiles
router.get('/search', async (req, res) => {
  try {
    const { 
      q: query, 
      limit = 20, 
      category, 
      status = 'active',
      sort = 'volume',
      ascending = false 
    } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        error: 'Query parameter is required' 
      });
    }

    const searchResults = await polymarketService.search(query, {
      limitPerType: parseInt(limit as string),
      searchProfiles: true,
      searchTags: true,
      eventsStatus: status as string,
      eventsTag: category ? [category as string] : undefined,
      sort: sort as string,
      ascending: ascending === 'true'
    });

    res.json({
      success: true,
      data: searchResults,
      query
    });

  } catch (error) {
    console.error('Error searching markets:', error);
    res.status(500).json({ 
      error: 'Failed to search markets',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get featured markets
router.get('/featured', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const featuredMarkets = await polymarketService.getFeaturedMarkets(parseInt(limit as string));

    res.json({
      success: true,
      data: featuredMarkets,
      count: featuredMarkets.length
    });

  } catch (error) {
    console.error('Error fetching featured markets:', error);
    res.status(500).json({ 
      error: 'Failed to fetch featured markets',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get markets by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 20 } = req.query;
    
    const markets = await polymarketService.getMarketsByCategory(category, parseInt(limit as string));

    res.json({
      success: true,
      data: markets,
      count: markets.length,
      category
    });

  } catch (error) {
    console.error('Error fetching markets by category:', error);
    res.status(500).json({ 
      error: 'Failed to fetch markets by category',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get market details
router.get('/:marketId', async (req, res) => {
  try {
    const { marketId } = req.params;
    
    const market = await polymarketService.getMarketDetails(marketId);

    if (!market) {
      return res.status(404).json({ 
        error: 'Market not found' 
      });
    }

    res.json({
      success: true,
      data: market
    });

  } catch (error) {
    console.error('Error fetching market details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch market details',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
