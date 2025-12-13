# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Attendance server built as a Cloudflare Worker using Hono framework with Bun runtime. TypeScript-first with strict type checking.

## Commands

```sh
bun install          # Install dependencies
bun run dev          # Run local dev server (Wrangler)
bun run deploy       # Deploy to Cloudflare (requires CLOUDFLARE_API_TOKEN)
bun run typecheck    # Run TypeScript type checking
bun run cf-typegen   # Generate Cloudflare binding types
```

## Architecture

### Entry Points
- `src/index.ts` - Cloudflare Worker entry point, exports the Hono app
- `src/app.ts` - Main Hono app setup with middleware and route mounting

### Routes
- `src/routes/index.ts` - Route definitions, uses `AppEnv` type for Hono context

### Configuration
- `src/config/app-env.ts` - Defines `AppEnv` interface for Cloudflare bindings and context variables
- `worker-configuration.d.ts` - Auto-generated Cloudflare bindings types (use `bun run cf-typegen`)

### Error Handling (neverthrow pattern)
The codebase uses `neverthrow` for Result-based error handling:

- `src/utils/error/errors.ts` - Custom error classes extending `AppError` base class
- `src/utils/error/response-handler.ts` - `handleResult()` converts `Result<T, AppError>` to HTTP Response
- `src/utils/error/error-mapper.ts` - Maps error types to HTTP status codes
- `src/utils/error/response.ts` - Standardized JSON response format (`SuccessResponse`/`ErrorResponse`)

Return `Result<T, AppError>` from handlers and use `handleResult()` to convert to Response.

### HTTP Client
- `src/utils/http/http-client.ts` - HTTP client with cookie jar support for making external requests
- `src/utils/http/cookie-jar.ts` - Cookie management for HTTP client
- `src/utils/api-validator.ts` - Maps external API HTTP errors to `AppError` types

### Logging
- `src/utils/logger.ts` - tslog-based logger instance, import as default

## Key Patterns

- All route handlers should use the `AppEnv` type: `new Hono<AppEnv>()`
- Use `err()` and `ok()` from neverthrow to wrap results
- Explicit return types required (ESLint rule)
- Double quotes for strings, semicolons required
