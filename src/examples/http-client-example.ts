import {Hono} from "hono";
import {createHttpClient} from "../utils/http/http-client.ts";
import type {AppEnv} from "../config/app-env.ts";
import {handleResult} from "../utils/error/response-handler.ts";
import validateApiError from "../utils/api-validator.ts";
import {ok} from "neverthrow";

const app = new Hono<AppEnv>();

// Example route demonstrating HTTP client usage with proper error handling
app.get("/profile", async (c) => {
    const client = createHttpClient();

    // Login request with error handling
    const loginRes = await client.post(
        "https://example.com/api/login",
        {
            username: c.req.query("username") ?? "",
            password: c.req.query("password") ?? "",
        }
    );

    if (!loginRes.ok) {
        return handleResult(validateApiError(loginRes, "Login failed"));
    }

    // Fetch profile with error handling
    const profileRes = await client.get(
        "https://example.com/api/user/profile",
        {
            "User-Agent": "MyWorkerClient/1.0",
        }
    );

    if (!profileRes.ok) {
        return handleResult(validateApiError(profileRes, "Failed to fetch profile"));
    }

    const profile = await profileRes.json();

    // Update profile with error handling
    const updateRes = await client.submitForm(
        "https://example.com/api/update",
        {name: "Aman", city: "Delhi"}
    );

    if (!updateRes.ok) {
        return handleResult(validateApiError(updateRes, "Failed to update profile"));
    }

    return handleResult(ok({profile}));
});

export default app;
