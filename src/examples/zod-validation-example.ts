import {z} from "zod";
import logger from "../utils/logger.ts";

// Define a Zod schema for the expected API response
const UserSchema = z.object({
    id: z.number(),
    name: z.string().default("Unknown User"),
    email: z.string().nullish(),
});

// infer the TypeScript type from the Zod schema
type User = z.infer<typeof UserSchema>;

// Async function to fetch data and validate it
async function fetchUser(userId: number): Promise<User | null> {
    const response = await fetch(`https://jsonplaceholder.typicode.com/users/${userId}`);
    const data = await response.json();

    // Validate the fetched data using Zod
    const parsedResult = UserSchema.safeParse(data);

    if (!parsedResult.success) {
        // If validation fails, we can see the error details
        logger.error("Validation failed:", parsedResult.error);
        return null;
    }

    // If validation succeeds, we can safely use the data
    const user: User = parsedResult.data;
    logger.info("User fetched successfully:", user);
    return user;
}

// --- Example usage ---
const data = await fetchUser(1);
logger.info("User fetched successfully:", data?.name);
