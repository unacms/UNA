<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 */

$aConfig = array(
    /**
     * Main Section.
     */
    'title' => 'Russian',
    'version_from' => '15.0.8',
    'version_to' => '15.0.9',
    'vendor' => 'UNA INC',

    'compatible_with' => array(
        '15.0.0-RC5'
    ),

    /**
     * 'home_dir' and 'home_uri' - should be unique. Don't use spaces in 'home_uri' and the other special chars.
     */
    'home_dir' => 'boonex/russian/updates/update_15.0.8_15.0.9/',
    'home_uri' => 'ru_update_1508_1509',

    'module_dir' => 'boonex/russian/',
    'module_uri' => 'ru',

    'db_prefix' => 'bx_rsn_',
    'class_prefix' => 'BxRsn',

    /**
     * Installation/Uninstallation Section.
     */
    'install' => array(
        'update_files' => 1,
        'execute_sql' => 1,
        'update_languages' => 1,
        'restore_languages' => 0,
        'clear_db_cache' => 1,
    ),

    /**
     * Category for language keys.
     */
    'language_category' => array(
        array('name' => 'Ads', 'path' => 'bx_ads/'),
        array('name' => 'Albums', 'path' => 'bx_albums/'),
        array('name' => 'Analytics', 'path' => 'bx_analytics/'),
        array('name' => 'Antispam', 'path' => 'bx_antispam/'),
        array('name' => 'Boonex Artificer Template', 'path' => 'bx_artificer/'),
        array('name' => 'Channels', 'path' => 'bx_channels/'),
        array('name' => 'Classes', 'path' => 'bx_classes/'),
        array('name' => 'Contact', 'path' => 'bx_contact/'),
        array('name' => 'Conversations', 'path' => 'bx_convos/'),
        array('name' => 'Courses', 'path' => 'bx_courses/'),
        array('name' => 'Credits', 'path' => 'bx_credits/'),
        array('name' => 'Discussions', 'path' => 'bx_forum/'),
        array('name' => 'Dolphin Connect', 'path' => 'bx_dolcon/'),
        array('name' => 'Donations', 'path' => 'bx_donations/'),
        array('name' => 'Editor', 'path' => 'bx_editor/'),
        array('name' => 'Events', 'path' => 'bx_events/'),
        array('name' => 'Facebook', 'path' => 'bx_facebook/'),
        array('name' => 'Files', 'path' => 'bx_files/'),
        array('name' => 'Glossary', 'path' => 'bx_glossary/'),
        array('name' => 'Google Connect', 'path' => 'bx_googlecon/'),
        array('name' => 'Groups', 'path' => 'bx_groups/'),
        array('name' => 'Invitations', 'path' => 'bx_invites/'),
        array('name' => 'Jobs', 'path' => 'bx_jobs/'),
        array('name' => 'LinkedIn Connect', 'path' => 'bx_linkedin/'),
        array('name' => 'Market', 'path' => 'bx_market/'),
        array('name' => 'Notifications', 'path' => 'bx_notifications/'),
        array('name' => 'OAuth2 Server', 'path' => 'bx_oauth/'),
        array('name' => 'Organizations', 'path' => 'bx_organizations/'),
        array('name' => 'Paid Levels', 'path' => 'bx_acl/'),
        array('name' => 'Payment', 'path' => 'bx_payment/'),
        array('name' => 'Persons', 'path' => 'bx_persons/'),
        array('name' => 'Photos', 'path' => 'bx_photos/'),
        array('name' => 'Polls', 'path' => 'bx_polls/'),
        array('name' => 'Posts', 'path' => 'bx_posts/'),
        array('name' => 'Quote Of Day', 'path' => 'bx_quoteofday/'),
        array('name' => 'Reputation', 'path' => 'bx_reputation/'),
        array('name' => 'Resources', 'path' => 'bx_resources/'),
        array('name' => 'Reviews', 'path' => 'bx_reviews/'),
        array('name' => 'Shopify', 'path' => 'bx_shopify/'),
        array('name' => 'Snipcart', 'path' => 'bx_snipcart/'),
        array('name' => 'Spaces', 'path' => 'bx_spaces/'),
        array('name' => 'Stripe Connect', 'path' => 'bx_stripe_connect/'),
        array('name' => 'System', 'path' => 'system/'),
        array('name' => 'Tasks', 'path' => 'bx_tasks/'),
        array('name' => 'Timeline', 'path' => 'bx_timeline/'),
        array('name' => 'Twitter Connect', 'path' => 'bx_twitter/'),
        array('name' => 'UNA Connect', 'path' => 'bx_unacon/'),
        array('name' => 'Videos', 'path' => 'bx_videos/'),
    ),

    /**
     * Files Section
     */
    'delete_files' => array(),
);
