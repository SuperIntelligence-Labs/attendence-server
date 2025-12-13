import { ok, err, Result } from "neverthrow";
import { NotFoundError, UnauthorizedError } from "../utils/error/errors.ts";
import logger from "../utils/logger.ts";

/**
 * Simulates performing an action in the system.
 *
 * @returns Result containing either a success message or a specific error
 */
function performAction(
    action: string,
    isUserLoggedIn: boolean
): Result<string, NotFoundError | UnauthorizedError> {
    if (!isUserLoggedIn) {
        return err(new UnauthorizedError("User must log in to perform this action"));
    }

    if (action === "deleteNonExistent") {
        return err(new NotFoundError("The item you are trying to delete does not exist"));
    }

    return ok("Action performed successfully!");
}

// --- Example Usage ---
// Call runExample() to execute the example

export function runExample(): void {
    const actionResult = performAction("deleteNonExistent", false);

    // Handle the result and check error types
    actionResult.match(
        (successMessage) => {
            // Success case
            logger.info(`Success: ${successMessage}`);
        },
        (error) => {
            // Error case - check type of error
            if (error instanceof UnauthorizedError) {
                logger.error(`Unauthorized Error: ${error.message}`);
                // Additional handling for unauthorized errors can go here
            } else {
                logger.error(`Not Found Error: ${error.message}`);
            }
        }
    );
}
