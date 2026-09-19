// Bundles with bun, types with tsc (bun emits no .d.ts).
import { $ } from "bun";

await $`rm -rf dist`;

const entries = ["src/index.ts", "src/browser.ts"];
for (const format of ["esm", "cjs"] as const) {
    const out = await Bun.build({
        entrypoints: entries,
        format,
        naming: format === "esm" ? "[name].js" : "[name].cjs",
        outdir: "dist",
        target: "node",
    });
    if (!out.success) throw new AggregateError(out.logs, `bun build (${format}) failed`);
}

// Script-tag snippet: one self-invoking file, browser target.
const snippet = await Bun.build({
    entrypoints: ["src/track.ts"],
    format: "iife",
    minify: true,
    naming: "bidancer-track.js",
    outdir: "dist",
    target: "browser",
});
if (!snippet.success) throw new AggregateError(snippet.logs, "bun build (snippet) failed");

await $`tsc -p tsconfig.build.json`;
console.log("built", (await Array.fromAsync(new Bun.Glob("dist/*").scan())).sort().join(", "));
