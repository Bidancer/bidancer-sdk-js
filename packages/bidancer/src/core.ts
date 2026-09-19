// Pure pieces of the tracking snippet. No DOM here so they are testable with
// plain `bun test`; index.ts wires them to window/localStorage/fetch.

export const CLICK_PARAM = "bd_cid";
export const STORAGE_KEY = "bd_cid";
/** Local expiry only. The server applies the campaign's real attribution window. */
export const MAX_AGE_MS = 90 * 24 * 3600 * 1000;

export interface StoredClick {
    cid: string;
    at: number;
}

export interface ConvertInput {
    event: string;
    externalRef: string;
    value?: number;
    currency?: string;
    occurredAt?: string;
}

export interface ConversionPayload extends ConvertInput {
    clickId?: string;
}

/** Reads `?bd_cid=` out of a query string. Returns null when absent or malformed. */
export function readClickId(search: string): string | null {
    const match = /(?:^|[?&])bd_cid=([A-Za-z0-9]{8,32})(?:&|$)/.exec(search);
    return match?.[1] ?? null;
}

/** Same query string with `bd_cid` removed; "" when nothing is left. */
export function stripClickParam(search: string): string {
    const kept = search
        .replace(/^\?/, "")
        .split("&")
        .filter((p) => p && !p.startsWith(`${CLICK_PARAM}=`));
    return kept.length ? `?${kept.join("&")}` : "";
}

export function parseStored(raw: string | null, now: number): StoredClick | null {
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw) as Partial<StoredClick>;
        if (typeof parsed.cid !== "string" || typeof parsed.at !== "number") return null;
        if (now - parsed.at > MAX_AGE_MS) return null;
        return { at: parsed.at, cid: parsed.cid };
    } catch {
        return null;
    }
}

export function buildPayload(input: ConvertInput, stored: StoredClick | null): ConversionPayload {
    if (!input || typeof input.event !== "string" || !input.event)
        throw new Error("bidancer: event is required");
    if (typeof input.externalRef !== "string" || !input.externalRef)
        throw new Error("bidancer: externalRef is required (your own id for this conversion)");
    const payload: ConversionPayload = { event: input.event, externalRef: input.externalRef };
    if (typeof input.value === "number") payload.value = input.value;
    if (input.currency) payload.currency = input.currency;
    if (input.occurredAt) payload.occurredAt = input.occurredAt;
    if (stored) payload.clickId = stored.cid;
    return payload;
}
