import { fetch as expoFetch } from 'expo/fetch';

/**
 * RN `fetch` has no `response.body.getReader` (TanStack: "Streaming fetch
 * responses are not supported"). Expo's fetch streams SSE the same way web does.
 */
export function unaAiChatStreamingFetch(input, init) {
    return expoFetch(input, init);
}
