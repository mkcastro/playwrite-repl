import type { Page } from 'playwright';
import fs from 'fs';
import path from 'path';

export function getHelpers(page: Page) {
    return {
        /**
         * 💾 Takes a screenshot and saves with timestamp
         */
        async ss(name = 'screenshot') {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `${name}-${timestamp}.png`;
            const filepath = path.resolve(process.cwd(), filename);
            await page.screenshot({ path: filepath, fullPage: true });
            console.log(`📸 Screenshot saved to ${filename}`);
        },

        /**
         * 🌐 Navigates to a URL
         */
        async goto(url: string) {
            console.log(`➡️ Navigating to: ${url}`);
            await page.goto(url);
        },

        /**
         * 📢 Pretty log
         */
        log(...args: any[]) {
            console.log('🪄', ...args);
        },

        /**
         * 🔍 Shortcut for single element text
         */
        async text(selector: string) {
            const el = page.locator(selector);
            const text = await el.textContent();
            console.log(`📝 ${selector}:`, text);
            return text;
        },

        /**
         * 🧪 Evaluate anything in page context
         */
        async eval(fn: string | ((...args: any[]) => any), ...args: any[]) {
            return await page.evaluate(fn as any, ...args);
        }
    };
}
