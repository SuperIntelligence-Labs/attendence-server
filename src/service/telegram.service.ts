import {err, ok, type Result} from "neverthrow";
import {InternalServerError} from "../utils/error/errors.ts";
import logger from "../utils/logger.ts";

const TELEGRAM_API_BASE = "https://api.telegram.org/bot";

// Inline keyboard button types
export interface InlineKeyboardButton {
    text: string;
    callback_data?: string;
    url?: string;
}

export type InlineKeyboardMarkup = {
    inline_keyboard: InlineKeyboardButton[][];
};

interface SendMessageParams {
    chat_id: number;
    text: string;
    parse_mode?: "HTML" | "Markdown" | "MarkdownV2";
    reply_markup?: InlineKeyboardMarkup;
}

interface EditMessageParams {
    chat_id: number;
    message_id: number;
    text: string;
    parse_mode?: "HTML" | "Markdown" | "MarkdownV2";
    reply_markup?: InlineKeyboardMarkup;
}

interface AnswerCallbackParams {
    callback_query_id: string;
    text?: string;
    show_alert?: boolean;
}

/**
 * Generic Telegram API call helper
 */
async function callTelegramApi<T>(
    botToken: string,
    method: string,
    params: T
): Promise<Result<boolean, InternalServerError>> {
    const url = `${TELEGRAM_API_BASE}${botToken}/${method}`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(params)
        });

        if (!response.ok) {
            // Log only status code without full response body to avoid sensitive data exposure
            logger.error(`Telegram API error (${method}): ${response.status}`);
            return err(new InternalServerError(`Telegram API error: ${response.status}`));
        }

        return ok(true);
    } catch (error) {
        logger.error(`Failed to call Telegram API (${method})`, error);
        return err(new InternalServerError(`Failed to call Telegram API: ${method}`));
    }
}

/**
 * Sends a message to a Telegram chat with optional inline keyboard.
 * @param botToken - The Telegram bot API token
 * @param chatId - The target chat ID
 * @param text - The message text (HTML format supported)
 * @param keyboard - Optional inline keyboard markup
 * @returns Result indicating success or error
 */
export async function sendMessage(
    botToken: string,
    chatId: number,
    text: string,
    keyboard?: InlineKeyboardMarkup
): Promise<Result<boolean, InternalServerError>> {
    const params: SendMessageParams = {
        chat_id: chatId,
        text,
        parse_mode: "HTML"
    };

    if (keyboard) {
        params.reply_markup = keyboard;
    }

    return callTelegramApi(botToken, "sendMessage", params);
}

/**
 * Edits an existing message in a Telegram chat.
 * @param botToken - The Telegram bot API token
 * @param chatId - The chat ID containing the message
 * @param messageId - The message ID to edit
 * @param text - The new message text (HTML format supported)
 * @param keyboard - Optional inline keyboard markup
 * @returns Result indicating success or error
 */
export async function editMessage(
    botToken: string,
    chatId: number,
    messageId: number,
    text: string,
    keyboard?: InlineKeyboardMarkup
): Promise<Result<boolean, InternalServerError>> {
    const params: EditMessageParams = {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: "HTML"
    };

    if (keyboard) {
        params.reply_markup = keyboard;
    }

    return callTelegramApi(botToken, "editMessageText", params);
}

/**
 * Answers a callback query to acknowledge an inline keyboard button press.
 * @param botToken - The Telegram bot API token
 * @param callbackQueryId - The callback query ID to answer
 * @param text - Optional notification text to show
 * @param showAlert - If true, shows an alert instead of a toast
 * @returns Result indicating success or error
 */
export async function answerCallback(
    botToken: string,
    callbackQueryId: string,
    text?: string,
    showAlert?: boolean
): Promise<Result<boolean, InternalServerError>> {
    const params: AnswerCallbackParams = {
        callback_query_id: callbackQueryId
    };

    if (text) {
        params.text = text;
        params.show_alert = showAlert ?? false;
    }

    return callTelegramApi(botToken, "answerCallbackQuery", params);
}
