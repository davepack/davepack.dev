// The Workers bindings this app uses (see wrangler.jsonc), as exposed by the
// runtime's `cloudflare:workers` module. Typed here by hand rather than
// pulling in all of @cloudflare/workers-types.
declare module "cloudflare:workers" {
  export const env: {
    EVENTS?: {
      writeDataPoint(point: { indexes?: string[]; blobs?: string[]; doubles?: number[] }): void;
    };
  };
}
