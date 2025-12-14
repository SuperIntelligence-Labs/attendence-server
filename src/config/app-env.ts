/**
 * Hono app environment configuration.
 * Extends CloudflareBindings with secrets that aren't in wrangler.jsonc vars.
 */
export interface AppEnv {
    Bindings: CloudflareBindings & {
        // Secrets set via `wrangler secret put` (not in generated types)
        TELEGRAM_BOT_TOKEN: string
        TELEGRAM_WEBHOOK_SECRET: string
    }
    Variables: {
        // Context variables set by middleware
    }
}
