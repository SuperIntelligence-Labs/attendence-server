import {err, ok, type Result} from "neverthrow";
import type {TelegramCallbackQuery, TelegramMessage, TelegramUpdate} from "../schema/telegram.ts";
import {InternalServerError} from "../utils/error/errors.ts";
import logger from "../utils/logger.ts";
import {
    answerCallback,
    editMessage,
    type InlineKeyboardMarkup,
    sendMessage
} from "./telegram.service.ts";

// Bot configuration from environment
export interface BotConfig {
    botToken: string;
    appDownloadUrl: string;
    paymentUrl: string;
    supportContact: string;
    premiumPrice: string;
}

// Message templates
interface BotMessages {
    welcome: string;
    trialDetails: string;
    premiumDetails: string;
    trialActivated: string;
    status: string;
    help: string;
    noFingerprint: string;
}

// Helper functions

/**
 * Escapes HTML special characters to prevent injection in Telegram messages.
 */
function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function formatDate(date: Date): string {
    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

// Keyboards
const MAIN_KEYBOARD: InlineKeyboardMarkup = {
    inline_keyboard: [
        [
            {text: "\u{1F381} Trial", callback_data: "view_trial"},
            {text: "\u{1F48E} Premium", callback_data: "view_premium"}
        ],
        [{text: "\u{1F4CA} Status", callback_data: "view_status"}]
    ]
};

const TRIAL_KEYBOARD: InlineKeyboardMarkup = {
    inline_keyboard: [
        [{text: "\u2705 Start Free Trial", callback_data: "trial_start"}],
        [{text: "\u00AB Back", callback_data: "back_main"}]
    ]
};

const BACK_KEYBOARD: InlineKeyboardMarkup = {
    inline_keyboard: [[{text: "\u00AB Back", callback_data: "back_main"}]]
};

// Dynamic keyboards that depend on config
function getPremiumKeyboard(config: BotConfig): InlineKeyboardMarkup {
    const price = escapeHtml(config.premiumPrice);
    return {
        inline_keyboard: [
            [{text: `\u{1F4B3} Pay \u20B9${price}`, url: config.paymentUrl}],
            [{text: "\u00AB Back", callback_data: "back_main"}]
        ]
    };
}

function getAppDownloadKeyboard(config: BotConfig): InlineKeyboardMarkup {
    return {
        inline_keyboard: [[{text: "\u{1F4E5} Download App", url: config.appDownloadUrl}]]
    };
}

// Dynamic messages that depend on config
function getMessages(config: BotConfig): BotMessages {
    // Escape config values to prevent HTML injection
    const price = escapeHtml(config.premiumPrice);
    const support = escapeHtml(config.supportContact);

    return {
        welcome: `<b>\u{1F44B} Welcome to Pro ABAS</b>
<i>Mark attendance from anywhere</i>

\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

<b>\u{1F381} Trial Plan</b> \u2014 FREE
\u2022 7 days full access
\u2022 Mark attendance from anywhere
\u2022 No mock location needed

<b>\u{1F48E} Premium Plan</b> \u2014 \u20B9${price}
\u2022 30 days full access
\u2022 Mark attendance from anywhere
\u2022 No mock location needed

\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

Select a plan to view details:`,

        trialDetails: `<b>\u{1F381} Trial Plan</b>

\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

\u{1F4C5} <b>Duration:</b> 7 Days
\u{1F4B0} <b>Price:</b> FREE

\u2705 <b>Features:</b>
\u2022 Mark attendance from anywhere
\u2022 No mock location app needed
\u2022 Quick & easy one-tap marking
\u2022 All features unlocked

\u26A0\uFE0F <b>Limitations:</b>
\u2022 One-time use per account

\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

Ready to try Pro ABAS?`,

        premiumDetails: `<b>\u{1F48E} Premium Plan</b>

\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

\u{1F4C5} <b>Duration:</b> 30 Days
\u{1F4B0} <b>Price:</b> \u20B9${price}

\u2705 <b>Features:</b>
\u2022 Mark attendance from anywhere
\u2022 No mock location app needed
\u2022 Quick & easy one-tap marking
\u2022 All features unlocked
\u2022 Renewable anytime

\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

Get full access to Pro ABAS!`,

        trialActivated: `<b>\u2705 Trial Activated!</b>

\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

<b>Plan:</b> 7-Day Trial
<b>Status:</b> Active
<b>Expires:</b> ${formatDate(addDays(new Date(), 7))}

\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

Enjoy Pro ABAS! \u{1F680}`,

        status: `<b>\u{1F4CA} Subscription Status</b>

\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

<b>Plan:</b> None
<b>Status:</b> Inactive
<b>Expires:</b> \u2014

\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

Select a plan from the main menu to get started.`,

        help: `<b>\u2753 Help</b>

<b>Commands:</b>
/start \u2014 View plans & subscribe
/status \u2014 Check subscription

<b>Support:</b> ${support}`,

        noFingerprint: `<b>\u{1F44B} Welcome to Pro ABAS</b>
<i>Mark location from anywhere</i>

\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

\u{1F4CD} Mark attendance from anywhere
\u2705 No mock location needed
\u26A1 Quick one-tap marking

\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

\u{1F4F2} <b>Get Started</b>

1. Download the Pro ABAS app
2. Open the app
3. Tap "Get License" button

This will link your device automatically.`
    };
}

/**
 * Processes incoming Telegram webhook updates and routes them to appropriate handlers.
 * @param update - The Telegram update object from webhook
 * @param config - Bot configuration including tokens and URLs
 * @returns Result indicating success or error
 */
export async function processUpdate(
    update: TelegramUpdate,
    config: BotConfig
): Promise<Result<boolean, InternalServerError>> {
    // Handle callback queries (button presses)
    if (update.callback_query) {
        return handleCallbackQuery(update.callback_query, config);
    }

    // Handle messages
    const message = update.message ?? update.edited_message;
    if (message?.text) {
        return handleMessage(message, config);
    }

    logger.info("Update has no actionable content, skipping");
    return ok(true);
}

/**
 * Handle text messages and commands
 */
async function handleMessage(
    message: TelegramMessage,
    config: BotConfig
): Promise<Result<boolean, InternalServerError>> {
    const chatId = message.chat.id;
    const text = message.text?.trim().toLowerCase() ?? "";
    const messages = getMessages(config);
    const appDownloadKeyboard = getAppDownloadKeyboard(config);

    logger.info(`Message from ${chatId}`);

    // Handle commands
    const command = text.split(" ")[0];

    switch (command) {
        case "/start": {
            // Extract fingerprint parameter after /start
            const fingerprint = text.split(" ")[1];

            if (!fingerprint) {
                // No fingerprint - direct access, redirect to app
                return sendMessage(config.botToken, chatId, messages.noFingerprint, appDownloadKeyboard);
            }

            // Has fingerprint - show normal welcome
            // (fingerprint handling/storage to be added later)
            logger.info("Device linked via fingerprint");
            return sendMessage(config.botToken, chatId, messages.welcome, MAIN_KEYBOARD);
        }

        case "/plans":
            return sendMessage(config.botToken, chatId, messages.welcome, MAIN_KEYBOARD);

        case "/status":
            return sendMessage(config.botToken, chatId, messages.status, MAIN_KEYBOARD);

        case "/help":
            return sendMessage(config.botToken, chatId, messages.help, MAIN_KEYBOARD);

        default:
            // Any other message without fingerprint - redirect to app
            return sendMessage(config.botToken, chatId, messages.noFingerprint, appDownloadKeyboard);
    }
}

/**
 * Handle callback queries from inline keyboard buttons
 */
async function handleCallbackQuery(
    query: TelegramCallbackQuery,
    config: BotConfig
): Promise<Result<boolean, InternalServerError>> {
    const chatId = query.message?.chat.id;
    const messageId = query.message?.message_id;
    const data = query.data ?? "";
    const messages = getMessages(config);
    const premiumKeyboard = getPremiumKeyboard(config);

    logger.info(`Callback from user ${query.from.id}`);

    // Always answer the callback to remove loading state
    const answerResult = await answerCallback(config.botToken, query.id);
    if (answerResult.isErr()) {
        logger.warn("Failed to answer callback query");
    }

    if (!chatId || !messageId) {
        logger.warn("Callback query without message context");
        return err(new InternalServerError("Missing callback message context"));
    }

    switch (data) {
        case "view_trial":
            return editMessage(config.botToken, chatId, messageId, messages.trialDetails, TRIAL_KEYBOARD);

        case "view_premium":
            return editMessage(config.botToken, chatId, messageId, messages.premiumDetails, premiumKeyboard);

        case "view_status":
            return editMessage(config.botToken, chatId, messageId, messages.status, BACK_KEYBOARD);

        case "trial_start":
            // TODO: Actually activate trial when licensing is implemented
            return editMessage(config.botToken, chatId, messageId, messages.trialActivated, BACK_KEYBOARD);

        case "back_main":
            return editMessage(config.botToken, chatId, messageId, messages.welcome, MAIN_KEYBOARD);

        default:
            logger.warn(`Unknown callback data: ${data}`);
            return ok(true);
    }
}
