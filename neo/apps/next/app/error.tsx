"use client";
import { useEffect } from 'react'
import { appStatic } from 'app/lib/app-static'
import { trackError } from 'app/lib/analytics'

export default function ErrorPage({error, reset}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    // Next catches render errors in its own boundaries: they never reach window listeners.
    useEffect(() => {
        trackError(error, { kind: 'react', fatal: true });
    }, [error]);

    return (
        appStatic('page_error', {error: error, reset: reset})
    );
}
