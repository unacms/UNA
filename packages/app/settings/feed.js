

export const settingsFeed = {
    feed: {
        feed_container: 'relative flex-auto mx-auto w-full max-w-3xl  ',
        post_trigger: ' web:active:bg-card/60 web:active:shadow-border-sm border border-card  rounded-full flex-auto lg:bg-card/60 web:backdrop-blur web:lg:hover:bg-card web:duration-200 web:transition-all web:shadow-border justify-center px-2 lg:px-4 web:group',
        post_trigger_text: 'font-medium text-base text-muted-foreground web:group-hover:text-foreground web:duration-300 web:transition-colors',
        show_html: false,
        default_feed: 'foryou',
        list: [
            { name: 'foryou', icon: 'Sparkle', title: 'For you', showTitle: true },
             { name: 'account', icon: 'Binoculars', title: 'Following', showTitle: true },
            // { name: 'hot', icon: 'Flame', title: 'Hot', showTitle: true },
            // { name: 'public', icon: 'Egg', title: 'Public', showTitle: true },
            // { name: 'channels', icon: 'Hash', title: 'News', showTitle: true },
        ],
        units: {
            bx_market: 'MarketView',
            bx_ads: 'AdView',
            bx_groups: 'GroupView',
            bx_events: 'GroupView',
            bx_courses: 'GroupView',
            bx_spaces: 'GroupView',
            bx_polls: 'PollView',
        },
        actions_menu: {
            show_action: true, // show action part or not
            show_counter: false, // show counter part or not
            show_combined: true, // leave true
            button_show_title_from_size: '',
            button_full_width: false,
            button_size: 'sm',
            button_variant: 'text',
            menu_width: '',
            button_rounded: false,
            justify_items: 'start',
            no_gap_between_buttons: false, // is false no gap between buttons + right margin, is true  gap between buttons + no margin
        },
        counters_menu: {
            show_action: false,
            show_counter: true,
            show_combined: true,
            menu_width: '',
            button_variant: 'ghost',
            rounded: true,
            button_size: 'xs',
            button_rounded: true,
            justify_items: 'between',
            no_gap_between_buttons: false,
        },
        /*
        FOR COMBINED BUTTONS SHOULD BE SET IN THE FOLLOWING WAY:
        , actions_menu : {
            show_action: true,
            show_counter: true,
            show_combined: true,
            }

        */
    },
}