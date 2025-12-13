import {
    AppError,
    NotFoundError,
    UnauthorizedError,
    ForbiddenError,
    ValidationError,
    ConflictError,
    TimeoutError,
    InternalServerError,
    DatabaseError,
    AuthenticationError, BadRequestError, ServiceUnavailableError,
} from "./errors";

export function mapErrorToStatus(error: AppError): number {
    if (error instanceof NotFoundError) return 404;
    if (error instanceof UnauthorizedError || error instanceof AuthenticationError) return 401;
    if (error instanceof ForbiddenError) return 403;
    if (error instanceof ValidationError) return 400;
    if (error instanceof ConflictError) return 409;
    if (error instanceof TimeoutError) return 408;
    if (error instanceof DatabaseError) return 500;
    if (error instanceof InternalServerError) return 500;
    if (error instanceof BadRequestError) return 400;
    if (error instanceof ServiceUnavailableError) return 503;
    // fallback
    return 500;
}