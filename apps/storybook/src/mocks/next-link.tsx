import React from 'react';

type Href = string | { pathname?: string };

type NextLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: Href;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
};

const resolveHref = (href: Href): string => {
  if (typeof href === 'string') return href;
  return href?.pathname ?? '#';
};

const MockNextLink = React.forwardRef<HTMLAnchorElement, NextLinkProps>(
  ({ href, children, ...rest }, ref) => (
    <a ref={ref} href={resolveHref(href)} {...rest}>
      {children}
    </a>
  ),
);

MockNextLink.displayName = 'MockNextLink';

export default MockNextLink;
