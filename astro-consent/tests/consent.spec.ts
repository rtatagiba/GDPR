import { test, expect, Page } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const HTML = new URL('consent.html', import.meta.url).toString();

async function getState(page: Page) {
  return page.evaluate(() => {
    const raw = document.getElementById('log')?.textContent ?? '{}';
    try { return JSON.parse(raw); } catch { return {}; }
  });
}

async function waitForBanner(page: Page) {
  await page.waitForSelector('#astro-consent-banner', { timeout: 5000 });
}

test.describe('astro-consent runtime', () => {

  test('defaults: analytics and marketing are false', async ({ page }) => {
    await page.goto(HTML);
    const stored = await page.evaluate(() => {
      // Read DEFAULTS from the IIFE closure — can't access directly,
      // but we can check that no consent is stored and that scripts are NOT active.
      return {
        noConsent: !window.astroConsent?.get(),
        analyticsLoaded: !!(window as any).__analyticsLoaded,
        marketingLoaded: !!(window as any).__marketingLoaded,
      };
    });
    expect(stored.noConsent).toBe(true);
    expect(stored.analyticsLoaded).toBe(false);
    expect(stored.marketingLoaded).toBe(false);
  });

  test('no third-party scripts fire before consent', async ({ page }) => {
    const thirdPartyRequests: string[] = [];
    page.on('request', req => {
      const u = req.url();
      if (u.includes('googletagmanager.com') || u.includes('google-analytics.com')) {
        thirdPartyRequests.push(u);
      }
    });

    await page.goto(HTML);
    // Wait enough for idle + delay
    await page.waitForTimeout(2500);
    await waitForBanner(page);

    expect(thirdPartyRequests).toHaveLength(0);
    const state = await getState(page);
    expect(state.analyticsLoaded).toBe(false);
    expect(state.marketingLoaded).toBe(false);
  });

  test('accept all: analytics and marketing scripts activate', async ({ page }) => {
    await page.goto(HTML);
    await waitForBanner(page);

    await page.click('.cb-accept');

    // Give applyConsent time to run
    await page.waitForTimeout(300);

    const state = await getState(page);
    expect(state.consent?.categories?.analytics).toBe(true);
    expect(state.consent?.categories?.marketing).toBe(true);
    expect(state.analyticsLoaded).toBe(true);
    expect(state.marketingLoaded).toBe(true);
    expect(state.analyticsScriptActive).toBe(true);
    expect(state.marketingScriptActive).toBe(true);
  });

  test('reject all: no optional scripts activate', async ({ page }) => {
    await page.goto(HTML);
    await waitForBanner(page);

    await page.click('.cb-reject');
    await page.waitForTimeout(300);

    const state = await getState(page);
    expect(state.consent?.categories?.analytics).toBeFalsy();
    expect(state.consent?.categories?.marketing).toBeFalsy();
    expect(state.analyticsLoaded).toBe(false);
    expect(state.marketingLoaded).toBe(false);
  });

  test('reject all persists after reload', async ({ page }) => {
    await page.goto(HTML);
    await waitForBanner(page);
    await page.click('.cb-reject');
    await page.waitForTimeout(300);

    // Reload without clearing storage
    await page.reload();
    await page.waitForTimeout(500);

    const state = await getState(page);
    // Banner should NOT reappear (consent already stored)
    const banner = await page.$('#astro-consent-banner');
    expect(banner).toBeNull();
    // Scripts still blocked
    expect(state.analyticsLoaded).toBe(false);
    expect(state.marketingLoaded).toBe(false);
  });

  test('modal: selective consent — analytics only', async ({ page }) => {
    await page.goto(HTML);
    await waitForBanner(page);

    await page.click('.cb-manage');
    await page.waitForSelector('#astro-consent-modal', { timeout: 2000 });

    // Toggle analytics ON (starts off)
    await page.click('[data-key="analytics"]');

    // Save via Accept in modal
    await page.locator('#astro-consent-modal .cb-accept').click();
    await page.waitForTimeout(300);

    const state = await getState(page);
    expect(state.consent?.categories?.analytics).toBe(true);
    expect(state.consent?.categories?.marketing).toBeFalsy();
    expect(state.analyticsLoaded).toBe(true);
    expect(state.marketingLoaded).toBe(false);
  });

  test('stored consent on reload: scripts activate immediately', async ({ page }) => {
    // Page 1: accept all
    await page.goto(HTML);
    await waitForBanner(page);
    await page.click('.cb-accept');
    await page.waitForTimeout(300);

    // Reload
    await page.reload();
    await page.waitForTimeout(600);

    const state = await getState(page);
    // Banner should not reappear
    const banner = await page.$('#astro-consent-banner');
    expect(banner).toBeNull();
    // Scripts activated immediately on load
    expect(state.analyticsLoaded).toBe(true);
    expect(state.marketingLoaded).toBe(true);
  });

  test('reset: clears consent and reloads', async ({ page }) => {
    await page.goto(HTML);
    await waitForBanner(page);
    await page.click('.cb-accept');
    await page.waitForTimeout(300);

    // reset() causes reload — intercept navigation
    const [newPage] = await Promise.all([
      page.waitForEvent('load').catch(() => page),
      page.evaluate(() => window.astroConsent.reset()),
    ]);

    await page.waitForTimeout(800);

    // After reset+reload, no stored consent → banner should appear again
    await waitForBanner(page);
    const state = await getState(page);
    expect(state.consent).toBeNull();
  });

  test('Escape key closes modal', async ({ page }) => {
    await page.goto(HTML);
    await waitForBanner(page);
    await page.click('.cb-manage');
    await page.waitForSelector('#astro-consent-modal');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    const modal = await page.$('#astro-consent-modal');
    expect(modal).toBeNull();
  });

  test('modal toggles start OFF (analytics and marketing)', async ({ page }) => {
    await page.goto(HTML);
    await waitForBanner(page);
    await page.click('.cb-manage');
    await page.waitForSelector('#astro-consent-modal');

    const analyticsPressed = await page.getAttribute('[data-key="analytics"]', 'aria-pressed');
    const marketingPressed = await page.getAttribute('[data-key="marketing"]', 'aria-pressed');

    expect(analyticsPressed).toBe('false');
    expect(marketingPressed).toBe('false');
  });

});
