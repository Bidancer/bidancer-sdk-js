import { describe, expect, test } from "bun:test";
import { bidancerBrowser } from "./browser";
import { BidancerError } from "./error";
import { Bidancer } from "./index";

const fakeFetch = (status: number, body: unknown) => {
    const calls: { url: string; init: RequestInit }[] = [];
    const last = () => calls[calls.length - 1] as { url: string; init: RequestInit };
    const fetch = (async (url: string, init: RequestInit) => {
        calls.push({ init, url });
        return new Response(JSON.stringify(body), { status });
    }) as unknown as typeof fetch;
    return { calls, fetch, last };
};

describe("Bidancer server client", () => {
    test("posts with the secret key and unwraps the envelope", async () => {
        const f = fakeFetch(201, {
            data: { attributed: true, campaignId: "c1", id: "cv1", replayed: false },
            status: "success",
        });
        const r = await new Bidancer("sk_test_1", { fetch: f.fetch }).conversions.create({
            event: "purchase",
            externalRef: "ORD-1",
            value: 10,
        });
        expect(r).toEqual({ attributed: true, campaignId: "c1", id: "cv1", replayed: false });
        const call = f.last();
        expect(call.url).toBe("https://api.bidancer.com/v1/influencer/conversions");
        expect((call.init.headers as Record<string, string>).authorization).toBe(
            "Bearer sk_test_1",
        );
        expect(JSON.parse(call.init.body as string)).toEqual({
            event: "purchase",
            externalRef: "ORD-1",
            value: 10,
        });
    });

    test("maps error envelopes to BidancerError", async () => {
        const f = fakeFetch(401, { code: "INVALID_KEY", message: "nope", status: "error" });
        const p = new Bidancer("sk_x", {
            baseUrl: "https://dev-api.stg.bidancer.com/v1/influencer/",
            fetch: f.fetch,
        }).conversions.create({ event: "lead", externalRef: "L1" });
        await expect(p).rejects.toBeInstanceOf(BidancerError);
        await expect(p).rejects.toMatchObject({ code: "INVALID_KEY", status: 401 });
        expect(f.last().url).toBe("https://dev-api.stg.bidancer.com/v1/influencer/conversions");
    });

    test("rejects a public key", () => {
        expect(() => new Bidancer("pk_x")).toThrow(TypeError);
    });
});

describe("bidancerBrowser", () => {
    test("uses the public endpoint and x-bidancer-key", async () => {
        const f = fakeFetch(202, {
            data: { attributed: false, id: "cv2", replayed: false },
            status: "success",
        });
        const r = await bidancerBrowser({ fetch: f.fetch, key: "pk_1" }).convert({
            event: "signup",
            externalRef: "u1",
        });
        expect(r.id).toBe("cv2");
        const call = f.last();
        expect(call.url).toBe("https://api.bidancer.com/v1/influencer/public/conversions");
        expect((call.init.headers as Record<string, string>)["x-bidancer-key"]).toBe("pk_1");
    });
});
