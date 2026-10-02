// Test-only stub for the `server-only` package.
//
// `server-only` is a Next.js build-time guard that throws when imported from
// a Client Component. The real package is used by the production build
// (Next's bundler aliases it appropriately). Vitest runs in Node without that
// aliasing, so the raw package throws unconditionally and breaks unit tests.
// This empty stub satisfies the import in the test environment only.
export {};