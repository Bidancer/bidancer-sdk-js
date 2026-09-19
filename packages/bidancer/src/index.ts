import { BidancerClient, type ClientOptions } from "./client";
import { Conversions } from "./resources/conversions";

export type { ClientOptions } from "./client";
export { BidancerError } from "./error";
export type { Conversion, CreateConversionInput } from "./resources/conversions";

/**
 * Server-side client. Never ship a secret key to a browser; use `bidancer/browser` there.
 *
 *   const bidancer = new Bidancer(process.env.BIDANCER_SECRET_KEY);
 *   await bidancer.conversions.create({ event: "purchase", externalRef: "ORD-1" });
 */
export class Bidancer {
    readonly conversions: Conversions;

    constructor(secretKey: string, options: ClientOptions = {}) {
        if (!secretKey?.startsWith("sk_"))
            throw new TypeError(
                'bidancer: expected a secret key ("sk_…") from Settings → Integrations',
            );
        const client = new BidancerClient({ authorization: `Bearer ${secretKey}` }, options);
        // New resources: add a file under resources/ and one line here.
        this.conversions = new Conversions(client);
    }
}

export default Bidancer;
