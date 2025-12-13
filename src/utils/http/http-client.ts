import {CookieJar} from "./cookie-jar.ts";

export function createHttpClient(defaultHeaders?: Record<string, string>): HttpClient {
    return new HttpClient(undefined, defaultHeaders);
}

interface JsonBody {
    [key: string]: unknown;
}

export class HttpClient {
    private cookieJar: CookieJar;
    private defaultHeaders: Record<string, string>;

    constructor(cookieJar?: CookieJar, defaultHeaders?: Record<string, string>) {
        this.cookieJar = cookieJar || new CookieJar();
        this.defaultHeaders = defaultHeaders || {};
    }

    async request(url: string, options: RequestInit = {}, customHeaders?: Record<string, string>): Promise<Response> {
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

        const res = await fetch(url, { ...options, headers });

        // Use getSetCookie() to properly handle multiple Set-Cookie headers
        const setCookies = res.headers.getSetCookie();
        if (setCookies.length > 0) this.cookieJar.setCookies(setCookies);

        return res;
    }

    async get(url: string, headers?: Record<string, string>): Promise<Response> {
        return this.request(url, { method: "GET" }, headers);
    }

    async post(url: string, body: JsonBody, headers?: Record<string, string>): Promise<Response> {
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

    async submitForm(url: string, formData: Record<string, string>, headers?: Record<string, string>): Promise<Response> {
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