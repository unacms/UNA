<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * Railway: demo content for a fresh install, so production and previews are not empty.
 * Runs from entrypoint.sh when UNA_DEMO_SEED=1. Idempotent: skips everything once the
 * first demo account exists. Content goes through module services (not raw SQL), so
 * timeline events, counters and notifications are created the same way as by users.
 *
 * Environment:
 *   UNA_DEMO_PASSWORD  password for the demo accounts (random if unset)
 */

ob_start(); // bx_login() sets cookies; nothing to send them to in CLI

$_SERVER['HTTP_HOST'] = getenv('RAILWAY_PUBLIC_DOMAIN') ?: 'localhost';
$_SERVER['REQUEST_URI'] = '/';
$_SERVER['SERVER_NAME'] = $_SERVER['HTTP_HOST'];
$GLOBALS['bx_profiler_disable'] = true;

require_once('/var/www/html/inc/header.inc.php');

function seedLog(string $s): void
{
    fwrite(STDERR, "[seed] $s\n");
}

$aUsers = [
    ['name' => 'Lily Carter', 'email' => 'lily@example.com'],
    ['name' => 'Eric Novak', 'email' => 'eric@example.com'],
    ['name' => 'Mila Santos', 'email' => 'mila@example.com'],
    ['name' => 'Tom Walsh', 'email' => 'tom@example.com'],
    ['name' => 'Ella Kim', 'email' => 'ella@example.com'],
];

if (BxDolAccount::getInstance($aUsers[0]['email'])) {
    seedLog('demo content already present, skipping');
    exit(0);
}

$sPassword = getenv('UNA_DEMO_PASSWORD') ?: bin2hex(random_bytes(12));
$oAccountForms = bx_instance('BxTemplAccountForms');

// --- people: account + person profile each
$aProfiles = []; // [account_id, person profile id]
foreach ($aUsers as $aUser) {
    $a = $oAccountForms->createAccount([
        'name' => $aUser['name'],
        'email' => $aUser['email'],
        'password' => $sPassword,
        'email_confirmed' => 1,
    ], BX_PROFILE_ACTION_AUTO, false);
    if (empty($a['account_id'])) {
        seedLog("account {$aUser['email']} failed: " . ($a['error'] ?? 'unknown'));
        continue;
    }

    $aFields = bx_srv('bx_persons', 'prepare_fields', [['author' => $a['profile_id'], 'name' => $aUser['name']]]);
    $aFields['allow_view_to'] = BX_DOL_PG_ALL;
    $r = bx_srv('bx_persons', 'entity_add_forcedly', [$a['profile_id'], $aFields]);
    if (empty($r['content']['profile_id'])) {
        seedLog("person {$aUser['name']} failed: " . ($r['message'] ?? 'unknown'));
        continue;
    }

    $aProfiles[] = [$a['account_id'], (int)$r['content']['profile_id']];
    seedLog("person {$aUser['name']}");
}

if (!$aProfiles) {
    seedLog('no profiles created, stopping');
    exit(1);
}

/** Act as a demo user, so ACL checks and authorship match a real post. */
function seedAs(array $aProfile): int
{
    bx_login($aProfile[0], false);
    return $aProfile[1];
}

// --- a public group
$iGroupProfileId = 0;
$iOwner = seedAs($aProfiles[0]);
$r = bx_srv('bx_groups', 'entity_add_forcedly', [$iOwner, [
    'group_name' => 'UNA Community',
    'group_desc' => 'Introduce yourself, share what you are building with UNA and NEO, and ask questions.',
    'allow_view_to' => BX_DOL_PG_ALL,
]]);
if (!empty($r['content']['profile_id'])) {
    $iGroupProfileId = (int)$r['content']['profile_id'];
    seedLog('group UNA Community');
}

// --- posts, each with a couple of comments from other people
$aPosts = [
    ['Hello from the demo site', "This site is a fresh UNA install deployed from the master branch. Everything here is sample content."],
    ['What NEO is', "NEO is the universal UNA client: one React Native codebase for web, iOS and Android, talking to UNA through its API."],
    ['Preview environments', "Every pull request to UNA gets its own backend and client on unacms.app, created by CI and removed when the PR closes."],
    ['Weekend reading', "A few articles about building communities that stay useful: keep threads short, answer quickly, and welcome new members by name."],
    ['Photo walk this Saturday', "Meeting at the old harbour at 10:00. Bring any camera; phones are fine. Coffee afterwards."],
    ['Tips for a good profile', "Add a picture, write two sentences about what you do, and follow a few groups. That's enough to get a useful feed."],
];
$aComments = [
    'Great to see this running.',
    'Thanks for sharing!',
    'Count me in.',
    'Very helpful, bookmarking this.',
];

foreach ($aPosts as $i => [$sTitle, $sText]) {
    $aAuthor = $aProfiles[$i % count($aProfiles)];
    $iAuthor = seedAs($aAuthor);
    $r = bx_srv('bx_posts', 'entity_add_forcedly', [$iAuthor, [
        'title' => $sTitle,
        'text' => '<p>' . $sText . '</p>',
        'allow_view_to' => BX_DOL_PG_ALL,
    ]]);
    if (empty($r['content']['id'])) {
        seedLog("post '$sTitle' failed: " . ($r['message'] ?? 'unknown'));
        continue;
    }
    seedLog("post '$sTitle'");

    if (!($oCmts = BxDolCmts::getObjectInstance('bx_posts', (int)$r['content']['id'])))
        continue;
    for ($j = 1; $j <= 2; $j++) {
        $aCommenter = $aProfiles[($i + $j) % count($aProfiles)];
        $oCmts->add([
            'cmt_author_id' => seedAs($aCommenter),
            'cmt_parent_id' => 0,
            'cmt_text' => $aComments[($i + $j) % count($aComments)],
        ]);
    }
}

seedLog('done: ' . count($aProfiles) . ' people, ' . ($iGroupProfileId ? 1 : 0) . ' group, ' . count($aPosts) . ' posts');
ob_end_clean();
