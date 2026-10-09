/**
 * Dev playground page-layout (`/pg`).
 *
 * NeoButton axis gallery. Form kitchen sink lives at `/pg/form`.
 *
 * Mounted via [`apps/next/app/pg/page.js`](apps/next/app/pg/page.js).
 *
 * The page renders every SwiftUI Button axis: roles, styles, controlSize
 * ladder (mini → xlarge with px values), borderShape (capsule / rectangle /
 * roundedRectangle / circle), imagePlacement, custom-children layout,
 * NeoButtonStyleProvider / NeoControlSizeProvider cascades, per-style
 * transition behavior, and a "resolved config" debug strip showing the
 * exact env the resolver picked up (platform / pointer / breakpoint / theme).
 * The Tabs gallery at the end shows the segmented styles that match it
 * (flat = `bordered`, glass = `glass`).
 */

import React from 'react';
import { ScrollView, View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import Page from 'app/ui/molecules/page/page';
import {
    NeoButton, NeoButtonRef,
    NeoButtonStyleProvider, NeoControlSizeProvider,
    useResolvedNeoButton, usePointerCapability,
    resolveScoped,
} from 'app/design/controls/neo-button/neo-button';
import { Icon } from 'app/ui/atoms/icon';
import Tabs from 'app/ui/molecules/tabs/tabs';
import { appSetting } from 'app/lib/util';

function Section({ title, hint, children }) {
    return (
        <View className="mb-8 gap-3">
            <View className="gap-1">
                <Text className="text-lg font-semibold text-foreground">{title}</Text>
                {hint ? <Text className="text-xs text-muted-foreground">{hint}</Text> : null}
            </View>
            <View className="flex-row flex-wrap gap-3 items-center">{children}</View>
        </View>
    );
}

function Stack({ children }) {
    return <View className="w-full gap-2">{children}</View>;
}

/* ---------------------------- Tabs gallery ---------------------------- */

const TAB_TITLES = ['Overview', 'Activity', 'Members', 'Media', 'Settings'];

function demoTabs(count = 3) {
    return TAB_TITLES.slice(0, count).map((title) => ({ key: title.toLowerCase(), title }));
}

function TabsRow({ label, children }) {
    return (
        <View className="w-full gap-1">
            <Text className="font-mono text-xs text-muted-foreground">{label}</Text>
            {children}
        </View>
    );
}

function TabsGallery({ variant }) {
    return (
        <Stack>
            {['sm', 'md', 'lg'].map((size) => (
                <TabsRow key={size} label={`size="${size}"`}>
                    <Tabs variant={variant} size={size} tabs={demoTabs()} equalWidth />
                </TabsRow>
            ))}
            <TabsRow label="rounded hug">
                <Tabs variant={variant} rounded hug tabs={demoTabs()} />
            </TabsRow>
            <TabsRow label='overflow="collapse" (narrow box)'>
                <View className="max-w-xs w-full">
                    <Tabs variant={variant} overflow="collapse" tabs={demoTabs(5)} />
                </View>
            </TabsRow>
            <TabsRow label='overflow="collapse" hug (narrow box)'>
                <View className="max-w-xs w-full">
                    <Tabs variant={variant} overflow="collapse" hug tabs={demoTabs(5)} />
                </View>
            </TabsRow>
            <TabsRow label='overflow="scroll" (narrow box)'>
                <View className="max-w-xs w-full">
                    <Tabs variant={variant} tabs={demoTabs(5)} />
                </View>
            </TabsRow>
        </Stack>
    );
}

/* ---------------------- Sizes resolver chart -------------------------- */

// Synthetic resolver contexts. The chart runs `resolveScoped` against each
// of these so you can see how `neo_button.controlSizes` flattens for every
// platform / pointer combination side-by-side, without having to actually
// open the page on a phone or resize the window.
const SCOPE_MATRIX = [
    { id: 'default',       label: 'default',         platform: '',        pointer: '' },
    { id: 'web-mouse',     label: 'web · mouse',     platform: 'web',     pointer: 'mouse' },
    { id: 'web-touch',     label: 'web · touch',     platform: 'web',     pointer: 'touch' },
    { id: 'ios',           label: 'ios · touch',     platform: 'ios',     pointer: 'touch' },
    { id: 'android',       label: 'android · touch', platform: 'android', pointer: 'touch' },
];

const SIZE_FIELDS = [
    { key: 'height',   label: 'h' },
    { key: 'paddingX', label: 'pad' },
    { key: 'font',     label: 'font' },
    { key: 'icon',     label: 'icon' },
    { key: 'hitSlop',  label: 'slop' },
    { key: 'labelGap', label: 'gap' },
];

function ScopeBadge({ label }) {
    return (
        <Text className="font-mono text-xs text-muted-foreground">{label}</Text>
    );
}

function Cell({ children, head = false, mono = true, dim = false }) {
    return (
        <View className="px-2 py-1 min-w-12 border-b border-border/40">
            <Text
                className={[
                    head ? 'text-xs font-semibold text-foreground' : (mono ? 'font-mono text-xs' : 'text-xs'),
                    dim ? 'text-muted-foreground' : 'text-foreground',
                ].join(' ')}
            >
                {children}
            </Text>
        </View>
    );
}

function SizesResolverChart() {
    const tree = appSetting('theme', 'neo_button');
    const controlSizes = tree?.controlSizes || {};
    const shapesTree = tree?.borderShapes || {};
    const sizeIds = ['mini', 'small', 'regular', 'large', 'xlarge'];

    return (
        <View className="mb-8 gap-3">
            <View className="gap-1">
                <Text className="text-lg font-semibold text-foreground">
                    Sizes resolver chart
                </Text>
                <Text className="text-xs text-muted-foreground">
                    `neo_button.controlSizes` flattened by `resolveScoped()` for every platform/pointer combination.
                    Cells with the same value across all rows mean the size is unscoped at that field.
                    Mismatched cells highlight where the resolver picked up a per-platform / per-pointer override.
                </Text>
            </View>

            {sizeIds.map((sizeId) => {
                const raw = controlSizes[sizeId];
                if (!raw) return null;

                // Build one resolved row per scope.
                const rows = SCOPE_MATRIX.map((scope) => {
                    const ctx = {
                        platform: scope.platform || undefined,
                        pointer:  scope.pointer  || undefined,
                        breakpoint: '',
                        theme: 'light',
                        controlSize: sizeId,
                    };
                    const resolved = resolveScoped(raw, ctx) || {};
                    // Per-controlSize roundedRectangle override
                    const rrShape = shapesTree?.roundedRectangle?.rounded;
                    const rounded = typeof rrShape === 'string'
                        ? rrShape
                        : (resolveScoped(rrShape, ctx) || rrShape?.default);
                    return { scope, resolved, rounded };
                });

                // Detect which cells differ from the `default` row so we can
                // visually highlight overrides.
                const baseRow = rows[0].resolved;
                const baseRounded = rows[0].rounded;
                const isOverride = (row, key) =>
                    row.scope.id !== 'default' && JSON.stringify(row.resolved[key]) !== JSON.stringify(baseRow[key]);
                const isRoundedOverride = (row) =>
                    row.scope.id !== 'default' && row.rounded !== baseRounded;

                return (
                    <View key={sizeId} className="rounded-xl border border-border/60 overflow-hidden">
                        <Row className="flex-row items-center justify-between px-3 py-2 bg-muted/40">
                            <Text className="text-sm font-semibold text-foreground">
                                controlSize: <Text className="font-mono">{sizeId}</Text>
                            </Text>
                            <ScopeBadge label={`borderShape.roundedRectangle → ${baseRounded}`} />
                        </Row>

                        {/* Header row */}
                        <Row className="flex-row">
                            <Cell head><Text>scope</Text></Cell>
                            {SIZE_FIELDS.map((f) => (
                                <Cell key={f.key} head>{f.label}</Cell>
                            ))}
                            <Cell head><Text>rounded</Text></Cell>
                        </Row>

                        {/* Data rows */}
                        {rows.map(({ scope, resolved, rounded }) => (
                            <Row key={scope.id} className="flex-row">
                                <Cell mono dim={scope.id === 'default'}>
                                    {scope.label}
                                </Cell>
                                {SIZE_FIELDS.map((f) => {
                                    const v = resolved[f.key];
                                    const display = v === undefined || v === null ? '—' :
                                        (typeof v === 'object' ? JSON.stringify(v) : String(v));
                                    return (
                                        <Cell
                                            key={f.key}
                                            mono
                                            dim={!isOverride({ scope, resolved }, f.key)}
                                        >
                                            {display}
                                        </Cell>
                                    );
                                })}
                                <Cell mono dim={!isRoundedOverride({ scope, rounded })}>
                                    {rounded || '—'}
                                </Cell>
                            </Row>
                        ))}
                    </View>
                );
            })}
        </View>
    );
}

/**
 * Debug strip — calls the resolver hook directly so we can show what the
 * environment looks like for the current device.
 */
function ResolvedDebug() {
    const resolved = useResolvedNeoButton({});
    const pointer = usePointerCapability();
    const env = resolved.env;
    return (
        <View className="mb-8 p-4 rounded-xl bg-muted/40 gap-1">
            <Text className="text-sm font-semibold text-foreground">
                Resolver env (this device)
            </Text>
            <Text className="text-xs text-muted-foreground">
                platform: <Text className="font-mono text-foreground">{env.platform}</Text>
                {' · '}
                pointer: <Text className="font-mono text-foreground">{pointer}</Text>
                {' · '}
                breakpoint: <Text className="font-mono text-foreground">{env.breakpoint || '(below sm)'}</Text>
                {' · '}
                theme: <Text className="font-mono text-foreground">{env.theme}</Text>
            </Text>
            <Text className="text-xs text-muted-foreground">
                default `regular` height resolved to:{' '}
                <Text className="font-mono text-foreground">{resolved.height}px</Text>
                {' · '}paddingX: <Text className="font-mono text-foreground">{resolved.paddingX}px</Text>
                {' · '}icon: <Text className="font-mono text-foreground">{resolved.iconSize}px</Text>
            </Text>
            <Text className="text-xs text-muted-foreground">
                native mapping: <Text className="font-mono text-foreground">{JSON.stringify(resolved.nativeMapping)}</Text>
            </Text>
        </View>
    );
}

export default function PageLayoutPlayground({ data, children }) {
    const [boldOn, setBoldOn] = React.useState(false);
    const [italicOn, setItalicOn] = React.useState(false);
    const [menuOpen, setMenuOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const buttonRef = React.useRef(null);

    return (
        <Page data={data || { uri: 'playground' }}>
            <ScrollView className="flex-1 bg-background">
                <View className="p-6 gap-2 max-w-5xl mx-auto w-full">
                    <Text className="text-2xl font-semibold text-foreground">
                        Playground
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                        Open at /pg. Form kitchen sink is at /pg/form.
                    </Text>
                </View>

                <View className="px-6 pb-12 max-w-5xl mx-auto w-full">

                    <ResolvedDebug />

                    <SizesResolverChart />

                    <Section
                        title="Primary Actions"
                        hint="Common footer and form actions. Hold the mouse down on desktop to inspect the default press scale."
                    >
                        <NeoButton style="borderedProminent" label="Publish" image="Send" onPress={() => {}} />
                        <NeoButton style="bordered" label="Save draft" image="Save" onPress={() => {}} />
                        <NeoButton style="borderless" label="Preview" image="Eye" onPress={() => {}} />
                        <NeoButton style="plain" label="Cancel" role="cancel" onPress={() => {}} />
                    </Section>

                    <Section
                        title="Style Recipes"
                        hint="Every SwiftUI-style recipe as a complete button instance, with press handlers so transition behavior is visible."
                    >
                        <NeoButton style="plain" label="Plain" image="PenLine" onPress={() => {}} />
                        <NeoButton style="bordered" label="Bordered" image="Settings" onPress={() => {}} />
                        <NeoButton style="borderedProminent" label="Prominent" image="Check" onPress={() => {}} />
                        <NeoButton style="borderless" label="Borderless" image="Sparkles" onPress={() => {}} />
                        <NeoButton style="link" label="Open details" image="ExternalLink" imagePlacement="trailing" onPress={() => {}} />
                        <NeoButton style="glass" label="Glass" image="Layers" onPress={() => {}} />
                        <NeoButton style="glassProminent" label="Glass CTA" image="Rocket" onPress={() => {}} />
                    </Section>

                    <Section
                        title="Control Sizes"
                        hint="Use small controls for toolbars, regular for most actions, and large/xlarge for high-emphasis rows or onboarding."
                    >
                        <NeoButton style="bordered" controlSize="mini" label="Mini" image="Plus" onPress={() => {}} />
                        <NeoButton style="bordered" controlSize="small" label="Small" image="Plus" onPress={() => {}} />
                        <NeoButton style="borderedProminent" controlSize="regular" label="Regular" image="Plus" onPress={() => {}} />
                        <NeoButton style="borderedProminent" controlSize="large" label="Large action" image="Plus" onPress={() => {}} />
                        <NeoButton style="glassProminent" controlSize="xlarge" label="Get started" image="ArrowRight" imagePlacement="trailing" onPress={() => {}} />
                    </Section>

                    <Section
                        title="Shapes"
                        hint="Border shape is independent from style, so shape examples use realistic icon or action copy."
                    >
                        <NeoButton style="borderedProminent" borderShape="capsule" label="Follow" image="UserPlus" onPress={() => {}} />
                        <NeoButton style="bordered" borderShape="roundedRectangle" label="Duplicate" image="Copy" onPress={() => {}} />
                        <NeoButton style="bordered" borderShape="rectangle" label="Grid cell" image="Square" onPress={() => {}} />
                        <NeoButton style="borderedProminent" borderShape="circle" image="Plus" accessibilityLabel="Create" onPress={() => {}} />
                    </Section>

                    <Section
                        title="Roles"
                        hint="SwiftUI Button(role:). `confirm` defaults to prominent; `destructive` tints safe secondary actions red unless you choose a prominent style."
                    >
                        <NeoButton role="default" label="Default" image="Circle" onPress={() => {}} />
                        <NeoButton role="cancel" label="Cancel" onPress={() => {}} />
                        <NeoButton role="confirm" label="Confirm" image="Check" onPress={() => {}} />
                        <NeoButton role="close" accessibilityLabel="Close panel" onPress={() => {}} />
                        <NeoButton role="destructive" style="bordered" label="Delete" image="Trash" onPress={() => {}} />
                        <NeoButton role="destructive" style="borderedProminent" label="Delete forever" image="Trash2" onPress={() => {}} />
                    </Section>

                    <Section
                        title="Icon Placement"
                        hint="SwiftUI Label(title:image:) defaults to leading image placement; trailing is useful for forward navigation."
                    >
                        <NeoButton style="bordered" label="Save changes" image="Save" onPress={() => {}} />
                        <NeoButton style="bordered" label="Continue" image="ArrowRight" imagePlacement="trailing" onPress={() => {}} />
                        <NeoButton style="bordered" image="Search" accessibilityLabel="Search" onPress={() => {}} />
                        <NeoButton style="borderedProminent" label="Upload file" image="Upload" onPress={() => {}} />
                    </Section>

                    <Section
                        title="List Rows"
                        hint="Children replace label/image rendering, which is the right path for rows with avatar, metadata, badges, and chevrons."
                    >
                        <Stack>
                            <NeoButton style="bordered" width="fill" align="start" controlSize="large" onPress={() => {}}>
                                <Row className="flex-row items-center gap-3 flex-1">
                                    <View className="w-9 h-9 rounded-full bg-primary items-center justify-center">
                                        <Text className="text-primary-foreground font-semibold">YK</Text>
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-foreground font-medium">Alex Johnson</Text>
                                        <Text className="text-muted-foreground text-xs">View profile and account settings</Text>
                                    </View>
                                    <Icon icon="ChevronRight" size={20} className="text-muted-foreground" />
                                </Row>
                            </NeoButton>
                            <NeoButton style="bordered" width="fill" align="start" controlSize="large" onPress={() => {}}>
                                <Row className="flex-row items-center gap-3 flex-1">
                                    <Icon icon="FileText" size={22} className="text-foreground" />
                                    <View className="flex-1">
                                        <Text className="text-foreground font-medium">Product brief.md</Text>
                                        <Text className="text-muted-foreground text-xs">Edited 5 minutes ago · Markdown</Text>
                                    </View>
                                    <Text className="text-xs text-muted-foreground">12 KB</Text>
                                    <Icon icon="ChevronRight" size={20} className="text-muted-foreground" />
                                </Row>
                            </NeoButton>
                        </Stack>
                    </Section>

                    <Section
                        title="Toggle (selected)"
                        hint="`selected` gives the sticky pressedToggle state + aria-pressed (Bold-in-editor, opened menu)."
                    >
                        <NeoButton
                            style="borderless"
                            controlSize="small"
                            image="Bold"
                            selected={boldOn}
                            accessibilityLabel="Bold"
                            onPress={() => setBoldOn((x) => !x)}
                        />
                        <NeoButton
                            style="borderless"
                            controlSize="small"
                            image="Italic"
                            selected={italicOn}
                            accessibilityLabel="Italic"
                            onPress={() => setItalicOn((x) => !x)}
                        />
                        <NeoButton
                            style="bordered"
                            label="Options"
                            image={menuOpen ? 'ChevronUp' : 'ChevronDown'}
                            imagePlacement="trailing"
                            selected={menuOpen}
                            onPress={() => setMenuOpen((x) => !x)}
                        />
                    </Section>

                    <Section
                        title="Loading"
                        hint="Replaces the image with a spinner; rest of the label stays put."
                    >
                        <NeoButton
                            style="borderedProminent"
                            label="Save"
                            loadingLabel="Saving…"
                            image="Save"
                            loading={loading}
                            onPress={() => {
                                setLoading(true);
                                setTimeout(() => setLoading(false), 1500);
                            }}
                        />
                    </Section>

                    <Section
                        title="Tint"
                        hint="SwiftUI .tint() analog. Inline style on the surface for borderedProminent (replaces bg); recolours text/image elsewhere."
                    >
                        <NeoButton style="bordered" tint="#ff6347" label="Favorite" image="Heart" onPress={() => {}} />
                        <NeoButton style="borderedProminent" tint="#ff6347" label="Boost post" image="Megaphone" onPress={() => {}} />
                        <NeoButton style="glassProminent" tint="#0a84ff" label="iOS primary" image="Heart" onPress={() => {}} />
                        <NeoButton style="glassProminent" tint="#34c759" label="Approve" image="Check" onPress={() => {}} />
                        <NeoButton style="borderless" tint="#ff6347" label="Report" image="Flag" onPress={() => {}} />
                        <NeoButton style="link" tint="#ff6347" label="Learn more" image="ExternalLink" imagePlacement="trailing" onPress={() => {}} />
                        <NeoButton role="destructive" style="bordered" label="Delete" image="Trash" onPress={() => {}} />
                    </Section>

                    <Section
                        title="width / align"
                        hint="`width=fill` adds w-full; align maps to justify-{start|center|end|between}."
                    >
                        <Stack>
                            <NeoButton style="bordered" width="fill" align="start" label="Left aligned" image="AlignLeft" onPress={() => {}} />
                            <NeoButton style="bordered" width="fill" align="center" label="Centered action" image="CircleDot" onPress={() => {}} />
                            <NeoButton style="bordered" width="fill" align="end" label="Right aligned" image="ChevronRight" imagePlacement="trailing" onPress={() => {}} />
                            <NeoButton style="bordered" width="fill" align="between" onPress={() => {}}>
                                <Row className="flex-row items-center justify-between flex-1">
                                    <Row className="flex-row items-center gap-2">
                                        <Icon icon="UserRound" size={20} className="text-foreground" />
                                        <Text className="text-foreground font-medium">Account</Text>
                                    </Row>
                                    <Icon icon="ChevronRight" size={20} className="text-muted-foreground" />
                                </Row>
                            </NeoButton>
                        </Stack>
                    </Section>

                    <Section
                        title="NeoButtonStyleProvider cascade"
                        hint="Mirrors SwiftUI's .buttonStyle() applied at a parent. All descendants without an explicit `style` prop inherit the provider's style."
                    >
                        <NeoButtonStyleProvider style="glass">
                            <NeoButton label="Inherits glass" image="Sparkles" onPress={() => {}} />
                            <NeoButton label="Override to bordered" image="Settings" style="bordered" onPress={() => {}} />
                            <NeoButton label="Also glass" image="Star" onPress={() => {}} />
                        </NeoButtonStyleProvider>
                    </Section>

                    <Section
                        title="NeoControlSizeProvider cascade"
                        hint="Mirrors SwiftUI's .controlSize() applied at a parent."
                    >
                        <NeoControlSizeProvider size="large">
                            <NeoButton style="borderedProminent" label="Large primary" image="Check" onPress={() => {}} />
                            <NeoButton style="bordered" label="Large secondary" image="MessageCircle" onPress={() => {}} />
                            <NeoButton style="bordered" controlSize="mini" label="Mini override" image="Plus" onPress={() => {}} />
                        </NeoControlSizeProvider>
                    </Section>

                    <Section
                        title="Per-style transitions"
                        hint="Each example is pressable. Hold down on desktop to compare the default scale spring, opacity override, and disabled transition."
                    >
                        <NeoButton style="bordered" label="Default scale" image="MousePointerClick" onPress={() => {}} />
                        <NeoButton style="borderedProminent" label="Prominent scale" image="MousePointerClick" onPress={() => {}} />
                        <NeoButton style="glass" label="Glass scale" image="Layers" onPress={() => {}} />
                        <NeoButton style="plain" label="No transition" onPress={() => {}} />
                        <NeoButton style="link" label="Link, no transition" onPress={() => {}} />
                        <NeoButton
                            style="bordered"
                            label="Override: opacity"
                            transition={{ press: { type: 'opacity', from: 1, to: 0.6, duration: 80 } }}
                            onPress={() => {}}
                        />
                        <NeoButton
                            style="bordered"
                            label="Override: none"
                            transition={{ press: false }}
                            onPress={() => {}}
                        />
                    </Section>

                    <Section
                        title="Disabled States"
                        hint="Disabled buttons still show their role, style, tint, and label treatment without accepting press events."
                    >
                        <NeoButton style="plain" label="Plain" disabled onPress={() => {}} />
                        <NeoButton style="bordered" label="Save draft" image="Save" disabled onPress={() => {}} />
                        <NeoButton style="borderedProminent" label="Publish" image="Send" disabled onPress={() => {}} />
                        <NeoButton style="borderless" label="Preview" image="Eye" disabled onPress={() => {}} />
                        <NeoButton style="link" label="Open details" disabled onPress={() => {}} />
                        <NeoButton style="glass" label="Glass" image="Layers" disabled onPress={() => {}} />
                        <NeoButton style="glassProminent" label="Glass CTA" image="Rocket" disabled onPress={() => {}} />
                    </Section>

                    <Section
                        title="Focus ring"
                        hint="Tab to focus. Default is on for web, off for native. Override per-instance with focusRing='auto' | 'never'."
                    >
                        <NeoButton style="borderedProminent" label="Auto ring" onPress={() => {}} />
                        <NeoButton style="borderedProminent" label="No ring" focusRing="never" onPress={() => {}} />
                    </Section>

                    <Section
                        title="classNames overrides"
                        hint="Per-slot escape hatch (root / container / text / image / surface / ring)."
                    >
                        <NeoButton
                            style="bordered"
                            label="Custom text colour"
                            onPress={() => {}}
                            classNames={{ text: 'text-pink-600 italic' }}
                        />
                        <NeoButton
                            style="bordered"
                            label="Wide"
                            image="Star"
                            onPress={() => {}}
                            classNames={{ container: 'px-8', image: 'text-yellow-500' }}
                        />
                    </Section>

                    <Section
                        title={'Tabs: flat (variant="default")'}
                        hint="Translucent bg-muted/60 rail with NeoButton bordered pill colours; the pill is lighter in both schemes."
                    >
                        <TabsGallery variant="default" />
                    </Section>

                    <Section
                        title={'Tabs: glass (variant="glass")'}
                        hint="NeoButton glass: blurred track with the glass ring, a lighter lens as the pill. Shown on a tinted backdrop."
                    >
                        <View className="w-full rounded-2xl p-4 bg-primary/15">
                            <TabsGallery variant="glass" />
                        </View>
                    </Section>

                    <Section
                        title={'Tabs: underline (variant="secondary")'}
                        hint="indicator: 'line'."
                    >
                        <TabsGallery variant="secondary" />
                    </Section>

                    <Section
                        title="Tabs: trackClassName + pillClassName"
                        hint="A muted track hides the flat pill in dark mode; pillClassName lifts it per instance."
                    >
                        <Stack>
                            <TabsRow label='trackClassName="bg-muted"'>
                                <Tabs trackClassName="bg-muted" tabs={demoTabs()} equalWidth />
                            </TabsRow>
                            <TabsRow label='trackClassName="bg-muted" pillClassName="bg-popover dark:bg-foreground/20"'>
                                <Tabs
                                    trackClassName="bg-muted"
                                    pillClassName="bg-popover dark:bg-foreground/20"
                                    tabs={demoTabs()}
                                    equalWidth
                                />
                            </TabsRow>
                        </Stack>
                    </Section>

                    <Section
                        title="Forwarded ref"
                        hint="NeoButtonRef forwards the ref to the underlying Pressable."
                    >
                        <NeoButtonRef
                            ref={buttonRef}
                            style="borderedProminent"
                            label="Click then focus me"
                            onPress={() => buttonRef.current?.focus?.()}
                        />
                    </Section>

                    {children}
                </View>
            </ScrollView>
        </Page>
    );
}