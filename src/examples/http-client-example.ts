import {Hono} from "hono";
import {createHttpClient} from "../utils/http/http-client.ts";
import type {AppEnv} from "../config/app-env.ts";
import {handleResult} from "../utils/error/response-handler.ts";
import validateApiError from "../utils/api-validator.ts";
import {err, ok} from "neverthrow";

const app = new Hono<AppEnv>();

// Example route demonstrating HTTP client usage with proper error handling
app.get("/profile", async (c) => {
    const client = createHttpClient();

    // Login request with error handling
    const loginResult = await client.post(
        "https://example.com/api/login",
        {
            username: c.req.query("username") ?? "",
            password: c.req.query("password") ?? "",
        }
    );

    // Handle HTTP client errors (SSRF blocked, network errors)
    if (loginResult.isErr()) {
        return handleResult(err(loginResult.error));
    }

    const loginRes = loginResult.value;
    if (!loginRes.ok) {
        return handleResult(validateApiError(loginRes, "Login failed"));
    }

    // Fetch profile with error handling
    const profileResult = await client.get(
        "https://example.com/api/user/profile",
        {
            "User-Agent": "MyWorkerClient/1.0",
        }
    );

    if (profileResult.isErr()) {
        return handleResult(err(profileResult.error));
    }

    const profileRes = profileResult.value;
    if (!profileRes.ok) {
        return handleResult(validateApiError(profileRes, "Failed to fetch profile"));
    }

    const profile = await profileRes.json();

    // Update profile with error handling
    const updateResult = await client.submitForm(
        "https://example.com/api/update",
        {name: "Aman", city: "Delhi"}
    );

    if (updateResult.isErr()) {
        return handleResult(err(updateResult.error));
    }

    const updateRes = updateResult.value;
    if (!updateRes.ok) {
        return handleResult(validateApiError(updateRes, "Failed to update profile"));
    }

    return handleResult(ok({profile}));
});

export default app;
