import express, { type Request, type Response } from "express";
import {
    createTicker,
    getTickerIdBySymbol,
    addUserWatchlist,
    removeUserWatchlist,
    getUserById,
    getUserWatchlistTickers,
    setUserNotifications, createUser,
} from "../../db/db_api.js";
import type {NewTicker, NewUser} from "../../db/schema.js";

const userRouter = express.Router();
/**
 * Register a new user
 * POST /register
 * body: { userId: string, email: string, username?: string }
 */
userRouter.post("/register", async (req: Request, res: Response) => {
    const { userId, email, username } = req.body;

    if (typeof userId !== "string" || userId.trim() === "") {
        return res.status(400).json({ error: "Missing or invalid userId" });
    }

    if (typeof email !== "string" || email.trim() === "") {
        return res.status(400).json({ error: "Missing or invalid email" });
    }

    const normalizedUserId = userId.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (username !== undefined && typeof username !== "string") {
        return res.status(400).json({ error: "username must be a string" });
    }

    try {
        // avoid duplicate userId
        const existing = await getUserById(normalizedUserId);
        if (existing) {
            return res.status(409).json({ error: "User already exists" });
        }

        const newUser: NewUser = {
            userId: normalizedUserId,
            email: normalizedEmail,
            username: username?.trim() || undefined,
            // notificationEnabled, createdAt, updatedAt are handled by DB defaults
        };

        const created = await createUser(newUser);
        return res.status(201).json(created);
    } catch (err: any) {
        // handle DB unique constraint on email (or other DB errors)
        if (err?.message && /unique|duplicate|constraint/i.test(err.message)) {
            return res.status(409).json({ error: "Email already in use" });
        }
        return res.status(500).json({ error: err?.message ?? "Failed to create user" });
    }
});

/**
 * Toggle global notifications for a user
 * PATCH /:userId/notifications
 * body: { enabled: boolean }
 */
userRouter.patch("/:userId/notifications", async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const { enabled } = req.body;

    if (typeof userId !== "string" || userId.trim() === "") {
        return res.status(400).json({ error: "Invalid userId" });
    }
    if (typeof enabled !== "boolean") {
        return res.status(400).json({ error: "enabled must be boolean" });
    }

    try {
        const user = await getUserById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const ok = await (async () => {
            return await setUserNotifications(userId, enabled);
        })();

        return res.json({ success: !!ok });
    } catch (error: any) {
        return res.status(500).json({ error: error?.message ?? "Failed to set notifications" });
    }
});

/**
 * Add ticker to user's watchlist (create ticker if missing)
 * POST /:userId/watchlist
 * body: { symbol: string, type?: "stock" | "crypto", notificationEnabled?: boolean }
 */
userRouter.post("/:userId/watchlist", async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const { symbol, type, notificationEnabled } = req.body;

    if (typeof userId !== "string" || userId.trim() === "") {
        return res.status(400).json({ error: "Invalid userId" });
    }
    if (typeof symbol !== "string" || symbol.trim() === "") {
        return res.status(400).json({ error: "Invalid symbol" });
    }
    const normalizedSymbol = symbol.trim();

    try {
        const user = await getUserById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        let tickerId = await getTickerIdBySymbol(normalizedSymbol);
        if (tickerId === null) {
            // need type to create ticker
            if (type !== "stock" && type !== "crypto") {
                return res.status(400).json({ error: "Ticker not found; provide type as 'stock' or 'crypto' to create it" });
            }
            const newTicker: NewTicker = { symbol: normalizedSymbol, type };
            const created = await createTicker(newTicker);
            tickerId = created.tickerId;
        }

        const toInsert = {
            userId,
            tickerId,
            notificationEnabled: typeof notificationEnabled === "boolean" ? notificationEnabled : true,
        };

        try {
            const row = await addUserWatchlist(toInsert);
            return res.status(201).json(row);
        } catch (err: any) {
            // likely unique constraint (already in watchlist)
            if (err?.message && /unique|duplicate/i.test(err.message)) {
                return res.status(409).json({ error: "Ticker already in watchlist" });
            }
            throw err;
        }
    } catch (error: any) {
        return res.status(500).json({ error: error?.message ?? "Failed to add to watchlist" });
    }
});

