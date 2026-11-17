

export const settingsSocialActions = {
    social_actions: {
        like: {
            show_action: true,
            show_action_as_button: true,
            show_action_label: true,
            show_counter: true,
            show_counter_as_button: false,
            haptics_type: 'Medium',
        },
        star: {
            show_action: true,
            show_action_as_button: true,
            show_action_label: false,
            show_counter: true,
            show_counter_as_button: false,
            haptics_type: 'Medium',
        },
        reaction: {
            show_action: true,
            show_action_as_button: true,
            show_action_label: true,
            show_counter: true,
            show_counter_style: 'compound', //'compound' or 'divided'
            show_counter_as_button: false,
            haptics_type: 'Medium',
            icon_type_web: 'svg', //'svg' or 'emoji'
            icon_type_native: 'emoji', //'emoji' only
            items: [
                { id: 1, name: 'like' },
                { id: 2, name: 'love' },
                { id: 3, name: 'joy' },
                { id: 4, name: 'surprise' },
                { id: 5, name: 'sadness' },
                { id: 6, name: 'anger' },
            ],
            haptics_type: 'Medium',
            iconset: {
                web: {
                    default: { svg: 'Smile', emoji: '🙂' },
                    like: { svg: 'ThumbsUp', emoji: '👍' },
                    love: { svg: 'Heart', emoji: '🥰' },
                    joy: { svg: 'Laugh', emoji: '😂' },
                    surprise: { svg: 'Smile', emoji: '😮' }, // Using Smile as fallback for surprise
                    sadness: { svg: 'Frown', emoji: '😔' },
                    anger: { svg: 'Angry', emoji: '😠' },
                },
                native: {
                    default: { svg: 'Smile', emoji: '🙂' },
                    like: { svg: '', emoji: '👍' },
                    love: { svg: '', emoji: '🥰' },
                    joy: { svg: '', emoji: '😂' },
                    surprise: { svg: '', emoji: '😮' },
                    sadness: { svg: '', emoji: '😔' },
                    anger: { svg: '', emoji: '😠' },
                },
            },
        },
        score: {
            show_action: true,
            show_action_as_button: true,
            show_action_label: false,
            show_counter: true,
            show_counter_as_button: false,
            haptics_type: 'Medium',
        },
        comment: {
            show_action: true,
            show_action_as_button: true,
            show_action_label: true,
            show_counter: true,
            show_counter_as_button: false,
            haptics_type: 'Medium',
        },
        report: {
            show_action: true,
            show_action_as_button: true,
            show_action_label: true,
            show_counter: true,
            show_counter_as_button: false,
            haptics_type: 'Medium',
        },
        repost: {
            show_action: true,
            show_action_as_button: true,
            show_action_label: true,
            show_counter: false,
            show_counter_as_button: false,
            haptics_type: 'Medium',
        },
        share: {
            show_action: true,
            show_action_as_button: false,
            show_action_label: true,
            haptics_type: 'Medium',
        },
        // Connection icons are UNA's (BxBaseConnectionFriend / BxBaseConnectionSubscription /
        // BxBaseModGroupsConnectionFans / BxEventsConnectionFans): change both together.
        connection: {
            show_action_as_button: true,
            sys_profiles_friends: {
                icons: { add: 'UserRoundPlus', remove: 'UserRoundX' },
            },
            sys_profiles_subscriptions: {
                icons: { add: 'CirclePlus', remove: 'CircleMinus' },
            },
            // A membership (`*_fans`: groups, spaces, organizations ...): Join, Joined, Leave.
            fans: {
                icons: { add: 'LogIn', remove: 'LogOut', default: 'UsersRound' },
            },
            // An event's: Attend, Going, Not going.
            bx_events_fans: {
                icons: { add: 'CalendarPlus', remove: 'CalendarX', default: 'CalendarCheck' },
            },
        },
        // A toggle: the button shows its state (`add`, or `default` once made or asked for), its menu's rows their
        // actions (lib/connection-icons.ts).
        connection_ext: {
            show_action_as_button: true,
            sys_profiles_friends: {
                icons: { add: 'UserRoundPlus', remove: 'UserRoundX', default: 'UserRoundCheck' },
            },
            sys_profiles_subscriptions: {
                icons: { add: 'CirclePlus', remove: 'CircleMinus', default: 'CircleCheck' },
            },
            // A membership (`*_fans`: groups, spaces, organizations ...): Join, Joined, Leave.
            fans: {
                icons: { add: 'LogIn', remove: 'LogOut', default: 'UsersRound' },
            },
            // An event's: Attend, Going, Not going.
            bx_events_fans: {
                icons: { add: 'CalendarPlus', remove: 'CalendarX', default: 'CalendarCheck' },
            },
        },
        recommendation: {
            show_action_as_button: true,
        },
        feature: {
            show_action_as_button: true,
            haptics_type: 'Medium',
        },
        favorite: {
            show_action: true,
            show_action_as_button: true,
            show_action_label: true,
            show_counter: true,
            show_counter_as_button: false,
            haptics_type: 'Medium',
        },
    }
}