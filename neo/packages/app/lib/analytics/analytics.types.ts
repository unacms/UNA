/** Client codes of UNA's analytics module (bx_analytics) that NEO sends hits as. */
export type AnalyticsPlatform = 'next-web' | 'rn-ios' | 'rn-android';

/** Short scalar values; UNA keeps up to 30 keys of `[a-zA-Z0-9_.-]{1,40}`. */
export type AnalyticsProps = Record<string, string | number | boolean>;

/** Error kinds UNA accepts from clients (BxAnalyticsErrors::KINDS). */
export type ErrorKind = 'js' | 'promise' | 'react' | 'native' | 'http' | 'resource';

/** How the page or screen a vitals hit measures was reached (BxAnalyticsVitals::NAVS). */
export type VitalsNav = 'navigate' | 'reload' | 'back_forward' | 'prerender' | 'soft' | 'restore';

/** Milliseconds (0 to 120000); `cls` is a layout shift score (0 to 10). */
export type VitalsMetrics = Partial<Record<'ttfb' | 'fcp' | 'lcp' | 'inp' | 'cls' | 'screen_load' | 'app_start', number>>;

/** One hit of a collect request (BxAnalyticsCollector). */
export type AnalyticsHit = {
    type: 'pageview' | 'event' | 'leave' | 'error' | 'vitals';
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
    /** Errors: what failed, the message (no query strings), where, and how often on this page. */
    kind?: ErrorKind;
    message?: string;
    source?: string;
    line?: number;
    col?: number;
    stack?: string;
    component_stack?: string;
    /** The app or page could not go on (a root error boundary, a fatal native error). */
    fatal?: 1;
    repeats?: number;
    /** HTTP status of a failed request (`http` errors). */
    status?: number;
    /** An error kept on the device and sent on the next app start. */
    deferred?: 1;
    /** Vitals */
    nav?: VitalsNav;
    metrics?: VitalsMetrics;
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
    /** Send errors; false whenever `enabled` is. */
    errors: boolean;
    /** Messages not to send: `*` matches any characters, the whole message, any case. */
    errors_ignore: string[];
    /** Send vitals, for `vitals_sample` percent of app starts / page loads. */
    vitals: boolean;
    vitals_sample: number;
};

export type TrackEventOptions = {
    /** A number to sum in reports (an amount, a score). */
    value?: number;
    /** Doesn't make the visit interactive (an automatic event, not a user action). */
    nonInteractive?: boolean;
};

export type TrackErrorOptions = {
    /** `react` for an error boundary's error; `js` (the default) for any other. */
    kind?: 'js' | 'react';
    /** The page or app could not go on. */
    fatal?: boolean;
    /** React's component stack, from an error boundary. */
    componentStack?: string;
};
