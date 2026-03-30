import { defineConfig } from "tsup";
import { writeFileSync, readFileSync } from "fs";

const SHEBANG = "#!/usr/bin/env node\n";
const ENTRY_FILES = ["dist/mcp/server.js", "dist/cli/index.js"];

export default defineConfig({
  entry: {
    "mcp/server": "src/mcp/server.ts",
    "cli/index": "src/cli/index.ts",
  },
  format: ["esm"],
  target: "node18",
  clean: true,
  sourcemap: true,
  async onSuccess() {
    for (const file of ENTRY_FILES) {
      const content = readFileSync(file, "utf-8");
      if (!content.startsWith(SHEBANG)) {
        writeFileSync(file, SHEBANG + content);
      }
    }
  },
});
