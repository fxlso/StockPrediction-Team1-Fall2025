// File: `src/db/db_api.ts`
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
export async function getUserBySessionToken(sessionToken: string): Promise<User | null> {
    const result = await db.select().from(sessions).innerJoin(
        users,
        eq(sessions.userId, users.userId)
    ).where(
        eq(sessions.sessionId, sessionToken)
    ).limit(1);

    if (result.length === 0) {
        return null;
    }

    return result[0]?.users as User;
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
 * Find ticker by symbol.
 */
export async function getTickerBySymbol(symbol: string): Promise<Ticker | null> {
    const rows = await db
        .select()
        .from(tickers)
        .where(eq(tickers.symbol, symbol));

    if (rows.length === 0) {
        return null;
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
 * @param symbol The ticker symbol
 */
export async function getTickerIdBySymbol(symbol: string): Promise<number | null> {
    const rows = await db
        .select()
        .from(tickers)
        .where(and(eq(tickers.symbol, symbol)));

    if (rows.length === 0) {
        return null;
    }
    return (rows[0] as Ticker).tickerId;
}

/**
 * Add an item to a user's watchlist.
 * Returns the inserted watchlist row (reads back to include DB defaults).
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

/**
 * Upsert (insert-or-update) a record in news_article_tickers.
 * - If a row exists for the (articleId, tickerId) composite key, it updates the sentiment fields.
 * - Otherwise inserts a new row.
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
