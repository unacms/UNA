// Shared by use-pulse-once.ts (RN Animated) and use-pulse-once.web.ts (CSS transition).

export type PulseOnceOptions = {
    /** Duration of ONE pulse (down + up), ms. Default 3000. */
    pulseDurationMs?: number;
    /** How many pulses (integer >= 1). Default 1. */
    pulses?: number;
    /** Pulse depth, 0..1. Default 0.5. */
    minOpacity?: number;
    /** Start on mount. Default true. */
    autoStart?: boolean;
    /** Skip the animation when the OS asks for reduced motion. Default true. */
    respectReducedMotion?: boolean;
    /** Called after all pulses finish (or immediately when skipped). */
    onEnd?: () => void;
};
