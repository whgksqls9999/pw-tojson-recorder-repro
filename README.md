# Playwright recorder breaks when the page defines `Array.prototype.toJSON`

Minimal reproduction: the recorder (codegen) and page bindings (`exposeFunction` /
`exposeBinding`) fail when the page defines `Array.prototype.toJSON`, as Prototype.js
and similar libraries do.

## A — Deterministic, no UI (the root cause)

```bash
git clone https://github.com/whgksqls9999/pw-tojson-recorder-repro
cd pw-tojson-recorder-repro
npm install
npx playwright install chromium
npx playwright test repro.spec.ts
```

Fails with:

```
Error: serializedArgs is not an array. This can happen when Array.prototype.toJSON is defined incorrectly
```

## B — Recorder / codegen (the real-world impact)

1. Start the recorder and navigate to any page (even `about:blank`):
   ```bash
   npx playwright codegen
   ```
2. Open the browser's DevTools → Console and paste:
   ```js
   Array.prototype.toJSON = function () {
     var results = [];
     this.forEach(function (value) {
       results.push(
         typeof value === 'object' ? JSON.stringify(value) : String(value)
       );
     });
     return '[' + results.join(', ') + ']';
   };
   ```
3. Click any element / the recorder's controls.
4. Recording stops with the same error as A.

## Why this is legal page code

`JSON.stringify` is specified to honor `toJSON`, and defining `Array.prototype.toJSON`
is valid JavaScript that real libraries rely on. The page binding payload is
Playwright-internal, so it should not depend on the page leaving `toJSON` untouched.
Playwright already hardens this path against a busted `Array.prototype.map` / `push`.
