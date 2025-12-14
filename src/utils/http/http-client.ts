import {err, ok, type Result} from "neverthrow";
import {BadRequestError, InternalServerError} from "../error/errors.ts";
import {CookieJar} from "./cookie-jar.ts";

export type HttpError = BadRequestError | InternalServerError;

/**
 * Creates an HTTP client with SSRF protection and cookie management.
 * @param defaultHeaders - Optional default headers for all requests
 * @returns Configured HttpClient instance
 */
export function createHttpClient(defaultHeaders?: Record<string, string>): HttpClient {
    return new HttpClient(undefined, defaultHeaders);
}

interface JsonBody {
    [key: string]: unknown;
}

/**
 * Private IP ranges that should be blocked to prevent SSRF attacks.
 */
const PRIVATE_IP_PATTERNS = [
    /^127\./,                           // Loopback
    /^10\./,                            // Class A private
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // Class B private
    /^192\.168\./,                      // Class C private
    /^169\.254\./,                      // Link-local
    /^0\./,                             // Current network
];

const BLOCKED_HOSTNAMES = [
    "localhost",
    "localhost.localdomain",
    "ip6-localhost",
    "ip6-loopback",
    "0.0.0.0",
];

/**
 * IPv6 patterns to block for SSRF prevention
 */
const BLOCKED_IPV6_PATTERNS = [
    /^::1$/,                              // IPv6 loopback
    /^\[::1\]$/,                          // IPv6 loopback bracketed
    /^::ffff:/i,                          // IPv4-mapped IPv6
    /^fc[0-9a-f]{2}:/i,                   // IPv6 ULA (fc00::/7)
    /^fd[0-9a-f]{2}:/i,                   // IPv6 ULA (fc00::/7)
    /^fe80:/i,                            // IPv6 link-local
];

/**
 * Validates a URL to prevent SSRF attacks.
 * Rejects non-HTTP(S) protocols and private IP addresses.
 */
function validateUrl(urlString: string): Result<URL, BadRequestError> {
    let url: URL;
    try {
        url = new URL(urlString);
    } catch {
        return err(new BadRequestError("Invalid URL format"));
    }

    // Only allow HTTP and HTTPS protocols
    if (url.protocol !== "http:" && url.protocol !== "https:") {
        return err(new BadRequestError(`Blocked protocol: ${url.protocol}`));
    }

    const hostname = url.hostname.toLowerCase();

    // Block known localhost aliases
    if (BLOCKED_HOSTNAMES.includes(hostname)) {
        return err(new BadRequestError("Blocked hostname: localhost"));
    }

    // Block private IP ranges
    for (const pattern of PRIVATE_IP_PATTERNS) {
        if (pattern.test(hostname)) {
            return err(new BadRequestError("Blocked: private IP address"));
        }
    }

    // Block dangerous IPv6 addresses
    for (const pattern of BLOCKED_IPV6_PATTERNS) {
        if (pattern.test(hostname)) {
            return err(new BadRequestError("Blocked: private IPv6 address"));
        }
    }

    return ok(url);
}

export class HttpClient {
    private cookieJar: CookieJar;
    private defaultHeaders: Record<string, string>;

    constructor(cookieJar?: CookieJar, defaultHeaders?: Record<string, string>) {
        this.cookieJar = cookieJar || new CookieJar();
        this.defaultHeaders = defaultHeaders || {};
    }

    async request(
        url: string,
        options: RequestInit = {},
        customHeaders?: Record<string, string>
    ): Promise<Result<Response, HttpError>> {
        // Validate URL for SSRF protection
        const urlResult = validateUrl(url);
        if (urlResult.isErr()) {
            return err(urlResult.error);
        }

        const headers = new Headers();

        // 1. Apply default headers first (lowest priority)
        Object.entries(this.defaultHeaders).forEach(([key, value]) => {
            headers.set(key, value);
        });

        // 2. Apply method-specific headers from options (e.g., Content-Type for POST)
        if (options.headers) {
            const optionHeaders = new Headers(options.headers);
            optionHeaders.forEach((value, key) => {
                headers.set(key, value);
            });
        }

        // 3. Apply custom headers last (highest priority, can override everything)
        if (customHeaders) {
            Object.entries(customHeaders).forEach(([key, value]) => {
                headers.set(key, value);
            });
        }

        const cookieHeader = this.cookieJar.getCookieHeader();
        if (cookieHeader) {
            headers.set("Cookie", cookieHeader);
        }

        try {
            const res = await fetch(url, { ...options, headers });

            // Use getSetCookie() to properly handle multiple Set-Cookie headers
            const setCookies = res.headers.getSetCookie();
            if (setCookies.length > 0) this.cookieJar.setCookies(setCookies);

            return ok(res);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Network request failed";
            return err(new InternalServerError(message));
        }
    }

    async get(
        url: string,
        headers?: Record<string, string>
    ): Promise<Result<Response, HttpError>> {
        return this.request(url, { method: "GET" }, headers);
    }

    async post(
        url: string,
        body: JsonBody,
        headers?: Record<string, string>
    ): Promise<Result<Response, HttpError>> {
        return this.request(
            url,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            },
            headers
        );
    }

    async submitForm(
        url: string,
        formData: Record<string, string>,
        headers?: Record<string, string>
    ): Promise<Result<Response, HttpError>> {
        const body = new URLSearchParams(formData).toString();
        return this.request(
            url,
            {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body,
            },
            headers
        );
    }
}