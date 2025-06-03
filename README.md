# 🧪 Playwright REPL with Hot Reload + Sessions

This project is a custom TypeScript-powered **interactive REPL** for [Playwright](https://playwright.dev/), enhanced with:

- ✅ `await` support for Playwright commands
- 🔁 Hot-reloadable helper functions
- 💾 Persistent browser sessions via `storageState`
- 🧠 Real autocompletion and command history
- 🪄 Preloaded aliases like `goto()`, `ss()`, and `text()`

---

## 📦 Installation

```bash
pnpm install
npx playwright install
```

> Requires Node.js `>=18`. Works best with `tsx`.

---

## 🚀 Getting Started

```bash
pnpm tsx scripts/playwright-repl.ts
```

---

## 🧰 Available Globals in REPL

| Binding     | Description                        |
| ----------- | ---------------------------------- |
| `browser`   | Chromium browser instance          |
| `context`   | Browser context (isolated profile) |
| `page`      | The current page tab               |
| `ss(name?)` | Screenshot with timestamp filename |
| `goto(url)` | Shortcut for `page.goto(url)`      |
| `text(sel)` | Get inner text of element          |
| `eval(fn)`  | Shortcut for `page.evaluate(fn)`   |
| `.editor`   | Open multi-line input mode         |
| `.exit`     | Quit the REPL                      |

---

## 💾 Sessions

Session data is saved on exit and restored on launch using Playwright’s [`storageState`](https://playwright.dev/docs/auth#save-authentication-state).

- 📍 File: `storage/session.json`
- ✅ Keeps cookies, localStorage, and login sessions
- 🔄 Automatically loaded if it exists

---

## 🔁 Hot-Reloadable Helpers

Your helpers live in:

```ts
scripts/playwright-repl-helpers.ts
```

Every time you save this file, the REPL automatically reloads your updated helpers **without restarting the browser or REPL**.

You can customize this file to include your own commands and debugging tools.

---

## 📂 Project Structure

```bash
scripts/
├── playwright-repl.ts           # Entry REPL script
├── playwright-repl-helpers.ts   # Hot-reloadable helper functions
storage/
└── session.json                 # Browser session state
```

---

## 🛠 Future Enhancements

- [ ] Multiple session profiles (e.g., `admin`, `guest`)
- [ ] `.resetSession` command
- [ ] Cookie inspector / header dumper
- [ ] Custom commands for intercepting network requests

---

## 🧙‍♂️ Example Usage

```ts
await goto('https://example.com')
await text('h1')
await ss('homepage')
```

---

## 🖤 Credits

Crafted with love, caffeine, and drama.
Inspired by Playwright, styled for legends.
