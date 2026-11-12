<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * API v2 for Events (bx_events, BxEventsApiV2 on the groups base), over real HTTP: events each
 * test makes through the module's add service and deletes after; upcoming and past lists with
 * their order and pages, the filters, going and withdrawing, attendees, secret and closed
 * events, events in a context and the Item of an event. Its own events are kept apart from the
 * site's by their dates (2001 for past ones, 2037 for upcoming ones) and the `from`/`to` range.
 * Skips without bx_events.
 */
#[Group('integration')]
class ApiV2EventsTest extends ApiV2TestCase
{
    /** Profiles a test made (events, a group), deleted the other way round. */
    protected $_aProfiles = [];

    protected function tearDown(): void
    {
        // the server process made the memberships: this process's memory of the rows is stale
        if ($this->_aProfiles)
            BxDolDb::getInstance()->cleanMemoryAll();
        foreach (array_reverse($this->_aProfiles) as $iProfile)
            if (($oProfile = BxDolProfile::getInstance($iProfile)))
                $oProfile->delete(false, true, true);
        parent::tearDown();
    }

    public function testEventPathsOnlyWhileEventsIsEnabled(): void
    {
        $aEnabled = [];
        foreach (BxDolModuleQuery::getInstance()->getModulesBy(['type' => 'modules', 'active' => 1]) as $aModule)
            $aEnabled[$aModule['name']] = $aModule;
        $aWithFile = array_keys($aEnabled);
        $aPaths = ['/events', '/events/{id}', '/events/{id}/rsvp', '/events/{id}/attendees', '/me/events', '/search/events'];

        $aWithout = $aEnabled;
        unset($aWithout['bx_events']);
        $aClasses = BxDolApiV2Router::classesFor($aWithout, $aWithFile);
        $this->assertNotContains('BxEventsApiV2', $aClasses);
        $aSpec = (new BxDolApiV2Spec(new BxDolApiV2Router($aClasses)))->build();
        foreach ($aPaths as $sPath)
            $this->assertArrayNotHasKey($sPath, $aSpec['paths'], $sPath . ' without Events');
        $this->assertArrayNotHasKey('Event', $aSpec['components']['schemas']);

        $this->requireModule('bx_events');
        $aClasses = BxDolApiV2Router::classesFor($aEnabled, $aWithFile);
        $this->assertContains('BxEventsApiV2', $aClasses);
        $aSpec = (new BxDolApiV2Spec(new BxDolApiV2Router($aClasses)))->build();
        foreach ($aPaths as $sPath)
            $this->assertArrayHasKey($sPath, $aSpec['paths'], $sPath . ' with Events');
        $this->assertSame(['rsvpEvent', 'withdrawEventRsvp'], [$aSpec['paths']['/events/{id}/rsvp']['put']['operationId'] ?? null, $aSpec['paths']['/events/{id}/rsvp']['delete']['operationId'] ?? null]);

        $a = $this->http('GET', '');
        $this->assertSame(200, $a['status'], $a['body']);
        $aModules = array_column($a['json']['modules'], null, 'module');
        $this->assertSame(['module' => 'bx_events', 'tag' => 'events', 'kind' => 'event'], array_diff_key($aModules['bx_events'] ?? [], ['title' => 1]));
    }

