/**
 * Main entry point for the Hono application.
 * This file sets up the Hono app, applies middlewares, and defines routes.
 * **/
import {Hono} from "hono";
import { logger } from "hono/logger";
import routes from "./routes";
import {NotFoundError, UnauthorizedError} from "./utils/error/errors.ts";
import {handleResult} from "./utils/error/response-handler.ts";
import {err} from "neverthrow";
import type {AppEnv} from "./config/app-env.ts";

const app = new Hono<AppEnv>();

// Middlewares
app.use("*", logger());
// app.use("*", async (c, next) => {
//     // Skip header checks for health endpoint
//     if (c.req.path === "/") {
//         await next();
//         return;
//     }
//
//     const required = ["x-token"];
//
//     for (const h of required) {
//         if (!c.req.header(h)) {
//             return handleResult(
//                 err(new UnauthorizedError(`Missing required header: ${h}`))
//             );
//         }
//     }
//
//     c.set("token", c.req.header("x-wasc")!);
//     await next();
// });

// Routes
app.route("/", routes);

// If request does not match to any route, return 404
app.notFound((c) => {
    return handleResult(
        err(new NotFoundError(`Resource '${c.req.path}' not found`))
    );
});


export default app;