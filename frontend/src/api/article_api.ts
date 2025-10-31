import type { NewsArticle } from "../../../src/db/schema";

const BACKEND_URL = `${import.meta.env.VITE_BACKEND_URL}`;

export interface TickerSentiment {
  tickerId: number;
  symbol: string;
  tickerSentimentScore: string | null;
  tickerSentimentLabel: string | null;
  relevanceScore: string | null;
}

export interface ArticleWithTickers extends NewsArticle {
  tickers: TickerSentiment[];
}

export async function getNewsArticles(): Promise<ArticleWithTickers[]> {
    try {
        const response = await fetch(`${BACKEND_URL}/seed/articles`);

        console.log(`getnewsarticle frotnend...`, response)
        if (!response.ok) {
            console.error('Failed to fetch articles');
            return [];
        }

        const data = await response.json();
        console.log(`getnewsarticlewrong`,data);
        return data;

    } catch (error) {
        console.error('Error fetching articles:', error);
        return [];
    }
}