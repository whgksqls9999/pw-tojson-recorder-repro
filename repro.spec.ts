import { test, expect } from '@playwright/test';

// Reproduces the root cause deterministically (no UI interaction needed).
//
// The page defines Array.prototype.toJSON, exactly as Prototype.js and similar
// libraries do. Playwright's injected binding controller serializes its internal
// RPC payload with the page's JSON.stringify, so the page-defined toJSON rewrites
// Playwright's own `serializedArgs` array into a string and the driver rejects it:
//
//   Error: serializedArgs is not an array. This can happen when
//          Array.prototype.toJSON is defined incorrectly
//
// Every page binding goes through this path, so page.exposeFunction /
// page.exposeBinding AND the recorder (codegen) are all affected. See README.md
// for the manual recorder (codegen) reproduction, which is the real-world impact.
test('page binding breaks when the page defines Array.prototype.toJSON', async ({ page }) => {
  await page.addInitScript(() => {
    (Array.prototype as any).toJSON = function () {
      return '[]';
    };
  });
  await page.goto('about:blank');

  await page.exposeFunction('add', (a: number, b: number) => a + b);

  // Expected: 11. Actual: rejects with "serializedArgs is not an array ...".
  expect(await page.evaluate('add(5, 6)')).toBe(11);
});
