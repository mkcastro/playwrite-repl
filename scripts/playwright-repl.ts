import { chromium } from "playwright";
import repl from "node:repl";
import chokidar from "chokidar";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import type { Page, Browser, BrowserContext } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storageDir = path.join(__dirname, "../storage");
const helpersPath = path.join(__dirname, "./playwright-repl-helpers.js");

let browser: Browser;
let contexts: Map<string, BrowserContext> = new Map();
let currentContext: BrowserContext;
let page: Page;

function getStoragePath(domain: string): string {
  return path.join(storageDir, `${domain}.json`);
}

function getDomainFromUrl(url: string): string {
  try {
    const { hostname } = new URL(url);
    return hostname;
  } catch {
    return "default";
  }
}

async function loadHelpers(getPage: () => Page) {
  const { getHelpers } = await import(`${helpersPath}?t=${Date.now()}`);
  const helpers = getHelpers(getPage);
  return helpers;
}

async function ensureStorageDir() {
  if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });
}

(async () => {
  await ensureStorageDir();

  browser = await chromium.launch({ headless: false });

  // Create default context
  const defaultStoragePath = getStoragePath('default');
  const contextOptions = fs.existsSync(defaultStoragePath)
    ? { storageState: defaultStoragePath }
    : {};
  currentContext = await browser.newContext(contextOptions);
  page = await currentContext.newPage();
  contexts.set('default', currentContext);

  const r = repl.start({
    prompt: "🎭 > ",
    useGlobal: true,
    ignoreUndefined: true,
  });

  (r as any).setupHistory?.("./.playwright_repl_history", () => {});
  r.context.browser = browser;
  r.context.context = currentContext;
  r.context.page = page;

  // Add global goto command
  r.context.goto = async (url: string) => {
    await r.context.switchDomain(url);
    // Return undefined to prevent printing large objects
    return;
  };

  // Add domain-specific context management functions
  r.context.switchDomain = async (url: string) => {
    const domain = getDomainFromUrl(url);
    let context = contexts.get(domain);

    if (!context) {
      const storagePath = getStoragePath(domain);
      const contextOptions = fs.existsSync(storagePath)
        ? { storageState: storagePath }
        : {};
      context = await browser.newContext(contextOptions);
      contexts.set(domain, context);
    }

    currentContext = context;
    page = await context.newPage();
    await page.goto(url);

    r.context.context = currentContext;
    r.context.page = page;
    
    // Re-inject helpers after switching domain
    await injectHelpers();
    
    // Return undefined to prevent printing large objects
    return;
  };

  async function injectHelpers() {
    const helpers = await loadHelpers(() => page);
    Object.assign(r.context, helpers);
    console.log('🔁 Helpers reloaded');
  };

  await injectHelpers();

  chokidar.watch(helpersPath).on("change", async () => {
    try {
      await injectHelpers();
    } catch (err) {
      console.error("❌ Failed to reload helpers:", err);
    }
  });

  r.on("exit", async () => {
    console.log("\n💾 Saving sessions and exiting...");
    // Get current page's domain if it exists
    let currentDomain = "default";
    try {
      if (page) {
        const url = page.url();
        if (url) currentDomain = getDomainFromUrl(url);
      }
    } catch {}

    // If we're using the default context but on a different domain,
    // update the contexts map to use the correct domain key
    if (
      currentContext &&
      contexts.has("default") &&
      currentDomain !== "default"
    ) {
      const defaultContext = contexts.get("default");
      if (defaultContext === currentContext) {
        contexts.delete("default");
        contexts.set(currentDomain, currentContext);
      }
    }

    // Save all contexts
    const savedContexts = new Set();
    for (const [domain, context] of contexts.entries()) {
      if (!savedContexts.has(context)) {
        const storagePath = getStoragePath(domain);
        await context.storageState({ path: storagePath });
        await context.close();
        savedContexts.add(context);
      }
    }
    await browser.close();
    process.exit(0);
  });

  console.log(`
🚀 Playwright REPL started with session support + hot reload

Bindings:
  browser → Playwright Chromium browser
  context → Browser context
  page    → Current page
  ss()    → Screenshot
  goto()  → Shortcut for page.goto()
  text()  → Get text from selector

Session:
  - Will auto-save on exit
  - Will auto-load on launch
  - Stored per domain in: storage/<domain>.json
  - Use switchDomain(url) to change domains
`);
})();
