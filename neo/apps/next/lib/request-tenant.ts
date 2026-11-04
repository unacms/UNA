import { MULTITENANT, PREVIEW_DOMAIN, PREVIEW_API_KEY } from 'app/config';
import { getDomainByHostname } from './domains/domains';
import { resolvePreviewBackend, type Tenant } from './tenant';

/**
 * The UNA backend a request's Host header names (see `tenant.ts`), or null for the
 * configured UNA_URL.
 */
export async function resolveRequestTenant(host: string | null | undefined): Promise<Tenant | null> {
    if (MULTITENANT) {
        const domain = await getDomainByHostname(String(host || '').split(':')[0]!);
        return domain ? (domain as unknown as Tenant) : null;
    }
    return resolvePreviewBackend(host, PREVIEW_DOMAIN, PREVIEW_API_KEY);
}
