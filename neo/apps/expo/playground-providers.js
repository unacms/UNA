import { QueryClientProvider } from '@tanstack/react-query';
import { PortalHost } from '@rn-primitives/portal';
import { queryClient } from 'app/lib/platform/query-client';

/**
 * The playground routes (/pg, /pg/form, /play) sit outside `(tabs)`, whose layout provides the
 * query client and the portal host for every other screen. Without them a field that fetches
 * (the embed preview in /pg/form) threw "No QueryClient set", and dropdowns had nowhere to open.
 */
export default function PlaygroundProviders({ children }) {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
            <PortalHost />
        </QueryClientProvider>
    );
}
