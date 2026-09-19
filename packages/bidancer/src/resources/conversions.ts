import type { BidancerClient } from "../client";

export interface CreateConversionInput {
    /** `signup`, `purchase`, `lead`, or the custom event agreed in the campaign terms. */
    event: string;
    /** Your own id for this conversion (order id, lead id). Repeats return the same row. */
    externalRef: string;
    /** Click id captured by the browser snippet (`bd_cid`). */
    clickId?: string;
    /** Affiliate link code, when you know it instead of a click id. */
    linkCode?: string;
    value?: number;
    /** ISO 4217, e.g. "INR". */
    currency?: string;
    /** ISO 8601. Defaults to now on the server. */
    occurredAt?: string;
}

export interface Conversion {
    id: string;
    /** Inside a campaign's attribution window and event matches its terms. */
    attributed: boolean;
    /** Same externalRef seen before; the existing row was returned. */
    replayed: boolean;
    campaignId: string | null;
    /** Why it was not attributed, when it wasn't. */
    reason?: string;
}

export class Conversions {
    constructor(private readonly client: BidancerClient) {}

    /** Reports a conversion with your secret key. Idempotent on `externalRef`. */
    create(input: CreateConversionInput): Promise<Conversion> {
        return this.client.request<Conversion>("POST", "/conversions", input);
    }
}
