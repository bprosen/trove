import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Kept separate from vite.config.ts so tests don't load the TanStack Start / Tailwind plugins.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    // Tests run against a throwaway in-memory SQLite database, never data/trove.db.
    env: { TROVE_DB_PATH: ":memory:" },
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/routeTree.gen.ts", "src/components/ui/**"],
    },
  },
});
