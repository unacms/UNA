"use client";
import { appStatic } from 'app/lib/app-static'

export default function GlobalError({error, reset}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        appStatic('page_error', {error: error, reset: reset})
    );
}