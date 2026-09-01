import { useResolveClassNames } from 'uniwind';

/** Native: resolve `text-*` on animated icons the same way IconFromSet does. */
export function useIconClassColor(className) {
    return useResolveClassNames(className || '')?.color;
}
