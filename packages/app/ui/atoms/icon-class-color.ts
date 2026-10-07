import { useResolveClassNames } from 'uniwind';

/** Native: resolve `text-*` on animated icons the same way IconFromSet does. */
export function useIconClassColor(className?: string): string | undefined {
    return useResolveClassNames(className || '')?.color as string | undefined;
}
