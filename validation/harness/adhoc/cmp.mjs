import { chromium } from "playwright";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "../..");

const b = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const p = await b.newPage({ viewport: { width: 1280, height: 1000 } });
const errs = [];
p.on("console", (m) => m.type() === "error" && errs.push(m.text().slice(0, 100)));
await p.goto(`file://${join(ROOT, "reference/stack-comparison.html")}`, { waitUntil: "load" });
await p.waitForTimeout(700);
console.log(JSON.stringify({ height: await p.evaluate(() => document.documentElement.scrollHeight), errs }));
await p.screenshot({ path: "/tmp/cmp1.png" });
await p.evaluate(() => document.querySelector("h2").scrollIntoView());
await p.waitForTimeout(300);
await p.screenshot({ path: "/tmp/cmp2.png" });
await b.close();
