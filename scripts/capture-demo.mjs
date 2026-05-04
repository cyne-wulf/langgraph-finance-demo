import { chromium } from "playwright";
import { spawnSync } from "node:child_process";
import { mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const assetDir = path.join(root, "deck", "assets");
await mkdir(assetDir, { recursive: true });

// This script creates the local proof assets embedded in the HTML deck. It
// drives the real dashboard so screenshots and video stay synchronized with the
// current UI.
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 950 },
  recordVideo: { dir: assetDir, size: { width: 1440, height: 950 } },
});
const page = await context.newPage();
await page.goto("http://127.0.0.1:5173", { waitUntil: "networkidle" });
await page.screenshot({ path: path.join(assetDir, "initial-dashboard.png"), fullPage: true });
await page.waitForTimeout(1800);

// Happy path: run the graph, capture the trace while nodes are appearing, then
// capture the completed charts and summary.
await page.getByRole("button", { name: /run analysis/i }).click();
await page.waitForTimeout(1400);
await page.screenshot({ path: path.join(assetDir, "running-trace.png"), fullPage: true });
await page.waitForTimeout(4200);
await page.screenshot({ path: path.join(assetDir, "completed-results.png"), fullPage: true });

// Assumption-change path: bump the raise size and show the analysis rerunning.
await page.getByRole("button", { name: /rerun with/i }).click();
await page.waitForTimeout(4600);
await page.screenshot({ path: path.join(assetDir, "assumption-rerun.png"), fullPage: true });
await page.waitForTimeout(2200);

const video = page.video();
await context.close();
if (video) {
  const webmPath = path.join(assetDir, "verification.webm");
  const mp4Path = path.join(assetDir, "verification.mp4");
  await video.saveAs(webmPath);

  // Playwright records WebM. The deck embeds MP4 for broader browser support.
  const conversion = spawnSync("ffmpeg", ["-y", "-i", webmPath, "-movflags", "+faststart", "-pix_fmt", "yuv420p", mp4Path], {
    stdio: "inherit",
  });
  if (conversion.status === 0) {
    await rm(webmPath);
  }
  for (const file of await readdir(assetDir)) {
    if (file.startsWith("page@") && file.endsWith(".webm")) {
      await rm(path.join(assetDir, file));
    }
  }
}
await browser.close();
