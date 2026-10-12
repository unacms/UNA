import { Component, Fragment, type ErrorInfo, type ReactNode } from 'react';
import { captureError } from './health';

type Props = {
    children?: ReactNode;
    /** What shows instead of the children; `reset` renders them again from scratch. */
    fallback: (error: Error, reset: () => void) => ReactNode;
    /** The app can't go on without this part (the root): reported as fatal. */
    fatal?: boolean;
    /** A new value (the next page) clears the error. */
    resetKey?: unknown;
};

type State = { error: Error | null; resetKey: unknown; generation: number };

/**
 * Catches render errors, reports them to UNA's analytics (`react` errors with the component
 * stack) and shows `fallback`. React Native needs boundaries for this: render errors never
 * reach its global error handler. Next's `error.tsx` and `global-error.tsx` play this part
 * on web.
 */
export class AnalyticsErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { error: null, resetKey: props.resetKey, generation: 0 };
    }

    static getDerivedStateFromError(error: unknown): Partial<State> {
        return { error: error instanceof Error ? error : new Error(String(error)) };
    }

    static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
        return Object.is(props.resetKey, state.resetKey) ? null : { resetKey: props.resetKey, error: null };
    }

    componentDidCatch(error: unknown, info: ErrorInfo): void {
        captureError('react', { error, componentStack: info.componentStack ?? '', fatal: !!this.props.fatal });
    }

    reset = (): void => {
        this.setState((state) => ({ error: null, generation: state.generation + 1 }));
    };

    render(): ReactNode {
        if (this.state.error) return this.props.fallback(this.state.error, this.reset);
        return <Fragment key={this.state.generation}>{this.props.children}</Fragment>;
    }
}
