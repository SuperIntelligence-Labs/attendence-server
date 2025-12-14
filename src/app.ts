/**
 * Main entry point for the Hono application.
 * This file sets up the Hono app, applies middlewares, and defines routes.
 * **/
import {Hono} from "hono";
import { logger } from "hono/logger";
import routes from "./routes";
import {NotFoundError} from "./utils/error/errors.ts";
import {handleResult} from "./utils/error/response-handler.ts";
import {err} from "neverthrow";
import type {AppEnv} from "./config/app-env.ts";

const app = new Hono<AppEnv>();

// Middlewares
app.use("*", logger());

// Routes
app.route("/", routes);

// If request does not match to any route, return 404
app.notFound((c) => {
    return handleResult(
        err(new NotFoundError(`Resource '${c.req.path}' not found`))
    );
});


export default app;