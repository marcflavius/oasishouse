import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    include: ["src/**/*.test.{ts,tsx}"],
    // jsdom + userEvent.type is slow (each keystroke is a full event round-trip)
    // — form-fill tests need more headroom than the 5s default.
    testTimeout: 20000,
  },
});
