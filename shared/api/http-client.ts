export class HttpError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.name = 'HttpError';
        this.status = status;
    }
}

type QueryValue = string | number | boolean | null | undefined;
type QueryRecord = Record<string, QueryValue>;

function buildQueryString(query?: QueryRecord): string {
    if (!query) return '';

    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
        if (value === null || value === undefined || value === '') continue;
        params.set(key, String(value));
    }

    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
}

function normalizeUrl(baseUrl: string, path: string, query?: QueryRecord): string {
    const normalizedBase = baseUrl.replace(/\/+$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${normalizedBase}${normalizedPath}${buildQueryString(query)}`;
}

export async function getJson<T>(
    baseUrl: string,
    path: string,
    options?: {
        query?: QueryRecord;
        headers?: HeadersInit;
        cache?: RequestCache;
        next?: NextFetchRequestConfig;
    }
): Promise<T> {
    const url = normalizeUrl(baseUrl, path, options?.query);
    const response = await fetch(url, {
        method: 'GET',
        headers: options?.headers,
        cache: options?.cache ?? 'no-store',
        next: options?.next,
    });

    if (!response.ok) {
        let message = `HTTP ${response.status}`;
        try {
            const body = (await response.json()) as { error?: { message?: string } | string };
            if (typeof body.error === 'string' && body.error.trim()) {
                message = body.error;
            } else if (
                typeof body.error === 'object' &&
                body.error !== null &&
                typeof body.error.message === 'string' &&
                body.error.message.trim()
            ) {
                message = body.error.message;
            }
        } catch {
            // Ignore parse errors and keep default message.
        }
        throw new HttpError(response.status, message);
    }

    return (await response.json()) as T;
}
