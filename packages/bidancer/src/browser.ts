// Bundler-friendly browser entry: `import { bidancerBrowser } from "bidancer/browser"`.
// The script-tag snippet (track.ts) is a thin wrapper over this.
import { BidancerClient, type ClientOptions } from "./client";
import {
    buildPayload,
    type ConvertInput,
    parseStored,
    readClickId,
    STORAGE_KEY,
    stripClickParam,
} from "./core";
import type { Conversion } from "./resources/conversions";

export type { ConvertInput } from "./core";
export { BidancerError } from "./error";
export type { Conversion } from "./resources/conversions";

export interface BrowserOptions extends ClientOptions {
    /** Public key (`pk_…`). Safe to embed; the server checks the page origin against your allow-list. */
    key: string;
}

const store = (): Storage | null => {
    try {
        return globalThis.localStorage;
    } catch {
        return null;
    }
};

/** Pulls `?bd_cid=` out of the current URL into localStorage and removes it from the address bar. */
export function captureClickId(): string | null {
    if (typeof window === "undefined") return null;
    try {
        const cid = readClickId(window.location.search);
        if (!cid) return null;
        store()?.setItem(STORAGE_KEY, JSON.stringify({ at: Date.now(), cid }));
        const clean = stripClickParam(window.location.search);
        window.history.replaceState(
            window.history.state,
            "",
            `${window.location.pathname}${clean}${window.location.hash}`,
        );
        return cid;
    } catch {
        return null; // never break the host page
    }
}

export function bidancerBrowser(opts: BrowserOptions) {
    const client = new BidancerClient({ "x-bidancer-key": opts.key }, opts);
    captureClickId();
    return {
        /** Reports a conversion with the stored click id, if any. Resolves to the server's verdict. */
        convert(input: ConvertInput): Promise<Conversion> {
            const stored = parseStored(store()?.getItem(STORAGE_KEY) ?? null, Date.now());
            return client.request<Conversion>(
                "POST",
                "/public/conversions",
                buildPayload(input, stored),
            );
        },
    };
}
