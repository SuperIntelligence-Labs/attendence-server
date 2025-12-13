import {Hono} from "hono";
import {createHttpClient} from "../utils/http/http-client.ts";

const app = new Hono();

app.get("/profile", async (c) => {
    const client = createHttpClient();

    await client.post(
        "https://example.com/api/login",
        {
            username: "user1",
            password: "password123",
        }
    );

    const profileRes = await client.get(
        "https://example.com/api/user/profile",
        {
            "User-Agent": "MyWorkerClient/1.0",
        }
    );
    const profile = await profileRes.json();

    await client.submitForm(
        "https://example.com/api/update",
        {name: "Aman", city: "Delhi"}
    );

    return c.json({profile});
});
