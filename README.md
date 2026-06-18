# Playwright recorder breaks when the page defines `Array.prototype.toJSON`

Minimal reproduction for a Playwright bug: the recorder (codegen) and page bindings
(`exposeFunction` / `exposeBinding`) fail when the page defines `Array.prototype.toJSON`,
as Prototype.js and similar libraries do.

## Setup

```bash
npm install
npx playwright install chromium
```

## Reproduction A — recorder / codegen (the real-world impact)

```bash
npx playwright codegen ./repro.html
```

1. The recorded browser opens with a single **"Click me"** button.
2. Click the button.
3. Recording stops working and the console shows:

   ```
   Uncaught (in promise) Error: serializedArgs is not an array. This can happen when Array.prototype.toJSON is defined incorrectly
       at _PageBinding.dispatch (.../playwright-core/lib/coreBundle.js)
       at _Page.onBindingCalled (.../playwright-core/lib/coreBundle.js)
       at _FrameSession._onBindingCalled (.../playwright-core/lib/coreBundle.js)
   ```

No action can be recorded on such a page.

## Reproduction B — deterministic, no UI (same root cause)

```bash
npx playwright test repro.spec.ts
```

The test calls `page.exposeFunction` on a page that defined `Array.prototype.toJSON`
and fails with the same error. The recorder uses page bindings internally
(`__pw_recorderRecordAction`, ...), so it fails the same way on every click.

## Why this is legal page code

`JSON.stringify` is specified to honor `toJSON`, and defining `Array.prototype.toJSON`
is valid JavaScript that real libraries rely on. The page binding payload is
Playwright-internal, so it should not depend on the page leaving `toJSON` untouched.
Playwright already hardens this path against a busted `Array.prototype.map` / `push`.
