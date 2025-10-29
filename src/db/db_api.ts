import { db } from "./client.js";
import { eq, and } from "drizzle-orm";
import {
    users,
    tickers,
    userWatchlist,
    newsArticles,
    newsArticleTickers,
    type User,
    type NewUser,
    type Ticker,
    type NewTicker,
    type UserWatchlist,
    type NewUserWatchlist,
    type NewsArticle,
    type NewNewsArticle,
    type NewsArticleTicker,
    type NewNewsArticleTicker,
    sessions,
} from "./schema.js";

/**
 * Create a user.
 * - Inserts the new user row.
 * - Reads it back to return the full typed row (ensures DB defaults are present).
 */
export async function createUser(newUser: NewUser): Promise<User> {
    await db.insert(users).values(newUser);

    const rows = await db
        .select()
        .from(users)
        .where(eq(users.userId, newUser.userId));

    if (rows.length === 0) {
        throw new Error("Failed to create user");
    }

    return rows[0] as User;
}

/**
 * Get a user by id.
 */
export async function getUserById(userId: string): Promise<User | null> {
    const rows = await db
        .select()
        .from(users)
        .where(eq(users.userId, userId));

    return rows[0] ?? null;
}

/**
 * Get a user by id.
 */
export async function getUserByEmail(email: string): Promise<User | null> {
    const rows = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

    return rows[0] ?? null;
}

/**
 * Get a user by session token.
 */
export async function getSessionById(sessionId: string): Promise<{ sessionId: string; userId: string; expiresAt: Date, user: User } | null> {
    const rows = await db
        .select({
            sessionId: sessions.sessionId,
            userId: sessions.userId,
            expiresAt: sessions.expiresAt,
            user: users,
        })
        .from(sessions)
        .innerJoin(
            users,
            eq(sessions.userId, users.userId)
        )
        .where(eq(sessions.sessionId, sessionId));

    if (rows.length === 0) {
        return null;
    }

    return rows[0] as { sessionId: string; userId: string; expiresAt: Date, user: User };
}


export async function createSession(sessionId: string, userId: string, expiresAt: Date): Promise<void> {
    await db.insert(sessions).values({
        sessionId,
        userId,
        expiresAt,
    });
}

export async function deleteSession(sessionId: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.sessionId, sessionId));
}

/**
 * Enable or disable user notifications.
 */
export async function setUserNotifications(userId: string, enabled: boolean): Promise<boolean> {
    const result = await db
        .update(users)
        .set({ notificationEnabled: enabled })
        .where(eq(users.userId, userId));

    if (result) {
        return true;
    }

    return false;
}

/**
 * Create a ticker (symbol + type). Returns the created record.
 */
export async function createTicker(newTicker: NewTicker): Promise<Ticker> {
    await db.insert(tickers).values(newTicker);

    const rows = await db
        .select()
        .from(tickers)
        .where(and(eq(tickers.symbol, newTicker.symbol), eq(tickers.type, newTicker.type)));

    if (rows.length === 0) {
        throw new Error("Failed to create ticker");
    }

    return rows[0] as Ticker;
}

/**
 * Get all Tickers
 */
export async function getAllTickers(): Promise<Ticker[]> {
    const rows = await db
        .select()
        .from(tickers);

    return rows as Ticker[];
}

/**
 * Get all tickers of a given type
 * @param type The ticker type ("stock" or "crypto")
 */
export async function getTickersByType(type: "stock" | "crypto"): Promise<Ticker[]> {
    const rows = await db
        .select()
        .from(tickers)
        .where(eq(tickers.type, type));

    return rows as Ticker[];
}

/**
 * Delete a ticker by symbol. Returns true if a row was deleted.
 * @param symbol The ticker symbol (i.e. AAPL or BTC)
 */
export async function deleteTicker(symbol: string): Promise<boolean> {
    const result = await db
        .delete(tickers)
        .where(and(eq(tickers.symbol, symbol)));

    if (result) {
        return true;
    }

    return false;
}

/**
 * Get all tickers in a user's watchlist
 * @param userId The user ID
 */
