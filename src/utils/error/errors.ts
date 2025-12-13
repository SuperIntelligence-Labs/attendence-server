// Base class for all app errors
export abstract class AppError extends Error {
    protected constructor(public identifier: string, message?: string) {
        super(message || "");
        this.name = this.constructor.name;
    }
}

// General-purpose errors
export class NotFoundError extends AppError {
    constructor(details?: string) {
        super("RESOURCE_NOT_FOUND", details);
    }
}

export class UnauthorizedError extends AppError {
    constructor(details?: string) {
        super("REQUEST_UNAUTHORIZED", details);
    }
}

export class ForbiddenError extends AppError {
    constructor(details?: string) {
        super("REQUEST_FORBIDDEN", details);
    }
}

export class ValidationError extends AppError {
    constructor(details?: string) {
        super("VALIDATION_ERROR", details);
    }
}

export class ConflictError extends AppError {
    constructor(details?: string) {
        super("RESOURCE_CONFLICT", details);
    }
}

export class TimeoutError extends AppError {
    constructor(details?: string) {
        super("CONNECTION_TIMEOUT", details);
    }
}

export class InternalServerError extends AppError {
    constructor(details?: string) {
        super("INTERNAL_SERVER_ERROR", details);
    }
}

export class ServiceUnavailableError extends AppError {
    constructor(details?: string) {
        super("SERVICE_UNAVAILABLE", details);
    }
}

export class BadRequestError extends AppError {
    constructor(details?: string) {
        super("BAD_REQUEST", details);
    }
}

export class DatabaseError extends AppError {
    constructor(details?: string) {
        super("DATABASE_ERROR", details);
    }
}

export class AuthenticationError extends AppError {
    constructor(details?: string) {
        super("AUTH_ERROR", details);
    }
}
