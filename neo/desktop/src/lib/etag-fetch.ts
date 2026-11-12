/**
 * Conditional GETs for the API. The API sends an ETag with every GET (a hash of the JSON it
 * would send), and neither the HTTP plugin nor reqwest keep a cache, so a poll would download
 * the whole body every time. This keeps the last body of each URL in memory, sends its ETag as
 * If-None-Match and answers a 304 with the kept body as a 200, so openapi-fetch and React Query
 * see an ordinary response.
 *
 * The ETag is the hash of what the site would send now, for this viewer and language, so a 304
 * can only come back when the kept body is exactly that: the URL alone is a safe key. The cache
 * lives as long as the API client (one signed-in session) and never touches disk.
 */

type Entry = { etag: string; body: string; headers: [string, string][] };

export type EtagCacheOptions = {
    /** How many URLs to keep; the least recently used go first. */
    maxEntries?: number;
    /** Bodies larger than this (in UTF-16 code units) are not kept. */
    maxBodyLength?: number;
};

export class EtagCache {
    private entries = new Map<string, Entry>();
    private readonly maxEntries: number;
    private readonly maxBodyLength: number;

    constructor(options: EtagCacheOptions = {}) {
        this.maxEntries = options.maxEntries ?? 200;
        this.maxBodyLength = options.maxBodyLength ?? 1_000_000;
    }

    get size(): number {
        return this.entries.size;
    }

    get(url: string): Entry | undefined {
        const entry = this.entries.get(url);
        if (entry) {
            // most recently used last
            this.entries.delete(url);
            this.entries.set(url, entry);
        }
        return entry;
    }

    set(url: string, entry: Entry): void {
        this.entries.delete(url);
        if (entry.body.length > this.maxBodyLength) return;
        this.entries.set(url, entry);
        while (this.entries.size > this.maxEntries) {
            const oldest = this.entries.keys().next().value;
            if (oldest === undefined) break;
            this.entries.delete(oldest);
        }
    }

    delete(url: string): void {
        this.entries.delete(url);
    }

    clear(): void {
        this.entries.clear();
    }
}

function isJson(response: Response): boolean {
    const type = response.headers.get('Content-Type') ?? '';
    return /^application\/(.+\+)?json\b/i.test(type);
}

/** fetch with If-None-Match from `cache`; a 304 comes back as a 200 with the kept body. */
export function withEtags(fetchImpl: typeof fetch, cache: EtagCache): typeof fetch {
    return async (input: RequestInfo | URL, init?: RequestInit) => {
        const request = new Request(input, init);
        if (request.method !== 'GET') return fetchImpl(request);

        const url = request.url;
        const kept = cache.get(url);
        // the caller's own conditional request is left alone
        const conditional = !!kept && !request.headers.has('If-None-Match');
        if (conditional) request.headers.set('If-None-Match', kept.etag);

        const response = await fetchImpl(request);
        if (response.status === 304 && conditional) {
            return new Response(kept.body, { status: 200, statusText: 'OK', headers: kept.headers });
        }

        const etag = response.headers.get('ETag');
        if (response.status === 200 && etag && isJson(response)) {
            const body = await response.clone().text();
            cache.set(url, { etag, body, headers: [...response.headers.entries()] });
        } else if (response.status !== 304) {
            cache.delete(url);
        }
        return response;
    };
}
