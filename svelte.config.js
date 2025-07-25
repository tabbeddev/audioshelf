import adapter from "@sveltejs/adapter-node";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const file = fileURLToPath(new URL("package.json", import.meta.url));
const json = readFileSync(file, "utf8");
const pkg = JSON.parse(json);

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://svelte.dev/docs/kit/integrations
  // for more information about preprocessors
  preprocess: vitePreprocess({ script: true }),
  kit: {
    adapter: adapter(),
    version: {
      name: pkg.version,
    },
    csp: {
      directives: {
        "script-src": ["self"],
      },
      // must be specified with either the `report-uri` or `report-to` directives, or both
      reportOnly: {
        "script-src": ["self"],
        "report-uri": ["/"],
      },
    },
  },
};

export default config;
