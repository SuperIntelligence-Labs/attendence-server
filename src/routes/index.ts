/**
 * This file will contain all the routes for the application.
 */
import {Hono} from "hono";
import {err} from "neverthrow";
import type {AppEnv} from "../config/app-env.ts";
import {TelegramUpdateSchema} from "../schema/telegram.ts";
import {type BotConfig, processUpdate} from "../service/bot-handlers.ts";
import {timingSafeEqual} from "../utils/crypto.ts";
import {BadRequestError, InternalServerError, UnauthorizedError, ValidationError} from "../utils/error/errors.ts";
import {handleResult} from "../utils/error/response-handler.ts";
import logger from "../utils/logger.ts";

const MAX_REQUEST_SIZE = 100 * 1024; // 100KB

const routes = new Hono<AppEnv>();

// Health check endpoint
routes.get("/", (c) => {
    return c.json({
        status: "healthy",
        message: "API is running successfully",
        timestamp: new Date().toISOString(),
        version: "1.0.0"
    });
});

// Telegram webhook endpoint
routes.post("/telegram/webhook", async (c) => {
    // Check request size to prevent memory exhaustion
    const contentLength = c.req.header("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_REQUEST_SIZE) {
        logger.warn(`Request too large: ${contentLength} bytes`);
        return handleResult(err(new BadRequestError("Request body too large")));
    }

    // Validate webhook secret using constant-time comparison
    const secret = c.req.header("X-Telegram-Bot-Api-Secret-Token") ?? "";
    const webhookSecret = c.env.TELEGRAM_WEBHOOK_SECRET;

    if (!timingSafeEqual(secret, webhookSecret)) {
        logger.warn("Invalid webhook secret attempted");
        return handleResult(err(new UnauthorizedError("Invalid webhook secret")));
    }

    // Parse JSON body with error handling
    let body: unknown;
    try {
        body = await c.req.json();
    } catch {
        logger.error("Failed to parse JSON body");
        return handleResult(err(new ValidationError("Invalid JSON body")));
    }

    // Validate against Telegram schema
    const parseResult = TelegramUpdateSchema.safeParse(body);
    if (!parseResult.success) {
        logger.error("Invalid Telegram update payload", parseResult.error);
        return handleResult(err(new ValidationError("Invalid Telegram update payload")));
    }

    // Validate required environment variables
    const {TELEGRAM_BOT_TOKEN, APP_DOWNLOAD_URL, PAYMENT_URL, SUPPORT_CONTACT, PREMIUM_PRICE} = c.env;
    if (!TELEGRAM_BOT_TOKEN || !APP_DOWNLOAD_URL || !PAYMENT_URL || !SUPPORT_CONTACT || !PREMIUM_PRICE) {
        logger.error("Missing required environment variables");
        return handleResult(err(new InternalServerError("Server configuration error")));
    }

    // Build bot config from environment
    const config: BotConfig = {
        botToken: TELEGRAM_BOT_TOKEN,
        appDownloadUrl: APP_DOWNLOAD_URL,
        paymentUrl: PAYMENT_URL,
        supportContact: SUPPORT_CONTACT,
        premiumPrice: PREMIUM_PRICE
    };

    const result = await processUpdate(parseResult.data, config);

    return handleResult(result);
});

export default routes;