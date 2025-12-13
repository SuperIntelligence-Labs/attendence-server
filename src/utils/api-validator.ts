import {err, Result} from "neverthrow";
import {
    type AppError,
    BadRequestError,
    ForbiddenError,
    NotFoundError,
    UnauthorizedError, InternalServerError, ServiceUnavailableError, TimeoutError
} from "./error/errors.ts";
import logger from "./logger.ts";

function validateApiError(
    response: Response,
    message: string
): Result<never, AppError> {
    logger.error(`${message}: ${response.status} ${response.statusText}`);

    switch (response.status) {
        case 400:
            return err(new BadRequestError("Invalid request sent to the server"));
        case 401:
            return err(new UnauthorizedError("Authentication required or invalid credentials"));
        case 403:
            return err(new ForbiddenError("You don’t have permission to access this resource"));
        case 404:
            return err(new NotFoundError("Requested resource not found"));
        case 408:
            return err(new TimeoutError("Your request timed out"));
        case 500:
            return err(new InternalServerError("Server encountered an error"));
        case 503:
            return err(new ServiceUnavailableError("Service is temporarily unavailable"));
        case 504:
            return err(new TimeoutError("Gateway timed out while processing the request"));
        default:
            return err(
                new InternalServerError(
                    `Unexpected error: ${response.status} ${response.statusText}`
                )
            );
    }
}

export default validateApiError;