<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * Railway: demo content for a fresh install, so production and previews are not empty.
 * Runs from entrypoint.sh when UNA_DEMO_SEED=1. Idempotent: content is created once, and
 * skipped once the first demo account exists; seedPeople() runs on every start and does only
 * what is missing. Content goes through module services (not raw SQL), so timeline events,
 * counters and notifications are created the same way as by users.
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

/**
 * Confirm the demo accounts and connect them, so friend and follow suggestions have people to
 * offer. Runs on every start, so sites seeded before this existed catch up.
 * - createAccount() takes join form fields only, so it can't confirm an email, and
 *   sys_account_hide_unconfirmed_accounts hides unconfirmed accounts from suggestions.
 * - Friend suggestions come from mutual friends, follow suggestions from the accounts that the
 *   people you follow follow. A chain of friends and a ring of follows give everyone both.
 */
function seedPeople(array $aUsers): void
{
    $aPersons = [];
    $iConfirmed = 0;
    foreach ($aUsers as $aUser) {
        if (!($oAccount = BxDolAccount::getInstance($aUser['email'])))
            continue;
        if (!$oAccount->isConfirmedEmail() && $oAccount->updateEmailConfirmed(true, false))
            $iConfirmed++;
        foreach ($oAccount->getProfiles(false) as $iProfileId => $aProfile)
            if ($aProfile['type'] == 'bx_persons')
                $aPersons[] = (int)$iProfileId;
    }

    $iFriends = 0;
    $oFriends = BxDolConnection::getObjectInstance('sys_profiles_friends');
    for ($i = 1; $i < count($aPersons); $i++) {
        [$iA, $iB] = [$aPersons[$i - 1], $aPersons[$i]];
        if ($oFriends->isConnected($iA, $iB, true))
            continue;
        $oFriends->addConnection($iA, $iB); // request
        $oFriends->addConnection($iB, $iA); // accept
        $iFriends++;
    }

    $iFollows = 0;
    $oFollows = BxDolConnection::getObjectInstance('sys_profiles_subscriptions');
    foreach ($aPersons as $i => $iA) {
        $iB = $aPersons[($i + 1) % count($aPersons)];
        if ($iA != $iB && !$oFollows->isConnected($iA, $iB) && $oFollows->addConnection($iA, $iB))
            $iFollows++;
    }

    // New connections queue a refresh themselves; a confirmation does not.
    if ($iConfirmed)
        foreach ($aPersons as $iProfileId)
            BxDolRecommendation::updateData($iProfileId);

    if ($iConfirmed || $iFriends || $iFollows)
        seedLog("people: $iConfirmed confirmed, $iFriends friendships, $iFollows follows");
}

if (BxDolAccount::getInstance($aUsers[0]['email'])) {
    seedPeople($aUsers);
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

// --- a public group (when the package has the Groups module)
$iGroupProfileId = 0;
$iOwner = seedAs($aProfiles[0]);
$r = !BxDolModuleQuery::getInstance()->isEnabledByName('bx_groups') ? ['message' => 'bx_groups is not installed'] : bx_srv('bx_groups', 'entity_add_forcedly', [$iOwner, [
    'group_name' => 'UNA Community',
    'group_desc' => 'Introduce yourself, share what you are building with UNA and NEO, and ask questions.',
    'allow_view_to' => BX_DOL_PG_ALL,
    // Participants may post (the privacy object's default). Left out, the forced add
    // stored '' (seen on api.unacms.app), which no privacy group matches.
    'allow_post_to' => 'p',
]]);
if (!empty($r['content']['profile_id'])) {
    $iGroupProfileId = (int)$r['content']['profile_id'];
    seedLog('group UNA Community');
}
else
    seedLog('group skipped: ' . ($r['message'] ?? 'unknown'));

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

seedPeople($aUsers);

seedLog('done: ' . count($aProfiles) . ' people, ' . ($iGroupProfileId ? 1 : 0) . ' group, ' . count($aPosts) . ' posts');
ob_end_clean();