export async function getUserWatchlistTickers(userId: string): Promise<Ticker[]> {
    const rows = await db
        .select({
            tickerId: tickers.tickerId,
            symbol: tickers.symbol,
            type: tickers.type,
            createdAt: tickers.createdAt,
        })
        .from(tickers)
        .innerJoin(
            userWatchlist,
            eq(tickers.tickerId, userWatchlist.tickerId)
        )
        .where(eq(userWatchlist.userId, userId));

    return rows as Ticker[];
}

/**
 * Get ticker ID by symbol
 * @param symbol The ticker symbol (i.e. AAPL or BTC)
 */
export async function getTickerBySymbol(symbol: string): Promise<Ticker | null> {
    const rows = await db
        .select()
        .from(tickers)
        .where(and(eq(tickers.symbol, symbol)));

    if (rows.length === 0) {
        return null;
    }
    return rows[0] as Ticker;
}

/**
 * Add an item to a user's watchlist.
 * Returns the inserted watchlist row (reads back to include DB defaults).
 * @param entry The watchlist entry to add
 * entry is expected to be { userId: string; tickerId: number; notificationEnabled?: boolean }
 */
export async function addUserWatchlist(entry: NewUserWatchlist): Promise<UserWatchlist> {
    await db.insert(userWatchlist).values(entry);

    const rows = await db
        .select()
        .from(userWatchlist)
        .where(and(eq(userWatchlist.userId, entry.userId), eq(userWatchlist.tickerId, entry.tickerId)));

    if (rows.length === 0) {
        throw new Error("Failed to add watchlist entry");
    }

    return rows[0] as UserWatchlist;
}

/**
 * Remove a watchlist entry. Returns true when a row was deleted.
 * @param userId The user ID (sub attribute from Cognito)
 * @param tickerId The ticker ID
 */
export async function removeUserWatchlist(userId: string, tickerId: number): Promise<boolean> {
    const result = await db
        .delete(userWatchlist)
        .where(and(eq(userWatchlist.userId, userId), eq(userWatchlist.tickerId, tickerId)));

    if (result) {
        return true;
    }

    return false;
}

/**
 * Create a news article. Returns the row back.
 */
export async function createNewsArticle(article: NewNewsArticle): Promise<NewsArticle> {
    await db.insert(newsArticles).values(article);

    const rows = await db
        .select()
        .from(newsArticles)
        .where(eq(newsArticles.articleId, article.articleId));

    if (rows.length === 0) {
        throw new Error("Failed to create news article");
    }

    return rows[0] as NewsArticle;
}

export async function doesNewsArticleIdExist(articleId: string): Promise<boolean> {
    const rows = await db
        .select()
        .from(newsArticles)
        .where(eq(newsArticles.articleId, articleId));

    return rows.length > 0;
}

/**
 * Upsert (insert-or-update) a record in news_article_tickers.
 * - If a row exists for the (articleId, tickerId) composite key, it updates the sentiment fields.
 * - Otherwise inserts a new row.
 * @param params The parameters for upsert
 * - articleId The article ID (sha256 of url)
 * - tickerId The ticker ID
 * - tickerSentimentScore Optional sentiment score (-1.0 to 1.0)
 * - tickerSentimentLabel Optional sentiment label (e.g. "positive", "negative", "neutral")
 * - relevanceScore Optional relevance score (0.0 to 1.0)
 * Returns the final row.
 */