/**
 * Set per-ticker watchlist notifications
 * Creates ticker/watchlist entry if missing
 * PATCH /:userId/watchlist/:symbol/notifications
 * body: {
 *  enabled: boolean,
 *  type?: "stock" | "crypto"  (we should leverage the vantage api for getting types).
 * }
 */
userRouter.patch("/:userId/watchlist/:symbol/notifications", async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const symbol = req.params.symbol;
    const { enabled, type } = req.body;

    if (typeof userId !== "string" || userId.trim() === "") {
        return res.status(400).json({ error: "Invalid userId" });
    }
    if (typeof symbol !== "string" || symbol.trim() === "") {
        return res.status(400).json({ error: "Invalid symbol" });
    }
    if (typeof enabled !== "boolean") {
        return res.status(400).json({ error: "enabled must be boolean" });
    }

    const normalizedSymbol = symbol.trim();

    try {
        const user = await getUserById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        let tickerId = await getTickerIdBySymbol(normalizedSymbol);
        if (tickerId === null) {
            if (type !== "stock" && type !== "crypto") {
                return res.status(400).json({ error: "Ticker not found; provide type as 'stock' or 'crypto' to create it" });
            }
            const created = await createTicker({ symbol: normalizedSymbol, type });
            tickerId = created.tickerId;
        }

        // remove any existing watchlist entry then re-add with requested enabled flag
        try {
            await removeUserWatchlist(userId, tickerId);
        } catch {
            // ignore remove errors and proceed to add
        }

        try {
            const row = await addUserWatchlist({ userId, tickerId, notificationEnabled: enabled });
            return res.json(row);
        } catch (err: any) {
            // if add failed due to unique constraint (unlikely after remove), return conflict
            if (err?.message && /unique|duplicate/i.test(err.message)) {
                return res.status(409).json({ error: "Watchlist entry already exists" });
            }
            throw err;
        }
    } catch (error: any) {
        return res.status(500).json({ error: error?.message ?? "Failed to set watchlist notification" });
    }
});

/**
 * Remove ticker from user's watchlist
 * DELETE /:userId/watchlist/:symbol
 */
userRouter.delete("/:userId/watchlist/:symbol", async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const symbol = req.params.symbol;

    if (typeof userId !== "string" || userId.trim() === "") {
        return res.status(400).json({ error: "Invalid userId" });
    }
    if (typeof symbol !== "string" || symbol.trim() === "") {
        return res.status(400).json({ error: "Invalid symbol" });
    }

    const normalizedSymbol = symbol.trim();

    try {
        const user = await getUserById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const tickerId = await getTickerIdBySymbol(normalizedSymbol);
        if (tickerId === null) {
            return res.status(404).json({ error: "Ticker not found" });
        }

        const removed = await removeUserWatchlist(userId, tickerId);
        if (removed) {
            return res.json({ success: true });
        }
        return res.status(404).json({ error: "Watchlist entry not found" });
    } catch (error: any) {
        return res.status(500).json({ error: error?.message ?? "Failed to remove watchlist entry" });
    }
});

/**
 * Get all tickers in a user's watchlist
 * GET /:userId/watchlist
 */
userRouter.get("/:userId/watchlist", async (req: Request, res: Response) => {
    const userId = req.params.userId;

    if (typeof userId !== "string" || userId.trim() === "") {
        return res.status(400).json({ error: "Invalid userId" });
    }

    try {
        const user = await getUserById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const tickers = await getUserWatchlistTickers(userId);
        return res.json(tickers);
    } catch (error: any) {
        return res.status(500).json({ error: error?.message ?? "Failed to get watchlist" });
    }
});

export default userRouter;
