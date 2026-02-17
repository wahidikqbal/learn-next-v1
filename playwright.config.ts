import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3005';
const useExternalServer = process.env.PLAYWRIGHT_NO_WEBSERVER === '1';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    retries: 0,
    reporter: 'list',
    use: {
        baseURL,
        trace: 'on-first-retry',
    },
    webServer: useExternalServer
        ? undefined
        : {
            command: 'npm.cmd run build && npm.cmd run start -- --port 3005',
            url: 'http://localhost:3005',
            timeout: 180 * 1000,
            reuseExistingServer: true,
            env: {
                ROOT_DOMAIN: 'localhost:3005',
                APP_BASE_URL: 'http://localhost:3005',
                NEXT_PUBLIC_ROOT_DOMAIN: 'localhost:3005',
                NEXT_PUBLIC_APP_BASE_URL: 'http://localhost:3005',
                PREVIEW_TOKEN_SECRET: 'e2e-preview-secret',
                AUTH_SECRET: 'e2e-auth-secret',
                AUTH_TRUST_HOST: 'true',
            },
        },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
