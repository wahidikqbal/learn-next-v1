import { getJson } from '@/shared/api/http-client';
import { getLaravelApiBaseUrl } from '@/shared/config/env';
import { parsePublicSitePayload, type PublicSitePayload } from '@/features/pages/services/page-public.service';

export async function getPublicPreviewByToken(token: string): Promise<PublicSitePayload> {
    const baseUrl = getLaravelApiBaseUrl();
    const data = await getJson<unknown>(baseUrl, '/public/preview', {
        query: { token },
    });
    return parsePublicSitePayload(data);
}
