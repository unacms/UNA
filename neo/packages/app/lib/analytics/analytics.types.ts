/** Client codes of UNA's analytics module (bx_analytics) that NEO sends hits as. */
export type AnalyticsPlatform = 'next-web' | 'rn-ios' | 'rn-android';

/** Short scalar values; UNA keeps up to 30 keys of `[a-zA-Z0-9_.-]{1,40}`. */
export type AnalyticsProps = Record<string, string | number | boolean>;

/** One hit of a collect request (BxAnalyticsCollector). */
export type AnalyticsHit = {
    type: 'pageview' | 'event' | 'leave';
    /** Full URL on web, the UNA page path (`/view-post?id=5`) in the apps. */
    url: string;
    title?: string;
    /** Event name, `[letters digits _ . : / - space]`, up to 64 characters. */
    name?: string;
    props?: AnalyticsProps;
    value?: number;
    /** An event that doesn't count as interaction (the visit stays a bounce). */
    non_interactive?: 1;
    /** Leave hits: milliseconds the page was visible. */
    engaged?: number;
    /** Milliseconds since the hit happened, for hits sent late. */
    age?: number;
};

/** What a client tells about itself with every collect request. */
export type AnalyticsClient = {
    platform: AnalyticsPlatform;
    /** Apps: bundle id / package name and version. */
    app?: string;
    app_version?: string;
    language?: string;
    /** `1440x900` */
    screen?: string;
    /** Apps: system, its version and device type (mobile, tablet); browsers send a user agent. */
    os?: string;
    os_version?: string;
    device?: string;
};

export type AnalyticsPayload = AnalyticsClient & {
    referrer?: string;
    /** Random visitor id, sent in persistent identity mode only. */
    vid?: string;
    hits: AnalyticsHit[];
};

/** `bx_analytics/get_tracker_config`. */
export type TrackerConfig = {
    enabled: boolean;
    persistent: boolean;
    respect_dnt: boolean;
    /** Seconds without hits after which UNA starts a new visit. */
    session_timeout: number;
};

export type TrackEventOptions = {
    /** A number to sum in reports (an amount, a score). */
    value?: number;
    /** Doesn't make the visit interactive (an automatic event, not a user action). */
    nonInteractive?: boolean;
};
