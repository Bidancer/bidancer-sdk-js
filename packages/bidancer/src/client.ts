import { BidancerError } from "./error";

export const DEFAULT_BASE_URL = "https://app.bidancer.com/api/influencer";

export interface ClientOptions {
    /** Override for self-hosted or staging environments. */
    baseUrl?: string;
    /** Per-request timeout. Default 10s. */
    timeoutMs?: number;
    /** Injectable for tests and non-standard runtimes. Default `globalThis.fetch`. */
    fetch?: typeof fetch;
}

interface Envelope<T> {
    status: "success" | "error";
    data?: T;
    code?: string;
    message?: string;
    details?: unknown;
}

/** Bare HTTP core shared by every resource. Resources only know `request()`. */
export class BidancerClient {
    readonly baseUrl: string;
    private readonly timeoutMs: number;
    private readonly fetchImpl: typeof fetch;

    constructor(
        private readonly headers: Record<string, string>,
        opts: ClientOptions = {},
    ) {
        this.baseUrl = (opts.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
        this.timeoutMs = opts.timeoutMs ?? 10_000;
        this.fetchImpl = opts.fetch ?? globalThis.fetch;
        if (typeof this.fetchImpl !== "function")
            throw new BidancerError(
                0,
                "NO_FETCH",
                "bidancer: no fetch available; pass options.fetch",
            );
    }

    // ponytail: no retries. Conversions are idempotent on externalRef server-side, so callers can retry safely.
    async request<T>(method: "GET" | "POST" | "PATCH", path: string, body?: unknown): Promise<T> {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
        let res: Response;
        try {
            res = await this.fetchImpl(`${this.baseUrl}${path}`, {
                body: body === undefined ? undefined : JSON.stringify(body),
                headers: { "content-type": "application/json", ...this.headers },
                method,
                signal: ctrl.signal,
            });
        } catch (err) {
            const timedOut = err instanceof Error && err.name === "AbortError";
            throw new BidancerError(
                0,
                timedOut ? "TIMEOUT" : "NETWORK",
                timedOut ? `bidancer: request timed out after ${this.timeoutMs}ms` : String(err),
            );
        } finally {
            clearTimeout(timer);
        }
        const env = (await res.json().catch(() => ({}))) as Envelope<T>;
        if (!res.ok || env.status === "error")
            throw new BidancerError(
                res.status,
                env.code ?? `HTTP_${res.status}`,
                env.message ?? res.statusText,
                env.details,
            );
        return env.data as T;
    }
}
