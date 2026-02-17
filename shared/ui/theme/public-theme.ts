import type { CSSProperties } from 'react';
import type { TenantTheme } from '@/features/pages/services/page-public.service';

const FALLBACK_THEME = {
    backgroundColor: '#ffffff',
    textColor: '#0f172a',
    primaryColor: '#0f172a',
    secondaryColor: '#334155',
};

export function resolveTenantTheme(theme?: TenantTheme): Required<Omit<TenantTheme, 'font'>> & { font?: string } {
    return {
        backgroundColor: theme?.backgroundColor ?? FALLBACK_THEME.backgroundColor,
        textColor: theme?.textColor ?? FALLBACK_THEME.textColor,
        primaryColor: theme?.primaryColor ?? FALLBACK_THEME.primaryColor,
        secondaryColor: theme?.secondaryColor ?? FALLBACK_THEME.secondaryColor,
        font: theme?.font,
    };
}

export function buildPublicThemeStyle(theme?: TenantTheme): CSSProperties {
    const resolved = resolveTenantTheme(theme);
    return {
        backgroundColor: resolved.backgroundColor,
        color: resolved.textColor,
    };
}

