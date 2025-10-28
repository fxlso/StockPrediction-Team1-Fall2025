import express, { type Request, type Response } from "express";
import crypto from "crypto";
import { createNewsArticle, getTickerIdBySymbol, upsertArticleTickerSentiment } from "../../db/db_api.js";
import { tickers } from "../../db/schema.js";

const articleRouter = express.Router();

/**
 * Create a new news article
 * Expected body: {
 *  title: string,
 *  url: string,
 *  publishedAt?: string
 * }
 * articleId is sha256(url) hex
 */
articleRouter.post("/", async (req: Request, res: Response) => {
    const { title, url, publishedAt } = req.body;

    if (typeof url !== "string" || url.trim().length === 0) {
        return res.status(400).json({ error: "Missing or invalid url" });
    }

    if (typeof title !== "string" || title.trim().length === 0) {
        return res.status(400).json({ error: "Missing or invalid title" });
    }

    const normalizedUrl = url.trim();
    const normalizedTitle = title.trim();

    // Validate and convert publishedAt (if provided) to a Date
    let publishedAtDate: Date | undefined = undefined;
    if (publishedAt !== undefined) {
        if (typeof publishedAt !== "string") {
            return res.status(400).json({ error: "publishedAt must be a string" });
        }

        // Accept ISO 8601 or compact format YYYYMMDDTHHMMSS (e.g. 20251028T170116)
        const compactRe = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/;
        let parsed: Date;
        const m = publishedAt.match(compactRe);
        if (m) {
            const [, y, mo, d, hh, mm, ss] = m;
            // Construct ISO UTC string (Z) to avoid host-local TZ ambiguity
            const iso = `${y}-${mo}-${d}T${hh}:${mm}:${ss}Z`;
            parsed = new Date(iso);
        } else {
            parsed = new Date(publishedAt);
        }

        if (Number.isNaN(parsed.getTime())) {
            return res.status(400).json({ error: "publishedAt is not a valid date" });
        }
        publishedAtDate = parsed;
    }

    const articleId = crypto.createHash("sha256").update(normalizedUrl).digest("hex");

    const newArticle = {
        articleId: articleId,
        url: normalizedUrl,
        title: normalizedTitle,
        // match schema: Date | undefined
        publishedAt: publishedAtDate,
    };

    try {
        const created = await createNewsArticle(newArticle);
        return res.status(201).json(created);
    } catch (error: any) {
        return res.status(500).json({ error: error?.message ?? "Failed to create article" });
    }
});

/**
 * Upsert sentiment for a ticker on an article
 * Path param: articleId
 * Expected body:
 * {
 *  tickerSymbol: str,
 *  tickerSentimentScore?: string|number|null,
 *  tickerSentimentLabel?: string|null,
 *  relevanceScore?: string|number|null
 * }
 */
articleRouter.post("/:articleId/tickers", async (req: Request, res: Response) => {
    const articleId = req.params.articleId;
    const { tickerSymbol, tickerSentimentScore, tickerSentimentLabel, relevanceScore } = req.body;

    if (typeof tickerSymbol !== "string" || tickerSymbol.trim().length === 0) {
        return res.status(400).json({ error: "Missing or invalid tickerSymbol" });
    }

    const tickerId = await getTickerIdBySymbol(tickerSymbol);

    if (tickerId === null) {
        return res.status(400).json({ error: "Invalid tickerSymbol; ticker not found" });
    }

    if (typeof articleId !== "string" || articleId.length === 0) {
        return res.status(400).json({ error: "Invalid articleId" });
    }

    if (typeof tickerId !== "number" || Number.isNaN(tickerId) || !Number.isInteger(tickerId)) {
        return res.status(400).json({ error: "Invalid tickerId; must be an integer" });
    }

    const params = {
        articleId,
        tickerId,
        tickerSentimentScore:
            tickerSentimentScore === null || tickerSentimentScore === undefined
                ? undefined
                : tickerSentimentScore,
        tickerSentimentLabel:
            tickerSentimentLabel === null || tickerSentimentLabel === undefined
                ? undefined
                : tickerSentimentLabel,
        relevanceScore:
            relevanceScore === null || relevanceScore === undefined ? undefined : relevanceScore,
    };

    try {
        const finalRow = await upsertArticleTickerSentiment(params);
        return res.status(200).json(finalRow);
    } catch (error: any) {
        return res.status(500).json({ error: error?.message ?? "Failed to upsert ticker sentiment" });
    }
});

/**
 * Get articleId by URL
 */
articleRouter.get("/findArticleId/:url", async (req: Request, res: Response) => {
    const url = req.params.url;

    if (typeof url !== "string" || url.trim().length === 0) {
        return res.status(400).json({ error: "Missing or invalid url" });
    }

    const normalizedUrl = url.trim();
    const articleId = crypto.createHash("sha256").update(normalizedUrl).digest("hex");
    return res.json({ articleId });
});

export default articleRouter;