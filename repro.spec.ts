import { test, expect } from '@playwright/test';

test('page binding breaks when the page defines Array.prototype.toJSON', async ({ page }) => {
  await page.addInitScript(() => {
    (Array.prototype as any).toJSON = function () {
      return '[]';
    };
  });
  await page.goto('about:blank');

  await page.exposeFunction('add', (a: number, b: number) => a + b);

  expect(await page.evaluate('add(5, 6)')).toBe(11);
});
