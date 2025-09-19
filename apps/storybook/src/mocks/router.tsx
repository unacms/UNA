import React from 'react';

type Href = string | { pathname?: string };

const resolveHref = (href: Href): string => {
  if (typeof href === 'string') return href;
  return href?.pathname ?? '#';
};

export function useRouter() {
  return {
    push: (href: Href) => console.info('[storybook] router.push', href),
    replace: (href: Href) => console.info('[storybook] router.replace', href),
    back: () => console.info('[storybook] router.back'),
  };
}

export function useNavigation() {
  return {
    goBack: () => console.info('[storybook] navigation.goBack'),
  } as const;
}

export function usePathname() {
  return '/';
}

export function useGlobalSearchParams() {
  return {};
}

export function useLocalSearchParams() {
  return {};
}

export function useSafeAreaInsets() {
  return { top: 0, right: 0, bottom: 0, left: 0 } as const;
}

type ChildrenProps = { children?: React.ReactNode };

export const Stack: React.FC<ChildrenProps> = ({ children }) => <>{children}</>;

export const Tabs: React.FC<ChildrenProps> = ({ children }) => <>{children}</>;

export const Redirect: React.FC = () => null;

export const Link = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: Href }
>(({ href, children, ...rest }, ref) => (
  <a ref={ref} href={resolveHref(href)} {...rest}>
    {children}
  </a>
));

Link.displayName = 'ExpoRouterLinkMock';

export function goBack(
  navigation: { getState?: () => { index: number } } | undefined,
  router: { back?: () => void } | undefined,
  callback?: () => void,
) {
  if (navigation?.getState && navigation.getState()?.index === 0) {
    callback?.();
    return;
  }
  router?.back?.();
}

export function redirectTo(
  router: { replace?: (href: Href) => void } | undefined,
  url: Href,
) {
  router?.replace?.(url);
}
