

export const settingsBrowse = {
    browse: {
        new_skeletons : true,
        margin: 'mb-3',
        stale_time: 30000,
        per_line: [/* only for images for now*/ 
            { width: 1280, count: 4 },
            { width: 1024, count: 4 },
            { width: 768, count: 3 },
            { width: 640, count: 2 },
        ],
        show_in_modal:{
            bx_posts: true,
            bx_timeline: true
        },
        unit_by_source: {
            'system/browse_friends': 'person_friends',
            'system/browse_recommendations_friends': 'person_friends_recommendations',
            'system/browse_invitations': 'invitations_in_context',
            'system/browse_friend_requested': 'person_friend_requested',
            'system/browse_friend_requests': 'browse_friend_requests',
            'system/browse_recommendations_subscriptions': 'person_following_recommendations',
            'system/browse_subscribed_me': 'person_followers',
            'browse_subscriptions': 'person_following',
            'r=bx_events': 'event',
            'r=bx_groups': 'group',
            'r=bx_timeline': 'feed',
        },
        skeletons: {
            'person_friends': 'bx_persons',
            'person_friends_recommendations': 'bx_persons',
            'person_friend_requested': 'bx_persons',
            'browse_friend_requests': 'bx_persons',
            'person_following_recommendations': 'bx_persons',
            'person_followers': 'bx_persons',
            'person_following': 'bx_persons',

            'invitations_in_context': 'bx_invitations',

            'group': 'bx_groups',
            'event': 'bx_events',
        
        },
        unit_by_mode_default: {
            context: 'Base',
            search: 'Search',
            default: 'Base',
        },
        unit_by_mode_bx_posts: {
            small: 'Small',
            context: 'Small',
            search: 'Search',
            default: 'Base',
        },
        unit_by_mode_bx_forum: {
            small: 'Small',
            context: 'Small',
            default: 'Base',
        },
    }
}