    public function testUpcomingAndPastByTheirStartPageByPage(): void
    {
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $iOwner = $this->ordinaryProfileIdOtherThan([$iViewer]);
        $iLater = $this->makeEvent($iOwner, BX_DOL_PG_ALL, false, gmmktime(18, 0, 0, 3, 20, 2037), gmmktime(20, 0, 0, 3, 20, 2037));
        $iSoon = $this->makeEvent($iOwner, BX_DOL_PG_ALL, false, gmmktime(9, 0, 0, 3, 2, 2037), gmmktime(11, 0, 0, 3, 2, 2037), '', 'Europe/Berlin');
        $iClosed = $this->makeEvent($iOwner, 'c', true, gmmktime(9, 0, 0, 3, 10, 2037), gmmktime(10, 0, 0, 3, 10, 2037));
        $iOld = $this->makeEvent($iOwner, BX_DOL_PG_ALL, false, gmmktime(9, 0, 0, 5, 1, 2001), gmmktime(10, 0, 0, 5, 1, 2001));
        $iOlder = $this->makeEvent($iOwner, BX_DOL_PG_ALL, false, gmmktime(9, 0, 0, 2, 1, 2001), gmmktime(10, 0, 0, 2, 1, 2001));
        $sRange = 'from=2037-01-01T00:00:00Z&to=2037-12-31T00:00:00Z';

        // upcoming: soonest first, the closed one too (its name and dates), page by page
        $aIds = [];
        $sPath = 'events?when=upcoming&' . $sRange . '&limit=1';
        for ($i = 0; $i < 5 && $sPath; $i++) {
            $a = $this->http('GET', $sPath, $aAuth);
            $this->assertSame(200, $a['status'], $a['body']);
            $this->assertSchema('Page_Event', $a['json']);
            $aIds = array_merge($aIds, array_column($a['json']['items'], 'id'));
            $sPath = $a['json']['next_cursor'] !== null ? 'events?when=upcoming&' . $sRange . '&limit=1&cursor=' . rawurlencode($a['json']['next_cursor']) : '';
        }
        $this->assertSame([(string)$iSoon, (string)$iClosed, (string)$iLater], $aIds);

        $a = $this->http('GET', 'events?' . $sRange, $aAuth);
        $this->assertSame([(string)$iSoon, (string)$iClosed, (string)$iLater], array_column($a['json']['items'], 'id'), 'a range without when, by the start');
        $aSoon = $a['json']['items'][0];
        $this->assertSame(['2037-03-02T09:00:00Z', '2037-03-02T11:00:00Z', 'Europe/Berlin', false, 'public', 'published', 'approved'], [$aSoon['starts_at'], $aSoon['ends_at'], $aSoon['timezone'], $aSoon['all_day'], $aSoon['audience'], $aSoon['state'], $aSoon['moderation']]);
        $this->assertArrayNotHasKey('body_html', $aSoon, 'single answers only');
        $this->assertSame([(string)$iClosed], array_column($this->http('GET', 'events?from=2037-03-05T00:00:00Z&to=2037-03-15T00:00:00Z', $aAuth)['json']['items'], 'id'), 'only what overlaps');

        $a = $this->http('GET', 'events?when=past&from=2001-01-01T00:00:00Z&to=2001-12-31T00:00:00Z', $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSame([(string)$iOld, (string)$iOlder], array_column($a['json']['items'], 'id'), 'past: the latest first');
        $this->assertSame([], array_column($this->http('GET', 'events?when=upcoming&from=2001-01-01T00:00:00Z&to=2001-12-31T00:00:00Z', $aAuth)['json']['items'], 'id'), 'ended events are not upcoming');

        $aMine = array_column($this->http('GET', 'events?author=' . $iOwner . '&' . $sRange)['json']['items'], 'id');
        $this->assertSame([(string)$iSoon, (string)$iClosed, (string)$iLater], $aMine, 'by the author, to a guest too');
        $this->assertSame([], $this->http('GET', 'events?author=' . $iViewer . '&' . $sRange)['json']['items']);

        foreach (['events?when=soon', 'events?from=tomorrow', 'events?from=2037-03-02T00:00:00Z&to=2037-03-01T00:00:00Z', 'events?author=abc', 'events?context=' . $iViewer, 'events?context=1&context_id=2', 'me/events?when=later'] as $sPath) {
            $a = $this->http('GET', $sPath, $aAuth);
            $this->assertSame(422, $a['status'], $sPath . ': ' . $a['body']);
            $this->assertSchema('Problem', $a['json']);
        }
    }

    public function testGoingWithdrawingAndAttendees(): void
    {
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $aJson = $aAuth + ['Content-Type' => 'application/json'];
        $iOwner = $this->ordinaryProfileIdOtherThan([$iViewer]);
        $iOpen = $this->makeEvent($iOwner, BX_DOL_PG_ALL, false, gmmktime(9, 0, 0, 4, 1, 2037), gmmktime(10, 0, 0, 4, 1, 2037));
        $iApproval = $this->makeEvent($iOwner, BX_DOL_PG_ALL, true, gmmktime(9, 0, 0, 4, 2, 2037), gmmktime(10, 0, 0, 4, 2, 2037));

        $a = $this->http('GET', 'events/' . $iOpen, $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Event', $a['json']);
        $this->assertSame(['bx_events', 'open', 1, null, 'none', true], [$a['json']['module'], $a['json']['join_policy'], $a['json']['going_count'], $a['json']['viewer']['rsvp'], $a['json']['viewer']['status'], $a['json']['viewer']['can_join']]);
        $this->assertStringContainsString('ApiV2EventsTest', $a['json']['body_html']);
        $this->assertSame(404, $this->http('GET', 'groups/' . $iOpen, $aAuth)['status'], 'an event is no group of the Groups module');

        $a = $this->http('PUT', 'events/' . $iOpen . '/rsvp', $aJson, '{"status":"maybe"}');
        $this->assertSame(422, $a['status'], $a['body']);
        $this->assertSame('unsupported', $a['json']['errors'][0]['code'] ?? null);
        $this->assertSame(422, $this->http('PUT', 'events/' . $iOpen . '/rsvp', $aJson, '{"status":"perhaps"}')['status']);
        $this->assertSame(401, $this->http('PUT', 'events/' . $iOpen . '/rsvp', ['Content-Type' => 'application/json'], '{"status":"going"}')['status']);

        $a = $this->http('PUT', 'events/' . $iOpen . '/rsvp', $aJson, '{"status":"going"}');
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Event', $a['json']);
        $this->assertSame(['going', 'active', 'member', 2], [$a['json']['viewer']['rsvp'], $a['json']['viewer']['status'], $a['json']['viewer']['role'], $a['json']['going_count']]);
        $this->assertSame(200, $this->http('PUT', 'events/' . $iOpen . '/rsvp', $aJson, '{"status":"going"}')['status'], 'again is not an error');
        // no Item for them (the site's is the organiser's alone): nothing to react or comment on
        $this->assertSame([null, false, false], [$a['json']['content_id'], $a['json']['viewer']['can_react'], $a['json']['viewer']['can_comment']]);

        // a list reads the page's going counts and the viewer's answers at once: the same as one by one
        $a = $this->http('GET', 'events?from=2037-04-01T00:00:00Z&to=2037-04-03T00:00:00Z', $aAuth);
        $aListed = array_column($a['json']['items'], null, 'id');
        $this->assertSame([2, 'going', 'active'], [$aListed[(string)$iOpen]['going_count'] ?? null, $aListed[(string)$iOpen]['viewer']['rsvp'] ?? null, $aListed[(string)$iOpen]['viewer']['status'] ?? null]);
        $this->assertSame([1, null, 'none', true], [$aListed[(string)$iApproval]['going_count'] ?? null, $aListed[(string)$iApproval]['viewer']['rsvp'] ?? null, $aListed[(string)$iApproval]['viewer']['status'] ?? null, $aListed[(string)$iApproval]['viewer']['can_join'] ?? null]);
        $this->assertSame([null, false, false, false], [$aListed[(string)$iOpen]['viewer']['reaction'], $aListed[(string)$iOpen]['viewer']['favorited'], $aListed[(string)$iOpen]['viewer']['can_react'], $aListed[(string)$iOpen]['viewer']['can_comment']], 'single answers only');
        $this->assertContains((string)$iOpen, array_column($this->http('GET', 'me/events?limit=50', $aAuth)['json']['items'], 'id'), 'one\'s events');

        $a = $this->http('GET', 'events/' . $iOpen . '/attendees', $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Page_EventAttendee', $a['json']);
        $this->assertSame([(string)$iOwner, (string)$iViewer], array_map(function ($a) { return $a['profile']['id']; }, $a['json']['items']), 'the first to join first');
        $this->assertSame([['going', 'owner'], ['going', 'member']], array_map(function ($a) { return [$a['status'], $a['role']]; }, $a['json']['items']));
        $a = $this->http('GET', 'events/' . $iOpen . '/attendees?limit=1', $aAuth);
        $this->assertNotNull($a['json']['next_cursor']);
        $this->assertSame([(string)$iViewer], array_map(function ($a) { return $a['profile']['id']; }, $this->http('GET', 'events/' . $iOpen . '/attendees?limit=1&cursor=' . rawurlencode($a['json']['next_cursor']), $aAuth)['json']['items']));
        $this->assertSame(['items' => [], 'next_cursor' => null], $this->http('GET', 'events/' . $iOpen . '/attendees?status=maybe', $aAuth)['json']);

        $this->assertSame(204, $this->http('DELETE', 'events/' . $iOpen . '/rsvp', $aAuth)['status']);
        $this->assertSame(204, $this->http('DELETE', 'events/' . $iOpen . '/rsvp', $aAuth)['status'], 'no answer is not an error');
        $a = $this->http('GET', 'events/' . $iOpen, $aAuth);
        $this->assertSame([null, 'none', 1], [$a['json']['viewer']['rsvp'], $a['json']['viewer']['status'], $a['json']['going_count']]);

        // an event whose organisers approve: a request, no answer yet, not in one's events
        $a = $this->http('PUT', 'events/' . $iApproval . '/rsvp', $aJson, '{"status":"going"}');
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSame(['approval', null, 'pending'], [$a['json']['join_policy'], $a['json']['viewer']['rsvp'], $a['json']['viewer']['status']]);
        $this->assertNotContains((string)$iApproval, array_column($this->http('GET', 'me/events?limit=50', $aAuth)['json']['items'], 'id'), 'a request is no membership');
        $this->assertSame(204, $this->http('DELETE', 'events/' . $iApproval . '/rsvp', $aAuth)['status'], 'the request withdrawn');
        $this->assertSame('none', $this->http('GET', 'events/' . $iApproval, $aAuth)['json']['viewer']['status'] ?? null);
        $this->assertSame(401, $this->http('GET', 'me/events')['status']);
        $this->assertSame(404, $this->http('GET', 'events/' . $iViewer, $aAuth)['status'], 'a person is no event');
    }

    public function testSecretAndClosedEvents(): void
    {
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $iOwner = $this->ordinaryProfileIdOtherThan([$iViewer]);
        $iSecret = $this->makeEvent($iOwner, 's', true, gmmktime(9, 0, 0, 5, 1, 2037), gmmktime(10, 0, 0, 5, 1, 2037));
        $iClosed = $this->makeEvent($iOwner, 'c', true, gmmktime(9, 0, 0, 5, 2, 2037), gmmktime(10, 0, 0, 5, 2, 2037));
        $sRange = 'from=2037-05-01T00:00:00Z&to=2037-05-03T00:00:00Z';

        foreach ([$aAuth, []] as $aHeaders) {
            foreach (['events/' . $iSecret, 'events/' . $iSecret . '/attendees'] as $sPath) {
                $a = $this->http('GET', $sPath, $aHeaders);
                $this->assertSame(404, $a['status'], $sPath . ': ' . $a['body']);
                $this->assertSchema('Problem', $a['json']);
            }
            $this->assertSame([(string)$iClosed], array_column($this->http('GET', 'events?' . $sRange, $aHeaders)['json']['items'], 'id'), 'the secret one is not listed');
        }
        $this->assertSame(404, $this->http('PUT', 'events/' . $iSecret . '/rsvp', $aAuth + ['Content-Type' => 'application/json'], '{"status":"going"}')['status']);

        $a = $this->http('GET', 'events/' . $iClosed, $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Event', $a['json']);
        $this->assertSame(['closed', 'private', false, '', null, null, null, '2037-05-02T09:00:00Z'], [$a['json']['visibility'], $a['json']['audience'], $a['json']['content_visible'], $a['json']['summary'], $a['json']['body_html'], $a['json']['cover'], $a['json']['content_id'], $a['json']['starts_at']]);
        $this->assertSame(403, $this->http('GET', 'events/' . $iClosed . '/attendees', $aAuth)['status']);

        $aOwner = ['Authorization' => 'Bearer ' . $this->profileToken($iOwner)];
        $a = $this->http('GET', 'events/' . $iSecret, $aOwner);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSame(['secret', 'private', 'owner', 'going'], [$a['json']['visibility'], $a['json']['audience'], $a['json']['viewer']['role'], $a['json']['viewer']['rsvp']]);
        $this->assertContains((string)$iSecret, array_column($this->http('GET', 'me/events?limit=50', $aOwner)['json']['items'], 'id'), 'its owner finds it');
    }

    public function testEventsInAContextTheirItemAndSearch(): void
    {
        $this->requireModule('bx_groups');
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $iOwner = $this->ordinaryProfileIdOtherThan([$iViewer]);
        $iGroup = $this->makeGroup($iOwner);
        $sWord = 'Zq' . bin2hex(random_bytes(3));
        $iInGroup = $this->makeEvent($iOwner, (string)-$iGroup, false, gmmktime(9, 0, 0, 6, 1, 2037), gmmktime(10, 0, 0, 6, 1, 2037), $sWord . ' in a group');
        $iPublic = $this->makeEvent($iOwner, BX_DOL_PG_ALL, false, gmmktime(9, 0, 0, 6, 2, 2037), gmmktime(10, 0, 0, 6, 2, 2037), $sWord . ' for all');

        foreach (['context', 'context_id'] as $sName) {
            $a = $this->http('GET', 'events?' . $sName . '=' . $iGroup, $aAuth);
            $this->assertSame(200, $a['status'], $a['body']);
            $this->assertSame([(string)$iInGroup], array_column($a['json']['items'], 'id'), $sName);
        }
        $aEvent = $a['json']['items'][0];
        $this->assertSame([(string)$iGroup, 'context', 'context'], [$aEvent['context_id'], $aEvent['audience'], $aEvent['visibility']]);
        $this->assertNotContains((string)$iInGroup, array_column($this->http('GET', 'events?from=2037-06-01T00:00:00Z&to=2037-06-03T00:00:00Z', $aAuth)['json']['items'], 'id'), 'the browse list leaves events in contexts out, as the site\'s');

        $bAllowed = BxDolModule::getInstance('bx_events')->serviceCheckAllowedAddInContext('bx_groups') === CHECK_ACTION_RESULT_ALLOWED;
        $this->assertSame($bAllowed, in_array('events', $this->http('GET', 'groups/' . $iGroup, $aAuth)['json']['content_kinds'], true), 'a group\'s events');

        // the Item that shows it in the feeds, whose comments and reactions are the event's: the
        // site's Item of an added event is its author's alone, so only they get it, on single answers
        $this->assertNull($this->http('GET', 'events/' . $iPublic, $aAuth)['json']['content_id'], 'not the author\'s');
        if (BxDolModuleQuery::getInstance()->isEnabledByName('bx_timeline')) {
            $aOwner = ['Authorization' => 'Bearer ' . $this->profileToken($iOwner)];
            $a = $this->http('GET', 'events/' . $iPublic, $aOwner);
            $this->assertNotNull($a['json']['content_id'], 'the Timeline shows an added event to its author');
            $b = $this->http('GET', 'content/' . $a['json']['content_id'], $aOwner);
            $this->assertSame(200, $b['status'], $b['body']);
            $this->assertSame(['event', 'bx_events'], [$b['json']['kind'], $b['json']['module']]);
            $this->assertSame([null], array_unique(array_column($this->http('GET', 'events?context=' . $iGroup, $aOwner)['json']['items'], 'content_id')), 'lists carry none');
        }

        $a = $this->http('GET', 'search/events?q=' . rawurlencode($sWord), $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        foreach ($a['json'] as $aHit)
            $this->assertSchema('Event', $aHit);
        $this->assertEqualsCanonicalizing([(string)$iInGroup, (string)$iPublic], array_column($a['json'], 'id'), 'a public group\'s event is found too');
        $this->assertSame(422, $this->http('GET', 'search/events', $aAuth)['status']);
    }

    public function testContextFiltersAndEventsInHiddenContexts(): void
    {
        $this->requireModule('bx_groups');
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $iOwner = $this->ordinaryProfileIdOtherThan([$iViewer]);
        $iSecret = $this->makeGroup($iOwner, 's');
        $iClosed = $this->makeGroup($iOwner, 'c');
        $iInSecret = $this->makeEvent($iOwner, (string)-$iSecret, false, gmmktime(9, 0, 0, 7, 1, 2037), gmmktime(10, 0, 0, 7, 1, 2037));
        $iInClosed = $this->makeEvent($iOwner, (string)-$iClosed, false, gmmktime(9, 0, 0, 7, 2, 2037), gmmktime(10, 0, 0, 7, 2, 2037));
        $iPublic = $this->makeEvent($iOwner, BX_DOL_PG_ALL, false, gmmktime(9, 0, 0, 7, 3, 2037), gmmktime(10, 0, 0, 7, 3, 2037));
        $iMissing = (int)BxDolDb::getInstance()->getOne("SELECT MAX(`id`) FROM `sys_profiles`") + 1000;

        $aFilters = ['events?context=' => 'context', 'events?context_id=' => 'context_id'];
        if (BxDolModuleQuery::getInstance()->isEnabledByName('bx_forum'))
            $aFilters['discussions?context_id='] = 'context_id';

        foreach ([$aAuth, []] as $aHeaders) {
            // a secret group is no context to those outside it: the same 422 as an id of nothing
            foreach ([$iSecret, $iMissing] as $iId)
                foreach ($aFilters as $sPath => $sField) {
                    $a = $this->http('GET', $sPath . $iId, $aHeaders);
                    $this->assertSame(422, $a['status'], $sPath . $iId . ': ' . $a['body']);
                    $this->assertSchema('Problem', $a['json']);
                    $this->assertSame([$sField, 'not_found'], [$a['json']['errors'][0]['field'] ?? null, $a['json']['errors'][0]['code'] ?? null], $sPath . $iId);
                }
            // a closed one may be known, its content not seen
            foreach ($aFilters as $sPath => $sField)
                $this->assertSame(403, $this->http('GET', $sPath . $iClosed, $aHeaders)['status'], $sPath . ' a closed group');

            // an event in a secret group is as if there were none, and so is a link to it
            foreach (['events/' . $iInSecret, 'events/' . $iInSecret . '/attendees', 'links/resolve?url=' . rawurlencode(BxDolProfile::getInstance($iInSecret)->getUrl())] as $sPath) {
                $a = $this->http('GET', $sPath, $aHeaders);
                $this->assertSame(404, $a['status'], $sPath . ': ' . $a['body']);
                $this->assertSchema('Problem', $a['json']);
            }
            // one in a closed group is refused, not hidden: the group may be known
            $this->assertSame(403, $this->http('GET', 'events/' . $iInClosed, $aHeaders)['status'], 'an event in a closed group');
        }
        $this->assertSame(404, $this->http('PUT', 'events/' . $iInSecret . '/rsvp', $aAuth + ['Content-Type' => 'application/json'], '{"status":"going"}')['status']);
        $this->assertSame(404, $this->http('DELETE', 'events/' . $iInSecret . '/rsvp', $aAuth)['status']);

        // an event keeps no events
        $a = $this->http('GET', 'events?context=' . $iPublic, $aAuth);
        $this->assertSame(422, $a['status'], $a['body']);
        $this->assertSame(['context', 'invalid_value'], [$a['json']['errors'][0]['field'] ?? null, $a['json']['errors'][0]['code'] ?? null]);

        // its members see them all
        $aOwner = ['Authorization' => 'Bearer ' . $this->profileToken($iOwner)];
        $this->assertSame(200, $this->http('GET', 'events/' . $iInSecret, $aOwner)['status']);
        $this->assertSame([(string)$iInSecret], array_column($this->http('GET', 'events?context=' . $iSecret, $aOwner)['json']['items'], 'id'));
        $a = $this->http('GET', 'links/resolve?url=' . rawurlencode(BxDolProfile::getInstance($iInSecret)->getUrl()), $aOwner);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSame(['group', (string)$iInSecret, 'bx_events'], [$a['json']['kind'], $a['json']['id'], $a['json']['module'] ?? null]);
    }

    public function testAnEventThatStillRepeatsIsUpcomingOnly(): void
    {
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $iOwner = $this->ordinaryProfileIdOtherThan([$iViewer]);
        $iRepeating = $this->makeEvent($iOwner, BX_DOL_PG_ALL, false, gmmktime(9, 0, 0, 1, 10, 2001), gmmktime(10, 0, 0, 1, 10, 2001));
        $iStopped = $this->makeEvent($iOwner, BX_DOL_PG_ALL, false, gmmktime(9, 0, 0, 1, 12, 2001), gmmktime(10, 0, 0, 1, 12, 2001));
        $iOnce = $this->makeEvent($iOwner, BX_DOL_PG_ALL, false, gmmktime(9, 0, 0, 1, 14, 2001), gmmktime(10, 0, 0, 1, 14, 2001));
        $aContentIds = [];
        $oDb = BxDolDb::getInstance();
        try {
            // weekly: for ever, and until June 2001
            foreach ([$iRepeating => 0, $iStopped => gmmktime(0, 0, 0, 6, 1, 2001)] as $iEvent => $iStop) {
                $aContentIds[] = $iContentId = (int)BxDolProfile::getInstance($iEvent)->getContentId();
                $oDb->query("INSERT INTO `bx_events_intervals` (`event_id`, `repeat_year`, `repeat_month`, `repeat_week_of_month`, `repeat_day_of_month`, `repeat_day_of_week`, `repeat_stop`) VALUES (:e, 0, 0, 0, 0, 3, :s)", ['e' => $iContentId, 's' => $iStop]);
            }
            $sRange = 'from=2001-01-01T00:00:00Z&to=2001-01-31T00:00:00Z';
            $this->assertSame([(string)$iRepeating], array_column($this->http('GET', 'events?when=upcoming&' . $sRange, $aAuth)['json']['items'], 'id'), 'one that still repeats is upcoming');
            $this->assertSame([(string)$iOnce, (string)$iStopped], array_column($this->http('GET', 'events?when=past&' . $sRange, $aAuth)['json']['items'], 'id'), 'and not past; one that stopped repeating is');
        }
        finally {
            if ($aContentIds)
                $oDb->query("DELETE FROM `bx_events_intervals` WHERE `event_id` IN (" . $oDb->implode_escape($aContentIds) . ")");
        }
    }

    /**
     * An event made through the module's add service as its owner, deleted after the test.
     * Its times are timestamps; the add form takes them as local times of the event's zone.
     */
    private function makeEvent(int $iOwner, string $sView, bool $bApproval, int $iStart, int $iEnd, string $sName = '', string $sZone = 'UTC'): int
    {
        $this->requireModule('bx_events');
        if ($this->_iNotificationsFrom === null)
            $this->forgetNotificationsFromNowOn();

        $oZone = new DateTimeZone($sZone);
        $aCats = BxDolForm::getDataItems('bx_events_cats');
        $aValues = [
            'event_name' => $sName !== '' ? $sName : 'ApiV2EventsTest ' . bin2hex(random_bytes(3)),
            'event_desc' => '<p>Made by ApiV2EventsTest</p>',
            'event_cat' => (string)(array_key_last(is_array($aCats) ? $aCats : []) ?? ''),
            'allow_view_to' => $sView,
            'allow_post_to' => 'p',
            'join_confirmation' => $bApproval ? 1 : 0,
            'timezone' => $sZone,
            'date_start' => (new DateTime('@' . $iStart))->setTimezone($oZone)->format('Y-m-d H:i'),
            'date_end' => (new DateTime('@' . $iEnd))->setTimezone($oZone)->format('Y-m-d H:i'),
        ];
        $mBefore = $GLOBALS['glForceCurrentProfileId'] ?? null;
        $GLOBALS['glForceCurrentProfileId'] = $iOwner;
        $aActedAs = $this->modulesActAs($iOwner);
        try {
            $a = BxDolModule::getInstance('bx_events')->serviceEntityAddForcedly($iOwner, $aValues);
        }
        finally {
            $this->modulesActAs($aActedAs);
            $GLOBALS['glForceCurrentProfileId'] = $mBefore;
        }
        $this->assertSame(0, $a['code'] ?? null, 'the event was made: ' . json_encode($a['errors'] ?? $a['message'] ?? ''));

        $oProfile = BxDolProfile::getInstanceByContentAndType((int)$a['content']['id'], 'bx_events');
        $this->_aProfiles[] = (int)$oProfile->id();
        BxDolDb::getInstance()->cleanMemoryAll();
        $aContent = BxDolModule::getInstance('bx_events')->_oDb->getContentInfoById((int)$a['content']['id']);
        // the module keeps the zone's offset of today, not of the event's day
        $iShift = $oZone->getOffset(new DateTime('now', $oZone)) - $oZone->getOffset(new DateTime('@' . $iStart));
        $this->assertSame($iStart, (int)$aContent['date_start'] + $iShift, 'its start');
        if ($iShift)
            BxDolDb::getInstance()->query("UPDATE `bx_events_data` SET `date_start` = :s, `date_end` = :e WHERE `id` = :i", ['s' => $iStart, 'e' => $iEnd, 'i' => (int)$a['content']['id']]);
        $sStatus = BxDolProfileQuery::getInstance()->getInfoById((int)$oProfile->id())['status'] ?? '';
        if ($sStatus !== BX_PROFILE_STATUS_ACTIVE)
            $this->markTestSkipped('New events wait for approval on this site (' . $sStatus . ').');
        return (int)$oProfile->id();
    }

    /**
     * The events and groups modules act as this profile (or each as the one given for it). A
     * module is one object for the whole process and keeps the profile it was made for, which is
     * whoever an earlier test was when it first asked for the module: its checks of who posts
     * into a group would be that profile's, not the owner's.
     * @param int|array $mProfile a profile id, or what an earlier call returned, to put it back
     * @return array module => the profile it acted as before
     */
    private function modulesActAs($mProfile): array
    {
        $aWas = [];
        foreach (['bx_events', 'bx_groups'] as $sModule)
            if (BxDolModuleQuery::getInstance()->isEnabledByName($sModule) && ($oModule = BxDolModule::getInstance($sModule)))
                $aWas[$sModule] = $oModule->setProfileId(is_array($mProfile) ? ($mProfile[$sModule] ?? $oModule->getProfileId()) : $mProfile);
        return $aWas;
    }

    private function makeGroup(int $iOwner, string $sView = BX_DOL_PG_ALL): int
    {
        $aCats = BxDolForm::getDataItems('bx_groups_cats');
        $aValues = [
            'group_name' => 'ApiV2EventsTest group ' . bin2hex(random_bytes(3)),
            'group_desc' => '<p>Made by ApiV2EventsTest</p>',
            'group_cat' => (string)(array_key_last(is_array($aCats) ? $aCats : []) ?? ''),
            'allow_view_to' => $sView,
            'allow_post_to' => 'p',
            'join_confirmation' => 0,
        ];
        $mBefore = $GLOBALS['glForceCurrentProfileId'] ?? null;
        $GLOBALS['glForceCurrentProfileId'] = $iOwner;
        $aActedAs = $this->modulesActAs($iOwner);
        try {
            $a = BxDolModule::getInstance('bx_groups')->serviceEntityAddForcedly($iOwner, $aValues);
        }
        finally {
            $this->modulesActAs($aActedAs);
            $GLOBALS['glForceCurrentProfileId'] = $mBefore;
        }
        $this->assertSame(0, $a['code'] ?? null, 'the group was made: ' . json_encode($a['errors'] ?? $a['message'] ?? ''));
        $oProfile = BxDolProfile::getInstanceByContentAndType((int)$a['content']['id'], 'bx_groups');
        $this->_aProfiles[] = (int)$oProfile->id();
        BxDolDb::getInstance()->cleanMemoryAll();
        return (int)$oProfile->id();
    }
}
