// Save a site's API v2 document as openapi.json, then run `yarn generate`.
// UNA_URL=http://localhost:8088 node scripts/fetch-spec.mjs
// A site lists only the modules it has installed, so take it from a site with all of them.
import { writeFile } from 'node:fs/promises';

const base = (process.env.UNA_URL || 'http://localhost:8088').replace(/\/+$/, '');
const res = await fetch(`${base}/api/v2/openapi.json`);
if (!res.ok) {
    console.error(`GET ${base}/api/v2/openapi.json: ${res.status}`);
    process.exit(1);
}
const spec = await res.json();
// the server URL is the site's own; keep the document site-neutral
spec.servers = [{ url: '/api/v2' }];
spec.info.title = 'UNA API';
// so are the OAuth endpoints: their paths from the site's root, as the server URL is
for (const flow of Object.values(spec.components?.securitySchemes?.oauth2?.flows ?? {}))
    for (const key of ['authorizationUrl', 'tokenUrl', 'refreshUrl']) {
        const at = typeof flow[key] === 'string' ? flow[key].indexOf('/m/oauth2/') : -1;
        if (at > 0) flow[key] = flow[key].slice(at);
    }
await writeFile(new URL('../openapi.json', import.meta.url), JSON.stringify(spec, null, 2) + '\n');
console.log(`openapi.json: ${Object.keys(spec.paths).length} paths from ${base}`);
