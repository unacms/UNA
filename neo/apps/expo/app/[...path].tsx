import { useEffect } from 'react';
import { Redirect, useLocalSearchParams } from 'app/lib/hooks/router';
import { catchAllPagePath, queueDeepLink } from 'app/lib/navigation/deep-link';

/**
 * Paths without a route of their own: the app root and UNA pages from links
 * (`neo://view-post?id=1`). Queue the page for the tabs, which open it over
 * its tab's root, and show the tabs.
 */
export default function CatchAll() {
  const pagePath = catchAllPagePath(useLocalSearchParams());

  useEffect(() => {
    if (pagePath) queueDeepLink(pagePath);
  }, [pagePath]);

  return <Redirect href="/tab0" />;
}
