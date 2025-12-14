import {z} from "zod";

export const TelegramUserSchema = z.object({
    id: z.number(),
    is_bot: z.boolean(),
    first_name: z.string(),
    last_name: z.string().optional(),
    username: z.string().optional()
});

export const TelegramChatSchema = z.object({
    id: z.number(),
    type: z.enum(["private", "group", "supergroup", "channel"]),
    title: z.string().optional(),
    username: z.string().optional(),
    first_name: z.string().optional(),
    last_name: z.string().optional()
});

export const TelegramMessageSchema = z.object({
    message_id: z.number(),
    from: TelegramUserSchema.optional(),
    chat: TelegramChatSchema,
    date: z.number(),
    text: z.string().optional()
});

// Callback query from inline keyboard button press
export const TelegramCallbackQuerySchema = z.object({
    id: z.string(),
    from: TelegramUserSchema,
    message: TelegramMessageSchema.optional(),
    chat_instance: z.string(),
    data: z.string().optional()
});

export const TelegramUpdateSchema = z.object({
    update_id: z.number(),
    message: TelegramMessageSchema.optional(),
    edited_message: TelegramMessageSchema.optional(),
    callback_query: TelegramCallbackQuerySchema.optional()
});

export type TelegramUser = z.infer<typeof TelegramUserSchema>;
export type TelegramChat = z.infer<typeof TelegramChatSchema>;
export type TelegramMessage = z.infer<typeof TelegramMessageSchema>;
export type TelegramCallbackQuery = z.infer<typeof TelegramCallbackQuerySchema>;
export type TelegramUpdate = z.infer<typeof TelegramUpdateSchema>;
