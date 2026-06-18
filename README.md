# Playwright recorder breaks when the page defines `Array.prototype.toJSON`

Minimal reproduction for a Playwright bug: the recorder (codegen) and page bindings
(`exposeFunction` / `exposeBinding`) fail when the page defines `Array.prototype.toJSON`,
as Prototype.js and similar libraries do.

## Setup

```bash
npm install
npx playwright install chromium
```

## Reproduction A — deterministic, no UI (the root cause)

```bash
npx playwright test repro.spec.ts
```

The test calls `page.exposeFunction` on a page that defined `Array.prototype.toJSON`
and fails with:

```
Error: serializedArgs is not an array. This can happen when Array.prototype.toJSON is defined incorrectly
```

## Reproduction B — recorder / codegen (the real-world impact)

The recorder uses page bindings internally (`__pw_recorderRecordAction`, ...), so it
fails the same way on every click.

Serve the page over `http://` (a `file://` page triggers a separate "file: URLs are unique
security origins" error that masks this bug, so use the included server):

```bash
node server.js
```

Then, in another terminal:

```bash
npx playwright codegen http://localhost:3000
```

1. The recorded browser opens with a single **"Click me"** button.
2. Click the button.
3. Recording stops working and the console shows the same error as Reproduction A:

   ```
   Uncaught (in promise) Error: serializedArgs is not an array. This can happen when Array.prototype.toJSON is defined incorrectly
       at _PageBinding.dispatch (.../playwright-core/lib/coreBundle.js)
       at _Page.onBindingCalled (.../playwright-core/lib/coreBundle.js)
       at _FrameSession._onBindingCalled (.../playwright-core/lib/coreBundle.js)
   ```

No action can be recorded on such a page.

## Why this is legal page code

`JSON.stringify` is specified to honor `toJSON`, and defining `Array.prototype.toJSON`
is valid JavaScript that real libraries rely on. The page binding payload is
Playwright-internal, so it should not depend on the page leaving `toJSON` untouched.
Playwright already hardens this path against a busted `Array.prototype.map` / `push`.
