import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const file = fileURLToPath(new URL('package.json', import.meta.url));
const json = readFileSync(file, 'utf8');
const pkg: Package = JSON.parse(json);

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
	define: {
		PKG: pkg
	}
});
