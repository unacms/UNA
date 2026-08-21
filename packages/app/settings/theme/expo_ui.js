/**
 * Expo UI theme — native SwiftUI / Material mappings.
 * Master switch: appSetting('native', 'expo_ui_buttons') in settings/configs.js.
 * Read button config: appSetting('theme', 'expo_ui', 'button').
 */
export const settingsExpoUi = {
    expo_ui: {
        // Unmapped icons, custom children, long-press, and selected on
        // non-glass styles stay JS-styled. Unselected glass has no tint so
        // iOS can invert label/icon color. Selected glass stays Expo UI
        // `.plain` + `glassEffect` tint from iosColors.glass.selected
        // (liquid glass wash + accent-foreground label). Addon counters
        // render as a SwiftUI child on glass — they do not fall back to JS.
        button: {
            styles: true,
            androidVariants: {
                plain: 'text',
                borderless: 'text',
                link: 'text',
                bordered: 'tonal',
                borderedProminent: 'filled',
                glass: 'elevated',
                glassProminent: 'filled',
            },
            // Hex only — CSS variables do not resolve inside a native Host.
            androidColors: {
                tonal: {
                    default: {
                        containerColor: '#e4e4e7',
                        contentColor: '#27272a',
                        tintedContainerColor: '#dbeafe',
                    },
                    dark: {
                        containerColor: '#27272a',
                        contentColor: '#e4e4e7',
                        tintedContainerColor: '#172554',
                    },
                },
                elevated: {
                    default: {
                        containerColor: '#e4e4e7',
                        contentColor: '#27272a',
                        tintedContainerColor: '#dbeafe',
                        tintedContentColor: '#2563eb',
                    },
                    dark: {
                        containerColor: '#27272a',
                        contentColor: '#e4e4e7',
                        tintedContainerColor: '#172554',
                        tintedContentColor: '#bfdbfe',
                    },
                },
                text: {
                    default: { contentColor: '#27272a' },
                    dark: { contentColor: '#e4e4e7' },
                },
                filled: {
                    default: { containerColor: '#2563eb', contentColor: '#fafafc' },
                },
            },
            iosTint: null,
            iosColors: {
                bordered: {
                    default: { tint: '#e4e4e7', foreground: '#27272a' },
                    dark: { tint: '#27272a', foreground: '#e4e4e7' },
                },
                plain: {
                    default: { tint: '#27272a' },
                    dark: { tint: '#e4e4e7' },
                },
                borderless: {
                    default: { tint: '#27272a' },
                    dark: { tint: '#e4e4e7' },
                },
                glass: {
                    // Resting: no tint — label/icon invert over dark content.
                    // Selected: tint = liquid-glass wash, foreground = label/icon.
                    // iOS applies tint via `glassEffect`, not `.glassProminent`.
                    selected: {
                        default: { tint: '#dbeafe', foreground: '#2563eb' },
                        dark: { tint: '#172554', foreground: '#bfdbfe' },
                    },
                },
                link: { default: { tint: '#2563eb' } },
                borderedProminent: { default: { tint: '#2563eb' } },
                glassProminent: { default: { tint: '#2563eb' } },
            },
            // Native label type. Null still applies size/weight from
            // `neo_button.controlSizes.*.font` and style text (`font-medium`).
            // Override: { size: 15, weight: 'semibold', family: 'Inter' }
            // (`family` is a PostScript name — not CSS `font-main`).
            iosFont: null,
            iosIconSize: {
                mini: 14,
                small: 16,
                regular: 20,
                large: 24,
                extraLarge: 28,
            },
            iosControlSize: null,
            // Discrete SF Symbol effect on press (iOS 17+). `false` to disable.
            // Per-icon override: `{ name: 'bell.fill', effect: 'wiggle' }`.
            iosSymbolEffect: { effect: 'bounce' },
            iosSymbols: {
                Plus: 'plus',
                X: 'xmark',
                ChevronLeft: 'chevron.left',
                ChevronRight: 'chevron.right',
                ChevronUp: 'chevron.up',
                ChevronDown: 'chevron.down',
                ArrowLeft: 'arrow.left',
                ArrowRight: 'arrow.right',
                Search: 'magnifyingglass',
                Ellipsis: 'ellipsis',
                Pencil: 'pencil',
                Trash: 'trash',
                Check: 'checkmark',
                Image: 'photo',
                ImagePlus: 'photo.badge.plus',
                Paperclip: 'paperclip',
                ChartBarBig: 'chart.bar',
                Video: 'video',
                Film: 'film',
                File: 'doc',
                FileText: 'text.page',
                Calendar: 'calendar',
                CalendarPlus: 'calendar.badge.plus',
                List: 'list.bullet',
                ListChecks: 'checklist',
                CheckSquare: 'checkmark.square',
                CircleStar: 'star.circle',
                MessageCircleMore: 'message',
                MessagesSquare: 'bubble.left.and.text.bubble.right',
                Share2: 'square.and.arrow.up',
                SendHorizontal: 'paperplane',
                Send: 'paperplane',
                ScrollText: 'scroll',
                Hash: 'number',
                Info: 'info.circle',
                Clock: 'clock',
                Cog: 'gearshape',
                UserRound: 'person',
                UsersRound: 'person.2',
                UserPlus: 'person.badge.plus',
                Building2: 'building.2',
                Store: 'cart',
                LibraryBig: 'books.vertical',
                LayoutDashboard: 'square.grid.2x2',
                Wallet: 'wallet.pass',
                LogOut: 'rectangle.portrait.and.arrow.right',
                Wand: 'wand.and.stars',
                SquareStack: 'square.stack',
                Clipboard: 'doc.on.clipboard',
                RotateCw: 'arrow.clockwise',
                Award: 'rosette',
                BadgeCheck: 'checkmark.seal',
                House: 'house',
                Bell: 'bell',
                Compass: 'safari',
                Contact: 'person.crop.circle',
            },
            androidIcons: null,
        },
        tabs: {
            // NativeTabs (UITabBar / Material 3): Lucide → SF Symbol + MD icon.
            // `selected` is the filled variant. Unlisted icons fall back to button.iosSymbols.
            icons: {
                House: { sf: { default: 'house', selected: 'house.fill' }, md: 'home' },
                UsersRound: { sf: { default: 'person.2', selected: 'person.2.fill' }, md: 'group' },
                MessageCircleMore: { sf: { default: 'message', selected: 'message.fill' }, md: 'chat' },
                Bell: { sf: { default: 'bell', selected: 'bell.fill' }, md: 'notifications' },
                Award: { sf: { default: 'rosette', selected: 'rosette.fill' }, md: 'military_tech' },
                Compass: { sf: { default: 'safari', selected: 'safari.fill' }, md: 'explore' },
                Info: { sf: { default: 'info.circle', selected: 'info.circle.fill' }, md: 'info' },
                Contact: { sf: { default: 'person.crop.circle', selected: 'person.crop.circle.fill' }, md: 'contacts' },
                LayoutDashboard: { sf: { default: 'square.grid.2x2', selected: 'square.grid.2x2.fill' }, md: 'dashboard' },
            },
        },
    },
};
