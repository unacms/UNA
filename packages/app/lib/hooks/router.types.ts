// Shared by router.ts (expo-router, native) and router.web.ts (next/navigation).

export type SafeAreaInsets = { top: number; right: number; bottom: number; left: number };

/** Minimal react-navigation surface goBack() reads (null on web). */
export type NavigationLike = {
    getState?: () => { index?: number } | undefined;
    canGoBack?: () => boolean;
    goBack?: () => void;
} | null | undefined;

/** Minimal router surface goBack() / redirectTo() use (expo-router on native, next on web). */
export type RouterLike = {
    back?: () => void;
    replace: (href: any) => void;
};
