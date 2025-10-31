import { Router, type Request, type Response } from 'express';
import { 
    getAllTickers, 
    getTickersByType,
    getAllArticlesWithTickerSentiments 
} from  "../../db/db_api.js"; // Adjust path to your db api

const publicDataRouter = Router();

/**
 * Get all tickers
 * GET /api/public/tickers
 * NO AUTH REQUIRED
 */
publicDataRouter.get('/tickers', async (req: Request, res: Response) => {
    try {
        const tickers = await getAllTickers();
        res.json(tickers);
    } catch (error) {
        console.error('Error fetching tickers:', error);
        res.status(500).json({ error: 'Failed to fetch tickers' });
    }
});

/**
 * Get tickers by type
 * GET /api/public/tickers/stock
 * GET /api/public/tickers/crypto
 * NO AUTH REQUIRED
 */
publicDataRouter.get('/tickers/:type', async (req: Request, res: Response) => {
    try {
        const type = req.params.type as 'stock' | 'crypto';
        
        if (type !== 'stock' && type !== 'crypto') {
            return res.status(400).json({ error: 'Type must be "stock" or "crypto"' });
        }
        
        const tickers = await getTickersByType(type);
        res.json(tickers);
    } catch (error) {
        console.error('Error fetching tickers by type:', error);
        res.status(500).json({ error: 'Failed to fetch tickers' });
    }
});

/**
 * Get all articles with their ticker sentiments
 * GET /api/public/articles
 * GET /api/public/articles?ticker=AAPL (filter by ticker)
 * NO AUTH REQUIRED
 */
publicDataRouter.get('/articles', async (req: Request, res: Response) => {
    try {
        const tickerSymbol = req.query.ticker as string | undefined;
        const articles = await getAllArticlesWithTickerSentiments(tickerSymbol);
        res.json(articles);
    } catch (error) {
        console.error('Error fetching articles:', error);
        res.status(500).json({ error: 'Failed to fetch articles' });
    }
});

export default publicDataRouter;