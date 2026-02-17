import { expect, test } from '@playwright/test';

test('unauthorized dashboard redirects to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
});

test('token preview page renders invalid-token fallback', async ({ page }) => {
    await page.goto('/preview/token/not-a-valid-token?expiresAt=2099-01-01T00:00:00.000Z');
    await expect(page.getByText('Preview Token Tidak Valid')).toBeVisible();
    await expect(page.getByText(/Preview token/i)).toBeVisible();
});

test('tenant host root responds successfully', async ({ page }) => {
    const baseUrl = new URL(test.info().project.use.baseURL as string);
    const response = await page.goto(`${baseUrl.protocol}//tenant.localhost:${baseUrl.port}/`);
    expect(response).not.toBeNull();
    expect(response?.status()).toBeLessThan(500);
});

test('tenant host slug returns not found when no published data', async ({ page }) => {
    const baseUrl = new URL(test.info().project.use.baseURL as string);
    const response = await page.goto(`${baseUrl.protocol}//tenant.localhost:${baseUrl.port}/about`);
    expect(response).not.toBeNull();
    expect(response?.status()).toBe(404);
});
