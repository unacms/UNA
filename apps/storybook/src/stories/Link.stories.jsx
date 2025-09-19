import React from 'react';
import ElementLink from 'app/ui/atoms/link.web';
import { settingsDefault } from 'app/settings-default';

const themeSettings = settingsDefault?.theme ?? {};
const linkSizesConfig = themeSettings.link_sizes ?? {};
const linkStylesConfig = themeSettings.link_styles ?? {};

const sizeOptions = Object.entries(linkSizesConfig)
  .filter(([, value]) => value && typeof value === 'object' && !Array.isArray(value))
  .map(([key]) => key);

const variantOptions = Array.from(
  new Set(
    Object.keys(linkStylesConfig)
      .map((token) => token.split('-')[2])
      .filter(Boolean)
  )
);

const defaultSizeCandidate = linkSizesConfig.default_size;
const defaultVariantCandidate = linkSizesConfig.default_variant;

const defaultSize = sizeOptions.includes(defaultSizeCandidate)
  ? defaultSizeCandidate
  : sizeOptions.find((size) => size) || 'md';

const defaultVariant = variantOptions.includes(defaultVariantCandidate)
  ? defaultVariantCandidate
  : variantOptions.find((variant) => variant) || 'default';

const formatLabel = (token) =>
  token
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (char) => char.toUpperCase());

const StorySurface = ({ children }) => (
  <div className="bg-background text-foreground border border-border/60 rounded-2xl shadow-sm p-6 space-y-4 w-full max-w-3xl">
    {children}
  </div>
);

export default {
  title: 'Design/Link',
  component: ElementLink,
  args: {
    href: '#',
    children: 'Open link',
    variant: defaultVariant,
    size: defaultSize,
    target: undefined,
    emulate: false,
    hitarea: true,
  },
  argTypes: {
    href: {
      control: 'text',
    },
    children: {
      control: 'text',
    },
    variant: {
      control: {
        type: 'select',
      },
      options: variantOptions,
    },
    size: {
      control: {
        type: 'select',
      },
      options: sizeOptions,
    },
    target: {
      control: 'text',
    },
    emulate: {
      control: 'boolean',
    },
    hitarea: {
      control: 'boolean',
    },
    className: {
      control: 'text',
    },
  },
};

const PlaygroundTemplate = (args) => (
  <StorySurface>
    <ElementLink {...args}>{args.children}</ElementLink>
  </StorySurface>
);

export const Playground = PlaygroundTemplate.bind({});

const SizesTemplate = (args) => (
  <StorySurface>
    <div className="flex flex-col gap-3">
      {sizeOptions.map((size) => (
        <div key={size} className="flex items-center gap-4">
          <span className="w-20 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {size}
          </span>
          <ElementLink {...args} size={size}>
            {`${formatLabel(size)} link`}
          </ElementLink>
        </div>
      ))}
    </div>
  </StorySurface>
);

export const Sizes = SizesTemplate.bind({});
Sizes.args = {
  variant: defaultVariant,
};
Sizes.parameters = {
  controls: {
    exclude: ['size'],
  },
};

const StatesTemplate = (args) => (
  <StorySurface>
    <div className="flex flex-col gap-3">
      {variantOptions.map((variant) => (
        <div key={variant} className="flex items-center gap-4">
          <span className="w-44 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {formatLabel(variant)}
          </span>
          <ElementLink {...args} variant={variant}>
            {`${formatLabel(variant)} state`}
          </ElementLink>
        </div>
      ))}
    </div>
  </StorySurface>
);

export const States = StatesTemplate.bind({});
States.args = {
  size: defaultSize,
};
States.parameters = {
  controls: {
    exclude: ['variant'],
  },
};

export const VariantSizeMatrix = () => (
  <StorySurface>
    <div className="flex flex-col gap-6">
      {variantOptions.map((variant) => (
        <div key={variant} className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold text-muted-foreground">
            {formatLabel(variant)}
          </h4>
          <div className="flex flex-wrap gap-3">
            {sizeOptions.map((size) => (
              <ElementLink
                key={`${variant}-${size}`}
                href="#"
                variant={variant}
                size={size}
              >
                {`${formatLabel(variant)} · ${size}`}
              </ElementLink>
            ))}
          </div>
        </div>
      ))}
    </div>
  </StorySurface>
);
VariantSizeMatrix.parameters = {
  controls: {
    disable: true,
  },
};
