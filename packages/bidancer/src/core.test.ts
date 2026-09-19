import { describe, expect, test } from "bun:test";
import { buildPayload, MAX_AGE_MS, parseStored, readClickId, stripClickParam } from "./core";

describe("influencer-sdk core", () => {
    test("reads and strips bd_cid", () => {
        expect(readClickId("?utm=1&bd_cid=ABCDEFGH12345678&x=2")).toBe("ABCDEFGH12345678");
        expect(readClickId("?bd_cid=bad!")).toBeNull();
        expect(readClickId("")).toBeNull();
        expect(stripClickParam("?utm=1&bd_cid=ABCDEFGH12345678&x=2")).toBe("?utm=1&x=2");
        expect(stripClickParam("?bd_cid=ABCDEFGH12345678")).toBe("");
    });

    test("stored click expires locally", () => {
        const now = Date.now();
        expect(
            parseStored(JSON.stringify({ at: now - 1000, cid: "ABCDEFGH12345678" }), now)?.cid,
        ).toBe("ABCDEFGH12345678");
        expect(parseStored(JSON.stringify({ at: now - MAX_AGE_MS - 1, cid: "x" }), now)).toBeNull();
        expect(parseStored("not json", now)).toBeNull();
    });

    test("payload requires event + externalRef and carries the click id", () => {
        const p = buildPayload(
            { event: "signup", externalRef: "u1", value: 10 },
            { at: 1, cid: "C" },
        );
        expect(p).toEqual({ clickId: "C", event: "signup", externalRef: "u1", value: 10 });
        expect(buildPayload({ event: "signup", externalRef: "u1" }, null).clickId).toBeUndefined();
        expect(() => buildPayload({ event: "", externalRef: "u1" }, null)).toThrow();
        expect(() => buildPayload({ event: "signup", externalRef: "" }, null)).toThrow();
    });
});
