import { chromium } from 'playwright';
import repl from 'node:repl';
import chokidar from 'chokidar';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import type { Page, Browser, BrowserContext } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storagePath = path.join(__dirname, '../storage/session.json');
const helpersPath = path.join(__dirname, './playwright-repl-helpers.js');

let browser: Browser;
let context: BrowserContext;
let page: Page;

async function loadHelpers(page: Page) {
    const { getHelpers } = await import(`${helpersPath}?t=${Date.now()}`);
    return getHelpers(page);
}

async function ensureStorageDir() {
    const dir = path.dirname(storagePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

(async () => {
    await ensureStorageDir();

    browser = await chromium.launch({ headless: false });

    // Load session if exists
    const contextOptions = fs.existsSync(storagePath)
        ? { storageState: storagePath }
        : {};

    context = await browser.newContext(contextOptions);
    page = await context.newPage();

    const r = repl.start({
        prompt: '🎭 > ',
        useGlobal: true,
        ignoreUndefined: true,
    });

    (r as any).setupHistory?.('./.playwright_repl_history', () => { });
    r.context.browser = browser;
    r.context.context = context;
    r.context.page = page;

    const injectHelpers = async () => {
        const helpers = await loadHelpers(page);
        Object.assign(r.context, helpers);
        console.log('🔁 Helpers reloaded');
    };

    await injectHelpers();

    chokidar.watch(helpersPath).on('change', async () => {
        try {
            await injectHelpers();
        } catch (err) {
            console.error('❌ Failed to reload helpers:', err);
        }
    });

    r.on('exit', async () => {
        console.log('\n💾 Saving session and exiting...');
        await context.storageState({ path: storagePath });
        await context.close();
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
  - Stored in: storage/session.json
`);
})();