export async function upsertArticleTickerSentiment(params: {
    articleId: string;
    tickerId: number;
    tickerSentimentScore?: string | number | null;
    tickerSentimentLabel?: string | null;
    relevanceScore?: string | number | null;
}): Promise<NewsArticleTicker> {
    const articleId = params.articleId;
    const tickerId = params.tickerId;

    // Check existing row
    const existingRows = await db
        .select()
        .from(newsArticleTickers)
        .where(and(eq(newsArticleTickers.articleId, articleId), eq(newsArticleTickers.tickerId, tickerId)));

    if (existingRows.length === 0) {
        // Insert new
        const toInsert: NewNewsArticleTicker = {
            articleId: articleId,
            tickerId: tickerId,
            tickerSentimentScore: params.tickerSentimentScore as any,
            tickerSentimentLabel: params.tickerSentimentLabel as any,
            relevanceScore: params.relevanceScore as any,
        };

        await db.insert(newsArticleTickers).values(toInsert);
    } else {
        // Update existing
        const updateValues: Partial<NewsArticleTicker> = {};

        if (params.tickerSentimentScore !== undefined) {
            updateValues.tickerSentimentScore = params.tickerSentimentScore as any;
        }

        if (params.tickerSentimentLabel !== undefined) {
            updateValues.tickerSentimentLabel = params.tickerSentimentLabel as any;
        }

        if (params.relevanceScore !== undefined) {
            updateValues.relevanceScore = params.relevanceScore as any;
        }

        const keys = Object.keys(updateValues);
        if (keys.length > 0) {
            await db
                .update(newsArticleTickers)
                .set(updateValues)
                .where(and(eq(newsArticleTickers.articleId, articleId), eq(newsArticleTickers.tickerId, tickerId)));
        }
    }

    // Read back and return final row
    const finalRows = await db
        .select()
        .from(newsArticleTickers)
        .where(and(eq(newsArticleTickers.articleId, articleId), eq(newsArticleTickers.tickerId, tickerId)));

    if (finalRows.length === 0) {
        throw new Error("Failed to upsert article ticker sentiment");
    }

    return finalRows[0] as NewsArticleTicker;
}

/**
 * Get sentiments for all tickers on an article
 * @param articleId sha256 digest fo url
 */
export async function getArticleTickerSentiments(articleId: string): Promise<(NewsArticleTicker & { symbol: string })[]> {
    const rows = await db
        .select({
            articleId: newsArticleTickers.articleId,
            tickerId: newsArticleTickers.tickerId,
            tickerSentimentScore: newsArticleTickers.tickerSentimentScore,
            tickerSentimentLabel: newsArticleTickers.tickerSentimentLabel,
            relevanceScore: newsArticleTickers.relevanceScore,
            symbol: tickers.symbol,
        })
        .from(newsArticleTickers)
        .innerJoin(tickers, eq(newsArticleTickers.tickerId, tickers.tickerId))
        .where(eq(newsArticleTickers.articleId, articleId));

    return rows as (NewsArticleTicker & { symbol: string })[];
}

/**
 * Get all articles along with their associated ticker sentiments
 * @param tickerSymbol Optional ticker symbol to filter articles by
 */
export async function getAllArticlesWithTickerSentiments(tickerSymbol?: string | null): Promise<any[]> {
    let articlesRaw: any[];

    if (tickerSymbol) {
        const ticker = await getTickerBySymbol(tickerSymbol);

        if (ticker === null) {
            return [];
        }

        const tickerId = ticker.tickerId;

        // join to filter articles that have this ticker
        const rows = await db
            .select({
                articleId: newsArticles.articleId,
                url: newsArticles.url,
                title: newsArticles.title,
                summary: newsArticles.summary,
                publishedAt: newsArticles.publishedAt,
            })
            .from(newsArticles)
            .innerJoin(newsArticleTickers, eq(newsArticles.articleId, newsArticleTickers.articleId))
            .where(eq(newsArticleTickers.tickerId, tickerId))
            .orderBy(newsArticles.publishedAt);

        // dedupe articles (join may produce duplicates)
        const map: Record<string, any> = {};
        for (const r of rows) {
            map[r.articleId] = r;
        }
        articlesRaw = Object.values(map);
    } else {
        // no filter: return all articles
        articlesRaw = await db
            .select({
                articleId: newsArticles.articleId,
                url: newsArticles.url,
                title: newsArticles.title,
                summary: newsArticles.summary,
                publishedAt: newsArticles.publishedAt,
            })
            .from(newsArticles)
            .orderBy(newsArticles.publishedAt);
    }

    // for each article, fetch all related ticker sentiments (includes symbol as well as id)
    const results = await Promise.all(
        articlesRaw.map(async (a: any) => {
            const tickers = await getArticleTickerSentiments(a.articleId);
            return {
                ...a,
                tickers,
            };
        })
    );

    return results;
}