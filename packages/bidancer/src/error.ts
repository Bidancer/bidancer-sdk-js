/** Thrown for any non-2xx response. `code` is the server's machine code when it sends one. */
export class BidancerError extends Error {
    override readonly name = "BidancerError";
    constructor(
        readonly status: number,
        readonly code: string,
        message: string,
        readonly details?: unknown,
    ) {
        super(message);
    }
}
