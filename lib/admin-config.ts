function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

function parsePrimaryAdminEmails(raw: string | undefined): string[] {
    if (!raw) {
        return [];
    }

    const emails = raw
        .split(',')
        .map(normalizeEmail)
        .filter(Boolean);

    return emails;
}

const primaryAdminEmailSet = new Set(parsePrimaryAdminEmails(process.env.PRIMARY_ADMIN_EMAILS));

export function isPrimaryAdminEmail(email: string | null | undefined): boolean {
    if (!email) {
        return false;
    }

    return primaryAdminEmailSet.has(normalizeEmail(email));
}
