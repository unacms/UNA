// Analytics (bx_analytics) elements: one chunk for the three block types. Each block
// loads its own report from get_report; all of them on a screen share one filter state.
export { default as AnalyticsFilters } from './analytics/filters';
export { default as AnalyticsOverview } from './analytics/overview';
export { default as AnalyticsTop } from './analytics/top';
