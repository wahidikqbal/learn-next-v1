import { randomBytes } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '@prisma/client';

const databaseUrl = process.env.PLAYWRIGHT_DATABASE_URL ?? process.env.DATABASE_URL ?? '';
let prisma: PrismaClient | null = null;

async function seedAuthenticatedSession() {
    if (!prisma) {
        throw new Error('Prisma is not initialized for E2E run.');
    }

    const seed = randomBytes(6).toString('hex');
    const email = `e2e-${seed}@example.com`;
    const sessionToken = randomBytes(24).toString('hex');

    const user = await prisma.user.create({
        data: {
            email,
            name: `E2E ${seed}`,
            role: Role.USER,
        },
    });

    await prisma.session.create({
        data: {
            sessionToken,
            userId: user.id,
            expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
        },
    });

    return { userId: user.id, sessionToken, email };
}

test.describe('Phase2 Dashboard Full Flow', () => {
    test.beforeAll(async () => {
        if (!databaseUrl) {
            return;
        }

        prisma = new PrismaClient({
            adapter: new PrismaPg({ connectionString: databaseUrl }),
        });

        await prisma.$connect();
    });

    test.afterAll(async () => {
        if (prisma) {
            await prisma.$disconnect();
        }
    });

    test('create -> edit metadata -> publish -> accessible on tenant host', async ({ browser, baseURL }) => {
        test.skip(process.env.PLAYWRIGHT_PHASE2_E2E !== '1', 'Set PLAYWRIGHT_PHASE2_E2E=1 to run full flow.');
        test.skip(!databaseUrl, 'Set PLAYWRIGHT_DATABASE_URL (or DATABASE_URL) to seed auth session for E2E.');

        const context = await browser.newContext();
        const page = await context.newPage();

        const base = new URL(baseURL ?? 'http://localhost:3005');
        const { sessionToken } = await seedAuthenticatedSession();
        const subdomain = `phase2-${randomBytes(3).toString('hex')}`;
        const pageName = `Phase2 ${randomBytes(2).toString('hex')}`;
        const updatedPageName = `Updated ${randomBytes(2).toString('hex')}`;

        await context.addCookies([
            {
                name: 'authjs.session-token',
                value: sessionToken,
                domain: '.localhost',
                path: '/',
                httpOnly: true,
                sameSite: 'Lax',
            },
        ]);

        await page.goto('/dashboard');
        await expect(page).toHaveURL(/\/dashboard/);

        await page.locator('input[name="name"]').fill(pageName);
        await page.locator('input[name="subdomain"]').fill(subdomain);
        await page.getByRole('button', { name: /Create dan Edit/i }).click();

        await expect(page).toHaveURL(/\/edit\/.+/);
        await expect(page.getByPlaceholder('Nama halaman')).toHaveValue('Home');

        await page.getByPlaceholder('Nama halaman').fill(updatedPageName);
        await page.getByPlaceholder('/about').fill('/landing-phase2');
        await page.waitForTimeout(1200);

        const publishResponsePromise = page.waitForResponse((response) =>
            response.url().includes('/api/pages/') &&
            response.url().endsWith('/publish') &&
            response.request().method() === 'POST'
        );

        await page.getByRole('button', { name: 'PUBLISH' }).click();
        await page.getByRole('button', { name: /^Publish$/ }).click();

        const publishResponse = await publishResponsePromise;
        expect(publishResponse.status()).toBe(200);

        const tenantUrl = `${base.protocol}//${subdomain}.localhost:${base.port}/`;
        const tenantResponse = await page.goto(tenantUrl);
        expect(tenantResponse).not.toBeNull();
        expect(tenantResponse?.status()).toBe(200);
        await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });

        await context.close();
    });
});
