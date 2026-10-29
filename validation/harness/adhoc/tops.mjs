import { chromium } from "playwright";
const b = await chromium.launch({ args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
await p.goto("http://127.0.0.1:3100/", { waitUntil: "networkidle" });
console.log(await p.evaluate(() => {
  const sels = ['section[aria-labelledby="hero-title"]','section[aria-label="What we stand for"]','section[aria-labelledby="purpose-title"]','section[aria-labelledby="focus-title"]','section[aria-labelledby="impact-title"]','section[aria-labelledby="stories-title"]','section[aria-labelledby="involved-title"]','section[aria-labelledby="partners-title"]','section[aria-labelledby="news-title"]','footer'];
  return sels.map(s => { const e = document.querySelector(s); return s.slice(0,40) + " → " + (e ? Math.round(e.getBoundingClientRect().top + scrollY) + " h=" + Math.round(e.getBoundingClientRect().height) : "MISSING"); }).join("\n");
}));
await b.close();
