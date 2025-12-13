/**
 * This file will contain all the routes for the application.
 * **/
import {Hono} from "hono";
import type {AppEnv} from "../config/app-env.ts";

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

export default routes;