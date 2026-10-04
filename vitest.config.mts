import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // PGlite-backed tests spin up an in-memory Postgres per suite.
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
