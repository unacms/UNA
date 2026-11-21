import { useTranslation } from 'react-i18next';
import { View } from 'app/design/view';
import { NeoButtonLink } from 'app/design/controls';
import { Block, BlockContent } from 'app/ui/molecules/page/page-block';
import { BlockWrapper } from 'app/components/block-wrapper';
import { useCurrentUser } from 'app/context/user';
import { appSetting, decodeTextNode, findIconFromRemote } from 'app/lib/util';
import {
    DashboardLanguageButton,
    DashboardStatHeader,
    DashboardStatTile,
    DashboardThemeButton,
} from 'app/components/elements/dashboard-stat';

/** A menu item as UNA's API sends it (BxBaseMenu::_getMenuItemAPI). */
interface AccountMenuItem {
    id?: number | string;
    name?: string;
    title?: string;
    link?: string;
    icon?: string;
    addon?: string | number;
    languages?: string[];
}

/** A part of "Your account": the profile, a menu (stats, preferences) or a plain item (Sign out). */
interface AccountPart extends AccountMenuItem {
    /** profile */
    switcher?: boolean;
    /** stats, preferences */
    menu?: { items?: AccountMenuItem[] };
}

export interface AccountDashboardProps {
    data?: { items?: AccountPart[] };
    blockWrapperProps?: Record<string, unknown>;
}

// The tiles' grid follows UNA's Tiles menu template (menu_tiles.html): two, three or four across.
const TILES_GRID = 'grid w-full grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4';
const BUTTONS_GRID = 'grid w-full grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4';

/** A page of the site as an app path, a full link as it is. */
function appHref(link?: string): string {
    const path = String(link || '');
    if (!path || path.startsWith('javascript')) return '';
    if (/^https?:/.test(path) || path.startsWith('/')) return path;
    return `/${path}`;
}

function StatsPart({ items }: Readonly<{ items: AccountMenuItem[] }>) {
    if (!items.length) return null;

    return (
        <View className={TILES_GRID}>
            {items.map((item, index) => (
                <DashboardStatTile
                    key={String(item.id ?? item.name ?? index)}
                    href={appHref(item.link)}
                    icon={findIconFromRemote(item.icon) || undefined}
                    title={decodeTextNode(item.title || '')}
                    count={Number(item.addon) ? item.addon : null}
                    trailing={null}
                />
            ))}
        </View>
    );
}

/**
 * The member's preferences, by item name: Settings is a link, the language and the theme are the app's own switchers
 * (the language one while the app has two or more languages). Any other item Studio adds is a link.
 */
function PreferencesPart({ items }: Readonly<{ items: AccountMenuItem[] }>) {
    const langs: string[] = appSetting('layout', 'avaliable_langs') || [];
    const buttons = items
        .map((item, index) => {
            const key = String(item.id ?? item.name ?? index);
            switch (item.name) {
                case 'switch-language':
                    return langs.length > 1 ? <DashboardLanguageButton key={key} /> : null;

                case 'color-scheme':
                    return <DashboardThemeButton key={key} />;

                default: {
                    const href = appHref(item.link);
                    if (!href) return null;

                    return (
                        <View key={key} className="w-full min-w-0">
                            <NeoButtonLink
                                href={href}
                                label={decodeTextNode(item.title || '')}
                                image={findIconFromRemote(item.icon) || undefined}
                                style="bordered"
                                controlSize="large"
                                width="fill"
                                align="start"
                            />
                        </View>
                    );
                }
            }
        })
        .filter(Boolean);

    if (!buttons.length) return null;

    return <View className={BUTTONS_GRID}>{buttons}</View>;
}

/**
 * "Your account" from the site's dashboard (UNA's sys_dashboard_account menu, service system:account_dashboard): the
 * profile with the profile switcher, the member's stats as tiles (Profile stats), their preferences and Sign out, in
 * the order and with the parts Studio > Navigation gives it.
 */
export default function AccountDashboard(props: Readonly<AccountDashboardProps>) {
    const { t } = useTranslation();
    const { currentUser } = useCurrentUser();
    const parts = props.data?.items || [];

    if (!currentUser || !parts.length) return null;

    return (
        <BlockWrapper {...props.blockWrapperProps}>
            <Block className="u-max-width-block">
                <BlockContent className="!gap-3">
                    {parts.map((part, index) => {
                        const key = String(part.id ?? part.name ?? index);
                        switch (part.name) {
                            case 'profile':
                                return <DashboardStatHeader key={key} switcher={part.switcher !== false} />;

                            case 'stats':
                                return <StatsPart key={key} items={part.menu?.items || []} />;

                            case 'preferences':
                                return <PreferencesPart key={key} items={part.menu?.items || []} />;

                            default: {
                                const href = appHref(part.link);
                                if (!href) return null;

                                return (
                                    <NeoButtonLink
                                        key={key}
                                        href={href}
                                        label={decodeTextNode(part.title || '') || t('Sign out')}
                                        image={findIconFromRemote(part.icon) || undefined}
                                        style="bordered"
                                        controlSize="large"
                                        width="fill"
                                    />
                                );
                            }
                        }
                    })}
                </BlockContent>
            </Block>
        </BlockWrapper>
    );
}
