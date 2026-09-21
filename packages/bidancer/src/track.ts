// Script-tag snippet, built to dist/bidancer-track.js.
//
//   <script src="https://cdn.jsdelivr.net/npm/bidancer/dist/bidancer-track.js" data-key="pk_…"></script>
//   window.bidancer("convert", { event: "signup", externalRef: "user_123" });
//
// Calls made before the script loads are replayed from window.__bidancerQueue:
//   window.bidancer = window.bidancer || function(){(window.__bidancerQueue=window.__bidancerQueue||[]).push(arguments)}
import { bidancerBrowser, captureClickId } from "./browser";
import type { ConvertInput } from "./core";

type Command = "init" | "convert";
interface InitOptions {
    key?: string;
    /** Base URL, e.g. "https://api.bidancer.com/v1/influencer". */
    endpoint?: string;
}

declare global {
    interface Window {
        bidancer?: (cmd: Command, payload?: unknown) => void;
        __bidancerQueue?: unknown[][];
    }
}

(() => {
    if (typeof window === "undefined") return;
    const script = document.currentScript as HTMLScriptElement | null;
    let key = script?.dataset.key;
    let baseUrl = script?.dataset.endpoint;
    let tracker: ReturnType<typeof bidancerBrowser> | null = null;
    const queue: ConvertInput[] = [];

    captureClickId(); // before any convert, and before an SPA router rewrites the URL

    const send = (input: ConvertInput) => {
        if (!key) return void queue.push(input);
        tracker ??= bidancerBrowser({ baseUrl, key });
        tracker.convert(input).catch((err) => console.warn(String(err)));
    };

    const api = (cmd: Command, payload?: unknown) => {
        if (cmd === "init") {
            const opts = (payload ?? {}) as InitOptions;
            if (opts.key) key = opts.key;
            if (opts.endpoint) baseUrl = opts.endpoint;
            tracker = null;
            while (queue.length && key) send(queue.shift() as ConvertInput);
        } else if (cmd === "convert") send(payload as ConvertInput);
    };

    const pending = window.__bidancerQueue ?? [];
    window.bidancer = api;
    for (const args of pending) api(args[0] as Command, args[1]);
})();
