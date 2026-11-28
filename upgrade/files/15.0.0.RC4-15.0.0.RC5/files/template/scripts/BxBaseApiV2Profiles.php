<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * API v2: profiles (persons, organizations, groups and other profile modules) and the social
 * graph between them: follows (the sys_profiles_subscriptions connection) and friends
 * (sys_profiles_friends). Every change goes through the connection object's own actions, so
 * its permission checks, alerts and notifications are the site's.
 */
class BxBaseApiV2Profiles
{
    const FOLLOWS = 'sys_profiles_subscriptions';
    const FRIENDS = 'sys_profiles_friends';

    #[BxDolApiV2Operation(
        method: 'GET', path: '/profiles/{id}', id: 'getProfile', tag: 'profiles',
        summary: 'A profile',
        description: 'The profile module decides who may see it, as on the site; a profile the viewer may not see answers 403.',
        responses: [200 => 'Profile', 403 => null, 404 => null],
    )]
    public function getProfile(BxDolApiV2Request $oReq)
    {
        $iProfileId = $oReq->id();
        return self::viewableProfile($iProfileId);
    }

    #[BxDolApiV2Operation(
        method: 'GET', path: '/profiles/by-handle/{handle}', id: 'getProfileByHandle', tag: 'profiles',
        summary: 'A profile by its handle',
        description: 'The handle is the last part of the profile page\'s address on the site (`lily-carter` in `/view-persons-profile/lily-carter`), case-insensitive. It is unique within a profile module; when two modules have the same one, the oldest profile wins. The same view check as GET /profiles/{id}.',
        params: ['handle' => ['in' => 'path', 'schema' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 50]]],
        responses: [200 => 'Profile', 403 => null, 404 => null],
    )]
    public function getProfileByHandle(BxDolApiV2Request $oReq)
    {
        $iProfileId = BxDolApiV2Map::profileIdByHandle((string)$oReq->path('handle'));
        if (!$iProfileId)
            throw BxDolApiV2Problem::notFound('The profile');
        return self::viewableProfile($iProfileId);
    }

    #[BxDolApiV2Operation(
        method: 'GET', path: '/profiles/{id}/info', id: 'getProfileInfo', tag: 'profiles',
        summary: 'What a profile\'s Info block shows: its fields, as the site\'s view form has them',
        description: 'The Info block of a person\'s, organization\'s, group\'s, space\'s or event\'s page (v2 only; `entity_info`, the module\'s view form display): the fields that have a value, in the form\'s order, as the site shows them to this viewer (each field\'s "Visible for" and the profile\'s field privacy), its name left out (the page\'s heading has it), as are fields the site draws its own way (files, maps, custom rows) and secret ones. `value` is the text the site shows; `datetime` the moment of a date field (ISO 8601), else null. The same view check as GET /profiles/{id}, but a closed group\'s, space\'s or event\'s Info shows to those outside it, as on the site: 403 or 404 as there.',
        responses: [200 => 'ProfileInfo', 403 => null, 404 => null],
    )]
    public function getProfileInfo(BxDolApiV2Request $oReq)
    {
        $iProfileId = $oReq->id();
        list(, $oModule, $aContent) = self::pageProfile($iProfileId);

        // without the request's params, as pageProfile checked
        return BxDolApiV2Search::isolated(function () use ($oModule, $aContent, $iProfileId) {
            // the page's profile, as the site's page has it in its address (a person's Friends and Followers counts read it)
            $_GET['profile_id'] = $_REQUEST['profile_id'] = (string)$iProfileId;
            return ['fields' => self::infoFields($oModule, $aContent)];
        });
    }

    #[BxDolApiV2Operation(
        method: 'GET', path: '/profiles/{id}/actions', id: 'listProfileActions', tag: 'profiles',
        summary: 'What the More menu of a profile\'s or a context\'s page offers the viewer, of what the apps can do',
        description: 'v2 only: the items of the page\'s More (the module\'s view actions menus, `<module>_view_actions_all` and `<module>_view_actions_more`, as the cover of the page gives them to the apps) that are active in the apps (Studio\'s "Active in apps") and that the viewer may use (each item\'s "Visible for" and the module\'s check of it), in the menus\' order, and of those only the ones the apps do themselves (`action`): `report` (POST /profiles/{id}/report, with the site\'s reasons in `choices`; `done` once the viewer has reported it) and `edit` (PATCH /profiles/{id}, for a person or an organization; a context\'s editing is the site\'s). The rest (the hero\'s Follow, Join and the others, which have their own paths; setting a membership level or badges, deleting, inviting, notes, audit) is left out. The page\'s view check (as GET /profiles/{id}/info, a closed context\'s too); a guest gets none.',
        responses: [200 => 'array:ProfileAction', 403 => null, 404 => null],
    )]
    public function listProfileActions(BxDolApiV2Request $oReq)
    {
        $iProfileId = $oReq->id();
        list($oProfile, $oModule) = self::pageProfile($iProfileId);
        $iViewerId = (int)$oReq->viewerId();
        if (!$iViewerId)
            return [];

        return BxDolApiV2Search::isolated(function () use ($oProfile, $oModule, $iViewerId) {
            return self::moreActions($oProfile, $oModule, $iViewerId);
        });
    }

    #[BxDolApiV2Operation(
        method: 'POST', path: '/profiles/{id}/report', id: 'reportProfile', tag: 'profiles', auth: 'required',
        summary: 'Report a profile or a context to the site\'s moderators',
        description: 'v2 only: as the Report of the page\'s More on the site (the module\'s report object, BxBaseReport::report): one of the site\'s reasons (`type`, the `choices` of the report item of GET /profiles/{id}/actions) and a note, which the moderators get with the report (its comment, the email to the site, the audit, the notifications of the module\'s moderators). The report object\'s own check applies (403); the page\'s view check as GET /profiles/{id}/actions. One report per viewer: 409 `already_reported` after the first (the site\'s Report would take it back instead), 409 `own_profile` for the viewer\'s own profile.',
        body: 'ProfileReport', responses: [204 => null, 403 => null, 404 => null, 409 => null, 422 => null],
    )]
    public function reportProfile(BxDolApiV2Request $oReq)
    {
        $iViewerId = (int)$oReq->requireViewer();
        $iProfileId = $oReq->id();
        list($oProfile, $oModule) = self::pageProfile($iProfileId);
        if ($iProfileId === $iViewerId)
            throw new BxDolApiV2Problem(409, 'own_profile', 'A profile can\'t report itself');

        $aBody = (array)$oReq->body();
        $sType = is_string($aBody['type'] ?? null) ? $aBody['type'] : '';
        $sText = is_string($aBody['text'] ?? null) ? trim($aBody['text']) : '';

        return BxDolApiV2Search::isolated(function () use ($oProfile, $oModule, $iViewerId, $sType, $sText) {
            $iContentId = (int)$oProfile->getContentId();
            $oReport = self::reportObject($oModule, $iContentId);
            if (!$oReport)
                throw new BxDolApiV2Problem(403, 'report_unavailable', 'This site takes no reports of this profile');
            if (!$oReport->isAllowedReport())
                throw BxDolApiV2Problem::forbidden(BxDolApiV2Map::text($oReport->msgErrAllowedReport()) ?: 'The viewer may not report this profile');
            if (!array_key_exists($sType, self::reportChoices()))
                throw BxDolApiV2Problem::validation([['field' => 'type', 'code' => 'invalid_value', 'message' => 'One of the site\'s reasons']]);
            // the site's Report takes a report back when it is pressed again: here only one is made
            if ($oReport->isPerformed($iContentId, $iViewerId))
                throw new BxDolApiV2Problem(409, 'already_reported', 'You have reported it already');

            // the report object's own report(), in its API mode (the mode api.php has), which takes
            // the reason and the note as values instead of its popup's form
            $fReport = Closure::bind(function ($aParams) {
                $bIsApi = $this->_bIsApi;
                $this->_bIsApi = true;
                try {
                    return $this->report($aParams);
                }
                finally {
                    $this->_bIsApi = $bIsApi;
                }
            }, $oReport, get_class($oReport));
            $a = $fReport(['type' => $sType, 'text' => $sText]);
            if (!is_array($a) || (int)($a['code'] ?? 1) !== 0 || !$oReport->isPerformed($iContentId, $iViewerId))
                throw BxDolApiV2Problem::forbidden(BxDolApiV2Map::text((string)($a['message'] ?? '')) ?: 'It was not reported');

            return BxDolApiV2Response::noContent();
        });
    }

    #[BxDolApiV2Operation(
        method: 'PATCH', path: '/profiles/{id}', id: 'updateProfile', tag: 'profiles', auth: 'required',
        summary: 'Edit a profile of one\'s own: its name, about, picture or cover',
        description: 'The profile module\'s edit check applies (`checkAllowedEdit`: a profile of the viewer\'s account, any for moderators; others are 403), and the cover\'s own (`checkAllowedChangeCover`). `display_name` and `about` go through the module\'s edit form (`edit_entity`) with the form\'s own checks of the name; `about` is plain text, each line a paragraph, and replaces the whole text, so an about with links or formatting written on the site is not editable here (409 `formatted_text`), nor one longer than Profile.about carries (`about_truncated`; 409 `too_long`). Where the profile module keeps a last name apart (a person\'s name is the first and last name), `display_name` is not editable here (422 `not_editable`; the same name again is no change). `avatar_id` and `cover_id` take an upload of purpose `profile` (POST /uploads), which goes to the storage of the module of the profile acting when it was uploaded, so a profile of another module (an organization of one\'s account) takes one uploaded while it acts; anything else is 422 on the field. Null takes the picture or cover off. A replaced or removed file stays with the profile, as the site\'s edit form keeps it, so the earlier "changed picture" posts keep showing it. Everything that can refuse is checked before anything is written. A profile of the viewer\'s account that is not active (waiting for approval, suspended) can be edited too, as on the site. A site that approves profile changes may make the profile pending again (`status`). Answers the profile as it is now.',
        body: 'ProfileChanges', responses: [200 => 'Profile', 403 => null, 404 => null, 409 => null],
    )]
    public function updateProfile(BxDolApiV2Request $oReq)
    {
        $iViewerId = $oReq->requireViewer();
        $aBody = (array)$oReq->body();
        if (!$aBody)
            throw BxDolApiV2Problem::validation([['field' => '(body)', 'code' => 'required', 'message' => 'Send display_name, about, avatar_id or cover_id']]);

        $iProfileId = $oReq->id();
        $oProfile = self::existingProfile($iProfileId);
        $sModule = $oProfile->getModule();
        $oModule = BxDolModule::getInstance($sModule);
        $iContentId = (int)$oProfile->getContentId();
        $aContent = $oModule instanceof BxBaseModProfileModule ? $oModule->_oDb->getContentInfoById($iContentId, true) : [];
        // the account's own profiles are there for it whatever their status, as on the site
        $iAccountId = (int)getLoggedId();
        if (!$aContent || (!($iAccountId && (int)$oProfile->getAccountId() === $iAccountId) && !self::isAvailable($oProfile, $oModule)))
            throw BxDolApiV2Problem::notFound('The profile');

        $mCheck = $oModule->checkAllowedEdit($aContent);
        if ($mCheck !== CHECK_ACTION_RESULT_ALLOWED)
            throw BxDolApiV2Problem::forbidden(is_string($mCheck) ? BxDolApiV2Map::text($mCheck) : 'The viewer may not edit this profile');

        $CNF = &$oModule->_oConfig->CNF;
        $aValues = self::textChanges($oModule, $aContent, $aBody);
        $aImages = self::imageChanges($oModule, $oProfile, $aContent, $aBody);

        // the text first: the edit form's own file handling then sees no new picture of this request
        if ($aValues) {
            // as the form's own inputs keep them (its db pass): the edit service saves its values as given
            $aValues = BxDolApiV2Forms::dbPassed($oModule->getFormsHelper()->getObjectFormEdit($CNF['OBJECT_FORM_ENTRY_DISPLAY_EDIT'] ?? false), $aValues);
            $sError = BxDolApiV2Forms::editEntity($oModule, $iContentId, $aValues, $CNF['OBJECT_FORM_ENTRY_DISPLAY_EDIT']);
            if ($sError !== '' && $sError !== null)
                throw BxDolApiV2Problem::validation([['field' => '(body)', 'code' => 'rejected', 'message' => BxDolApiV2Map::text($sError) ?: 'The profile was not saved']], 'The profile was not saved');
        }

        // checked before: update_image asks the same edit check, an image field and the storage
        foreach ($aImages as $sField => $a) {
            list($oStorage, $iFileId, $iOwnerId) = $a;
            if ($iFileId)
                $oStorage->updateGhostsContentId($iFileId, $iOwnerId, $iContentId);
            // it answers the file's URL, which is false for no file: what it saved is what counts
            $oModule->serviceUpdateImage($sField, $iContentId, $iFileId);
            $aNow = $oModule->_oDb->getContentInfoById($iContentId, true);
            if ((int)($aNow[$sField] ?? -1) !== $iFileId)
                throw new BxDolApiV2Problem(500, 'not_saved', 'The site did not change the picture');
        }

        // a replaced or removed file stays with the profile, as the site's edit form keeps it:
        // the earlier "changed picture" and "changed cover" posts show it (by its file id)

        // read again what this request read before the change
        $oModule->_oDb->cleanMemory('profile_content_info_' . $oModule->_oConfig->getName() . $iContentId);
        // the name comes from the module's profile_name service, whose answers are kept per request
        BxDolService::cleanMemoryCache();
        BxDolApiV2Map::reset();
        return BxDolApiV2Map::profile($iProfileId);
    }

    /**
     * The edit form's values for display_name and about, only those that change. The form's own
     * checker of a field runs here (edit_entity runs none); about must be plain text on the site
     * already, since plain text replaces all of it.
     */
    protected static function textChanges($oModule, $aContent, $aBody)
    {
        $CNF = &$oModule->_oConfig->CNF;
        $aWant = [];
        if (array_key_exists('display_name', $aBody))
            $aWant['display_name'] = $CNF['FIELD_NAME'] ?? ($CNF['FIELD_TITLE'] ?? '');
        if (array_key_exists('about', $aBody))
            $aWant['about'] = $CNF['FIELD_TEXT'] ?? '';
        if (!$aWant)
            return [];

        $oForm = $oModule->getFormsHelper()->getObjectFormEdit($CNF['OBJECT_FORM_ENTRY_DISPLAY_EDIT'] ?? false);
        $aValues = [];
        $aErrors = [];
        foreach ($aWant as $sKey => $sField) {
            $aInput = $oForm && $sField !== '' ? ($oForm->aInputs[$sField] ?? null) : null;
            if (!$aInput) {
                $aErrors[] = ['field' => $sKey, 'code' => 'not_editable', 'message' => 'This site does not let it be changed'];
                continue;
            }

            $sCurrent = (string)($aContent[$sField] ?? '');
            if ($sKey === 'display_name') {
                $sValue = trim((string)$aBody[$sKey]);
                // a name made of two fields (persons: first and last name) is not one value to set
                $sLast = $CNF['FIELD_LAST_NAME'] ?? '';
                if ($sLast !== '' && (isset($oForm->aInputs[$sLast]) || trim((string)($aContent[$sLast] ?? '')) !== '')) {
                    if ($sValue === self::displayName($oModule, $aContent))
                        continue;
                    $aErrors[] = ['field' => $sKey, 'code' => 'not_editable', 'message' => 'This site keeps the first and last name apart: change the name on the site'];
                    continue;
                }
                if (!self::passesChecker($oForm, $aInput, $sValue)) {
                    $aErrors[] = ['field' => $sKey, 'code' => 'invalid_value', 'message' => BxDolApiV2Map::text($aInput['checker']['error'] ?? '') ?: 'Is not a name the site takes'];
                    continue;
                }
            }
            else {
                $sValue = BxDolApiV2Map::htmlFromText((string)$aBody[$sKey]);
                if (BxDolApiV2Map::text($sValue) === BxDolApiV2Map::text($sCurrent))
                    continue;
                // the client has only the start of it (Profile.about): the rest would be lost
                if (BxDolApiV2Map::aboutTruncated($sCurrent))
                    throw new BxDolApiV2Problem(409, 'too_long', 'This text is longer than the app shows: edit it on the site');
                if (!BxDolApiV2Map::isPlainHtml($sCurrent))
                    throw new BxDolApiV2Problem(409, 'formatted_text', 'This text has links or formatting: edit it on the site');
                if (!self::passesChecker($oForm, $aInput, $sValue)) {
                    $aErrors[] = ['field' => $sKey, 'code' => 'invalid_value', 'message' => BxDolApiV2Map::text($aInput['checker']['error'] ?? '') ?: 'Is not a text the site takes'];
                    continue;
                }
            }
            if ($sValue !== $sCurrent)
                $aValues[$sField] = $sValue;
        }
        if ($aErrors)
            throw BxDolApiV2Problem::validation($aErrors);
        return $aValues;
    }

    /**
     * The profile's name as the site shows it (the module's profile_name: first and last name).
     */
    protected static function displayName($oModule, $aContent)
    {
        return trim(html_entity_decode((string)$oModule->serviceProfileName((int)$aContent[$oModule->_oConfig->CNF['FIELD_ID']]), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
    }

    /**
     * The form input's checker (ProfileName, Length ...), as the site's form runs it.
     */
    protected static function passesChecker($oForm, $aInput, $sValue)
    {
        if (empty($aInput['checker']['func']))
            return true;
        $sHelper = !empty($oForm->aParams['checker_helper']) && class_exists($oForm->aParams['checker_helper']) ? $oForm->aParams['checker_helper'] : 'BxDolFormCheckerHelper';
        $aCall = [$sHelper, 'check' . bx_gen_method_name($aInput['checker']['func'])];
        if (!is_callable($aCall))
            return true;
        $aParams = !empty($aInput['checker']['params']) ? array_values((array)$aInput['checker']['params']) : [];
        $mResult = call_user_func_array($aCall, array_merge([$sValue], $aParams));
        return $mResult === true || ($mResult && !is_string($mResult));
    }

    /**
     * The pictures to set: image field => [storage, file id (0 to take it off), whose upload].
     * An upload must be one of the viewer's account's in the module's storage that nothing took
     * (or that this profile has already), and the cover the module's own check allows.
     */
    protected static function imageChanges($oModule, $oProfile, $aContent, $aBody)
    {
        $CNF = &$oModule->_oConfig->CNF;
        $aResult = [];
        $aErrors = [];
        foreach (['avatar_id' => ['FIELD_PICTURE', 'OBJECT_STORAGE'], 'cover_id' => ['FIELD_COVER', 'OBJECT_STORAGE_COVER']] as $sKey => list($sFieldKey, $sStorageKey)) {
            if (!array_key_exists($sKey, $aBody))
                continue;
            $sField = $CNF[$sFieldKey] ?? '';
            $sStorage = $CNF[$sStorageKey] ?? ($CNF['OBJECT_STORAGE'] ?? '');
            $oStorage = $sField !== '' && $sStorage !== '' ? BxDolStorage::getObjectInstance($sStorage) : null;
            // update_image needs the module's own storage too, before anything is written
            if (!$oStorage || empty($CNF['OBJECT_STORAGE']) || !BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE'])) {
                $aErrors[] = ['field' => $sKey, 'code' => 'not_editable', 'message' => 'This profile has no such picture'];
                continue;
            }
            if ($sKey === 'cover_id' && method_exists($oModule, 'checkAllowedChangeCover') && ($mCheck = $oModule->checkAllowedChangeCover($aContent)) !== CHECK_ACTION_RESULT_ALLOWED)
                throw BxDolApiV2Problem::forbidden(is_string($mCheck) ? BxDolApiV2Map::text($mCheck) : 'The viewer may not change the cover');

            if ($aBody[$sKey] === null) {
                $aResult[$sField] = [$oStorage, 0, 0];
                continue;
            }

            list($iStorageId, $iFileId) = BxDolApiV2Map::uploadParts($aBody[$sKey]);
            $aObject = BxDolStorageQuery::getStorageObject($sStorage);
            $aGhost = $iFileId && $iStorageId === (int)($aObject['id'] ?? -1) ? $oStorage->getGhost($iFileId) : null;
            $aFile = $aGhost ? BxDolApiV2Map::fileRow($sStorage, $iFileId) : null;
            $aAccountProfiles = ($oAccount = $oProfile->getAccountObject()) ? array_map('intval', $oAccount->getProfilesIds(false, false)) : [];
            if (empty($aGhost) || !is_array($aGhost) || !$aFile || !str_starts_with((string)$aFile['mime_type'], 'image/')
                || !in_array((int)$aGhost['profile_id'], $aAccountProfiles, true)
                || !in_array((int)$aGhost['content_id'], [0, (int)$oProfile->getContentId()], true)) {
                $aErrors[] = ['field' => $sKey, 'code' => 'not_found', 'message' => 'No photo uploaded for this profile (purpose profile) that nothing took'];
                continue;
            }
            $aResult[$sField] = [$oStorage, $iFileId, (int)$aGhost['profile_id']];
        }
        if ($aErrors)
            throw BxDolApiV2Problem::validation($aErrors);
        return $aResult;
    }

    /**
     * Where photos for a profile's picture and cover go (POST /uploads, purpose `profile`): the
     * storage of the acting profile's module, as its edit form puts them.
     */
    public function apiV2UploadStorages()
    {
        $oModule = self::actingProfileModule();
        if (!$oModule)
            return [];
        $CNF = &$oModule->_oConfig->CNF;
        return [[
            'purpose' => 'profile',
            'object' => $CNF['OBJECT_STORAGE'],
            'thumb' => (string)($CNF['OBJECT_IMAGES_TRANSCODER_THUMB'] ?? ''),
            'view' => (string)($CNF['OBJECT_IMAGES_TRANSCODER_AVATAR_BIG'] ?? ''),
            'uploader' => (string)(((array)($CNF['OBJECT_UPLOADERS_PICTURE'] ?? []))[0] ?? ''),
        ]];
    }

    /**
     * Who may upload a profile photo: who may edit the acting profile.
     * @return true|string
     */
    public function apiV2UploadAllowed($sPurpose)
    {
        $oModule = self::actingProfileModule();
        $oProfile = BxDolProfile::getInstance((int)bx_get_logged_profile_id());
        $aContent = $oModule && $oProfile ? $oModule->_oDb->getContentInfoById((int)$oProfile->getContentId()) : [];
        if (!$aContent)
            return 'This profile takes no pictures';
        $mCheck = $oModule->checkAllowedEdit($aContent);
        return $mCheck === CHECK_ACTION_RESULT_ALLOWED ? true : (string)$mCheck;
    }

    /**
     * The module of the acting profile when it is a profile module with a picture storage.
     */
    protected static function actingProfileModule()
    {
        $oProfile = BxDolProfile::getInstance((int)bx_get_logged_profile_id());
        $oModule = $oProfile && $oProfile->getModule() !== 'system' ? BxDolModule::getInstance($oProfile->getModule()) : null;
        if (!($oModule instanceof BxBaseModProfileModule) || empty($oModule->_oConfig->CNF['OBJECT_STORAGE']) || empty($oModule->_oConfig->CNF['FIELD_PICTURE']))
            return null;
        return $oModule;
    }

    #[BxDolApiV2Operation(
        method: 'GET', path: '/profiles/{id}/connections', id: 'getConnections', tag: 'graph',
        summary: 'Counts of followers, following and friends, and how the viewer relates to the profile',
        description: 'Counts are of active profiles, as the site shows them; `following` counts people and organizations (profile modules), not the groups and other contexts followed. `viewer` is null for guests and for the viewer\'s own profile. `lists` says which of the lists the viewer may open: whom a profile follows and who follows it are private on the site unless the profile module makes them public.',
        responses: [200 => 'Connections', 403 => null, 404 => null],
    )]
    public function getConnections(BxDolApiV2Request $oReq)
    {
        $iProfileId = $oReq->id();
        self::viewableProfile($iProfileId);
        $iViewerId = (int)$oReq->viewerId();

        $oFollows = self::connection(self::FOLLOWS);
        $oFriends = self::connection(self::FRIENDS);

        return [
            'followers' => (int)$oFollows->getConnectedInitiatorsCount($iProfileId),
            'following' => (int)$oFollows->getConnectedContentCountExt($iProfileId, false, ['by_type' => self::profileModules()]),
            'friends' => (int)$oFriends->getConnectedContentCount($iProfileId, true),
            'viewer' => $iViewerId && $iViewerId !== $iProfileId ? self::relation($oFollows, $oFriends, $iViewerId, $iProfileId) : null,
            'lists' => [
                'followers' => self::canList($iProfileId, 'followers'),
                'following' => self::canList($iProfileId, 'following'),
                'friends' => self::canList($iProfileId, 'friends'),
            ],
        ];
    }

    #[BxDolApiV2Operation(
        method: 'POST', path: '/profiles/{id}/follow', id: 'follow', tag: 'graph', auth: 'required',
        summary: 'Follow a profile',
        description: 'Following again is not an error. The site\'s checks apply: the viewer\'s membership must allow connections and the profile must be one the viewer may see (403).',
        responses: [204 => null, 403 => null, 404 => null, 409 => null],
    )]
    public function follow(BxDolApiV2Request $oReq)
    {
        list($iViewerId, $iProfileId) = self::pair($oReq);
        $oFollows = self::connection(self::FOLLOWS);

        if (!$oFollows->isConnected($iViewerId, $iProfileId)) {
            $a = $oFollows->actionAdd($iProfileId, $iViewerId);
            if (!empty($a['err']) && !$oFollows->isConnected($iViewerId, $iProfileId))
                throw BxDolApiV2Problem::forbidden(BxDolApiV2Map::text($a['msg'] ?? ''));
        }

        return BxDolApiV2Response::noContent();
    }

    #[BxDolApiV2Operation(
        method: 'DELETE', path: '/profiles/{id}/follow', id: 'unfollow', tag: 'graph', auth: 'required',
        summary: 'Stop following a profile',
        description: 'Not following is not an error. A friendship stays (until DELETE /profiles/{id}/friend).',
        responses: [204 => null, 403 => null, 404 => null, 409 => null],
    )]
    public function unfollow(BxDolApiV2Request $oReq)
    {
        list($iViewerId, $iProfileId) = self::pair($oReq);
        $oFollows = self::connection(self::FOLLOWS);

        if ($oFollows->isConnected($iViewerId, $iProfileId)) {
            $a = $oFollows->actionRemove($iProfileId, $iViewerId);
            if (!empty($a['err']) && $oFollows->isConnected($iViewerId, $iProfileId))
                throw BxDolApiV2Problem::forbidden(BxDolApiV2Map::text($a['msg'] ?? ''));
        }

        return BxDolApiV2Response::noContent();
    }

    #[BxDolApiV2Operation(
        method: 'POST', path: '/profiles/{id}/friend', id: 'befriend', tag: 'graph', auth: 'required',
        summary: 'Send a friend request, or accept the one the profile sent',
        description: 'Answers `requested` while the other profile has not accepted and `friends` once both have; asking again is not an error. Friends follow each other: accepting adds a follow both ways, as on the site. 403 `friends_unavailable` for groups and for profile modules with friends turned off.',
        responses: [200 => 'FriendResult', 403 => null, 404 => null, 409 => null],
    )]
    public function befriend(BxDolApiV2Request $oReq)
    {
        list($iViewerId, $iProfileId) = self::pair($oReq);
        if (!self::friendsOn($iViewerId) || !self::friendsOn($iProfileId))
            throw new BxDolApiV2Problem(403, 'friends_unavailable', 'This profile can\'t have friends on this site');

        $oFriends = self::connection(self::FRIENDS);
        if (!$oFriends->isConnected($iViewerId, $iProfileId)) {
            $a = $oFriends->actionAdd($iProfileId, $iViewerId);
            if (!empty($a['err']) && !$oFriends->isConnected($iViewerId, $iProfileId))
                throw BxDolApiV2Problem::forbidden(BxDolApiV2Map::text($a['msg'] ?? ''));
        }

        return ['status' => $oFriends->isConnected($iViewerId, $iProfileId, true) ? 'friends' : 'requested'];
    }

    #[BxDolApiV2Operation(
        method: 'DELETE', path: '/profiles/{id}/friend', id: 'unfriend', tag: 'graph', auth: 'required',
        summary: 'Cancel a friend request, decline one, or end a friendship',
        description: 'One call for all three, as on the site. No request and no friendship is not an error. Ending a friendship also ends both follows, as the site does.',
        responses: [204 => null, 403 => null, 404 => null, 409 => null],
    )]
    public function unfriend(BxDolApiV2Request $oReq)
    {
        list($iViewerId, $iProfileId) = self::pair($oReq);
        $oFriends = self::connection(self::FRIENDS);

        $fConnected = function () use ($oFriends, $iViewerId, $iProfileId) {
            return $oFriends->isConnected($iViewerId, $iProfileId) || $oFriends->isConnected($iProfileId, $iViewerId);
        };

        if ($fConnected()) {
            $a = $oFriends->actionRemove($iProfileId, $iViewerId);
            if (!empty($a['err']) && $fConnected())
                throw BxDolApiV2Problem::forbidden(BxDolApiV2Map::text($a['msg'] ?? ''));
        }

        return BxDolApiV2Response::noContent();
    }

    #[BxDolApiV2Operation(
        method: 'GET', path: '/profiles/{id}/followers', id: 'listFollowers', tag: 'graph', paged: true,
        summary: 'Profiles following this one, newest first',
        description: 'Private (403) unless it is the viewer\'s own profile or the profile module makes the list public (`connections.lists.followers`).',
        responses: [200 => 'Page_Connected', 403 => null, 404 => null],
    )]
    public function listFollowers(BxDolApiV2Request $oReq)
    {
        return $this->_list($oReq, 'followers');
    }

    #[BxDolApiV2Operation(
        method: 'GET', path: '/profiles/{id}/following', id: 'listFollowing', tag: 'graph', paged: true,
        summary: 'Profiles this one follows, newest first',
        description: 'People and organizations (profile modules), as the site\'s Following list shows them; groups, events and other contexts followed are left out. Private (403) unless it is the viewer\'s own profile or the profile module makes the list public (`connections.lists.following`).',
        responses: [200 => 'Page_Connected', 403 => null, 404 => null],
    )]
    public function listFollowing(BxDolApiV2Request $oReq)
    {
        return $this->_list($oReq, 'following');
    }

    #[BxDolApiV2Operation(
        method: 'GET', path: '/profiles/{id}/friends', id: 'listFriends', tag: 'graph', paged: true,
        summary: 'This profile\'s friends, newest friendship first',
        description: 'Anyone who may see the profile may see its friends, as on the site.',
        responses: [200 => 'Page_Connected', 403 => null, 404 => null],
    )]
    public function listFriends(BxDolApiV2Request $oReq)
    {
        return $this->_list($oReq, 'friends');
    }

    #[BxDolApiV2Operation(
        method: 'GET', path: '/me/friend-requests', id: 'listFriendRequests', tag: 'graph', auth: 'required', paged: true,
        summary: 'Friend requests waiting for the acting profile, newest first',
        description: 'Accept one with POST /profiles/{id}/friend, decline it with DELETE.',
        responses: [200 => 'Page_Connected'],
    )]
    public function listFriendRequests(BxDolApiV2Request $oReq)
    {
        $iViewerId = $oReq->requireViewer();
        $oFriends = self::connection(self::FRIENDS);
        $iOffset = $oReq->cursorOffset();
        $iLimit = $oReq->limit();

        // the integer 0 (not false) asks for rows that are not mutual yet
        $aRows = $oFriends->getConnectedInitiatorsWithDates($iViewerId, 0, $iOffset, $iLimit + 1, BX_CONNECTIONS_ORDER_ADDED_DESC);
        return self::connectedPage($oReq, $aRows, $iOffset, $iLimit);
    }

    #[BxDolApiV2Operation(
        method: 'GET', path: '/me/friend-requests/sent', id: 'listSentFriendRequests', tag: 'graph', auth: 'required', paged: true,
        summary: 'Friend requests the acting profile sent that wait for an answer, newest first',
        description: 'The site\'s Sent Requests (`browse_friend_requested`), of the acting profile only: there is no route to another profile\'s. Cancel one with DELETE /profiles/{id}/friend, the same call that declines a request received and ends a friendship. A request the other profile accepted or declined is no longer listed. `since` is when it was sent.',
        responses: [200 => 'Page_Connected'],
    )]
    public function listSentFriendRequests(BxDolApiV2Request $oReq)
    {
        $iViewerId = $oReq->requireViewer();
        $oFriends = self::connection(self::FRIENDS);
        $iOffset = $oReq->cursorOffset();
        $iLimit = $oReq->limit();

        // the viewer's own rows that are not mutual yet (the integer 0, not false): asked, not answered
        $aRows = $oFriends->getConnectedContentWithDates($iViewerId, 0, $iOffset, $iLimit + 1, BX_CONNECTIONS_ORDER_ADDED_DESC);
        return self::connectedPage($oReq, $aRows, $iOffset, $iLimit);
    }

    #[BxDolApiV2Operation(
        method: 'GET', path: '/me/recommendations/friends', id: 'listFriendSuggestions', tag: 'graph', auth: 'required', paged: true,
        summary: 'People the acting profile may know, best match first',
        description: 'The site\'s Friend Suggestions (`browse_recommendations_friends`, the `sys_friends` recommendation): people with friends in common, in the same groups or nearby and recently active, as the site works them out for the acting profile (after a new friendship, and when the profile is saved), friends and those asked already left out. `score` is the site\'s points for the match. Active profiles only; POST /profiles/{id}/friend asks one to be friends. Only the acting profile\'s own: no route names another\'s.',
        responses: [200 => 'Page_Suggestion'],
    )]
    public function listFriendSuggestions(BxDolApiV2Request $oReq)
    {
        return $this->_suggestions($oReq, 'sys_friends', false);
    }

    #[BxDolApiV2Operation(
        method: 'GET', path: '/me/recommendations/follows', id: 'listFollowSuggestions', tag: 'graph', auth: 'required', paged: true,
        summary: 'People and organizations the acting profile may want to follow, best match first',
        description: 'The site\'s Who to Follow (`browse_recommendations_subscriptions`, the `sys_subscriptions` recommendation): profiles that those the acting profile follows follow, or that are in the same groups, profile modules only, those followed already left out. `score` is the site\'s points for the match. Active profiles only; POST /profiles/{id}/follow follows one. Only the acting profile\'s own.',
        responses: [200 => 'Page_Suggestion'],
    )]
    public function listFollowSuggestions(BxDolApiV2Request $oReq)
    {
        return $this->_suggestions($oReq, 'sys_subscriptions', true);
    }

    /**
     * A page of a recommendation object's items for the viewer, as the site keeps them
     * (sys_recommendation_data, best first): one query, then the profiles. The cursor counts
     * rows, so a profile left out (not active) makes a page shorter rather than shifting the
     * next one.
     * @param bool $bProfilesOnly only items of profile modules, as the site's Who to Follow
     */
    protected function _suggestions(BxDolApiV2Request $oReq, $sObject, $bProfilesOnly)
    {
        $iViewerId = (int)$oReq->requireViewer();
        $iOffset = $oReq->cursorOffset();
        $iLimit = $oReq->limit();

        $oRecommendation = BxDolRecommendation::getObjectInstance($sObject);
        if (!$oRecommendation)
            return $oReq->pageAt([], null);

        $aParams = ['start' => $iOffset, 'per_page' => $iLimit + 1];
        if ($bProfilesOnly)
            $aParams['type'] = self::profileModules();
        $aRows = $oRecommendation->getList($iViewerId, $aParams);
        $aRows = is_array($aRows) ? $aRows : [];

        $aShown = array_slice($aRows, 0, $iLimit, true);
        $aSummaries = self::summaries(array_keys($aShown));
        $aItems = [];
        foreach ($aShown as $iOther => $iScore) {
            if ((int)$iOther === $iViewerId || !($aSummary = $aSummaries[(int)$iOther] ?? null) || $aSummary['status'] !== 'active')
                continue;
            $aItems[] = ['profile' => $aSummary, 'score' => max(0, (int)$iScore)];
        }

        return $oReq->pageAt($aItems, count($aRows) > $iLimit ? $iOffset + $iLimit : null);
    }

    /**
     * GET /layout/resolve (BxBaseApiV2Layout): the system's blocks of people the API feeds. The
     * viewer's Friends (`browse_friends` of the viewer, as the site's Friends block of one's own),
     * Friend Suggestions and Who to Follow; for members only, as the routes are.
     */
    public function apiV2PageBlock($aCall, $aContext)
    {
        // a profile's (or context's) page: its Info and its Friends, of the profile the page shows
        if ($aCall['module'] !== 'system' && ($aCall['menu'] ?? '') === '' && in_array($aCall['method'], ['entity_info', 'profile_friends'], true)) {
            if (!(BxDolModule::getInstance($aCall['module']) instanceof BxBaseModProfileModule) || !($iProfileId = BxBaseApiV2Layout::pageProfileId($aContext)))
                return null;
            return $aCall['method'] === 'entity_info'
                ? ['kind' => 'profile.info', 'endpoint' => '/profiles/' . $iProfileId . '/info']
                : ['kind' => 'graph.friends', 'endpoint' => '/profiles/' . $iProfileId . '/friends'];
        }

        if ($aCall['module'] !== 'system' || ($aCall['class'] !== '' && $aCall['class'] !== 'TemplServiceProfiles') || empty($aContext['viewer']))
            return null;

        $aOptions = isset($aCall['params'][1]) && is_array($aCall['params'][1]) ? $aCall['params'][1] : [];
        $aQuery = !empty($aOptions['per_page']) && (int)$aOptions['per_page'] > 0 ? ['limit' => min((int)$aOptions['per_page'], BxDolApiV2Request::LIMIT_MAX)] : [];

        switch ($aCall['method']) {
            case 'browse_friends':
                // the viewer's own friends: a block naming another profile ({profile_id} of a profile's page) is that page's business
                $mProfile = $aCall['params'][0] ?? 0;
                if (!in_array($mProfile, [0, '0', '', '{logged_profile_id}'], true) && (int)$mProfile !== (int)$aContext['viewer'])
                    return null;
                return ['kind' => 'graph.friends', 'endpoint' => '/profiles/' . (int)$aContext['viewer'] . '/friends', 'query' => $aQuery];
            case 'browse_recommendations_friends':
                return ['kind' => 'graph.friend_suggestions', 'endpoint' => '/me/recommendations/friends', 'query' => $aQuery];
            case 'browse_recommendations_subscriptions':
                return ['kind' => 'graph.follow_suggestions', 'endpoint' => '/me/recommendations/follows', 'query' => $aQuery];
        }
        return null;
    }

    /**
     * GET /realtime: the viewer's connections channel, where BxDolConnection says `changed`
     * whenever one of the viewer's friendships or follows does (both sides get it).
     */
    public function apiV2RealtimeChannels($iViewerId)
    {
        return $iViewerId > 0 ? ['connections' => BxDolConnection::SOCKET_NAME . '_' . (int)$iViewerId] : [];
    }

    /**
     * GET /sync: the friend requests badge, the same count as the GET /me/friend-requests list.
     */
    public function apiV2Sync($iViewerId, $aCursor, $bReset)
    {
        $oFriends = BxDolConnection::getObjectInstance(self::FRIENDS);
        // the integer 0 (not false) counts rows that are not mutual yet
        return $oFriends ? ['badges' => ['friend_requests' => (int)$oFriends->getConnectedInitiatorsCount($iViewerId, 0)]] : [];
    }

    /**
     * The profile if the viewer may see it, otherwise the matching problem.
     */
    /** Input types the Info block draws its own way, or that have no value to show. */
    const INFO_SKIPPED_TYPES = ['hidden', 'block_header', 'block_end', 'nested_form', 'files', 'file', 'image', 'captcha', 'submit', 'reset', 'button', 'input_set', 'custom', 'location', 'value'];

    /**
     * The fields of a profile's view form (the module's view display) as its Info block shows
     * them (BxBaseModGeneralFormsEntryHelper::viewDataForm, BxBaseFormView::genViewRow): those
     * the viewer may see with a value, as text, the name and what has a row of its own left out.
     * @return array of InfoField
     */
    protected static function infoFields($oModule, $aContent)
    {
        $CNF = &$oModule->_oConfig->CNF;
        $oForm = $oModule->getFormsHelper()->getObjectFormView();
        if (!$oForm)
            return [];

        $iContentId = (int)($aContent[$CNF['FIELD_ID']] ?? 0);
        $aSpecific = [];
        if (!empty($CNF['OBJECT_METATAGS']) && ($oMetatags = BxDolMetatags::getObjectInstance($CNF['OBJECT_METATAGS'])) && $oMetatags->locationsIsEnabled())
            $aSpecific = $oMetatags->locationGet($iContentId, empty($CNF['FIELD_LOCATION_PREFIX']) ? '' : $CNF['FIELD_LOCATION_PREFIX']);
        $oForm->initChecker($aContent, is_array($aSpecific) ? $aSpecific : []);

        $aNames = array_filter([(string)($CNF['FIELD_NAME'] ?? ''), (string)($CNF['FIELD_TITLE'] ?? '')]);
        $aFields = [];
        foreach ($oForm->aInputs as $aInput) {
            if (!is_array($aInput) || empty($aInput['name']) || !is_string($aInput['name']) || empty($aInput['type']) || in_array($aInput['type'], self::INFO_SKIPPED_TYPES, true))
                continue;
            if (in_array($aInput['name'], $aNames, true) || !empty($aInput['secret']))
                continue;
            if (!BxDolForm::isVisible($aInput) || !$oForm->isInputVisible($aInput))
                continue;
            // a field the site draws a row of its own for (an event's end and time)
            if (method_exists($oForm, 'genCustomRow' . bx_gen_method_name($aInput['name'])))
                continue;

            $sHtml = $oForm->genViewRowValue($aInput);
            $sValue = $sHtml === null ? '' : BxDolApiV2Map::text((string)$sHtml, 1000);
            if ($sValue === '')
                continue;
            $sCaption = (string)($aInput['caption'] ?? '');
            if ($sCaption !== '' && $sCaption[0] === '_')
                $sCaption = _t($sCaption);
            $aFields[] = [
                'name' => $aInput['name'],
                'label' => BxDolApiV2Map::text($sCaption, 200),
                'value' => $sValue,
                'datetime' => preg_match('/<time\b[^>]*\bdatetime="([^"]{1,40})"/', (string)$sHtml, $m) ? $m[1] : null,
            ];
        }
        return $aFields;
    }

    public static function viewableProfile($iProfileId)
    {
        $oProfile = self::existingProfile($iProfileId);

        $sModule = $oProfile->getModule();
        $oModule = BxDolModule::getInstance($sModule);
        $aContent = BxDolApiV2Map::profileContent($oProfile);
        if (!$oModule || !$aContent || !self::isAvailable($oProfile, $oModule))
            throw BxDolApiV2Problem::notFound('The profile');

        // without the request's params: a context's view check reads `key` (an invitation link's)
        $mCheck = method_exists($oModule, 'checkAllowedView') ? BxDolApiV2Search::isolated(function () use ($oModule, $aContent) {
            return $oModule->checkAllowedView($aContent);
        }) : CHECK_ACTION_RESULT_ALLOWED;
        if ($mCheck !== CHECK_ACTION_RESULT_ALLOWED) {
            // a secret group is not known to exist to those who may not see it (GET /groups/{id})
            if (self::isSecretContext($oModule, $aContent))
                throw BxDolApiV2Problem::notFound('The profile');
            throw BxDolApiV2Problem::forbidden(is_string($mCheck) ? BxDolApiV2Map::text($mCheck) : '');
        }

        return BxDolApiV2Map::profile($iProfileId);
    }

    /**
     * A profile whose page the viewer may see, for what its page shows (its Info, its More):
     * [profile, module, content]. The profile module's view check, without the request's params
     * (a context's view check reads `key`, an invitation link's), and a closed context's page is
     * for those outside it too, as on the site (BxBaseModGroupsFormsEntryHelper); a secret one is
     * 404 to those who may not see it.
     */
    protected static function pageProfile($iProfileId)
    {
        $oProfile = self::existingProfile($iProfileId);
        $oModule = BxDolModule::getInstance($oProfile->getModule());
        $aContent = BxDolApiV2Map::profileContent($oProfile);
        if (!$oModule instanceof BxBaseModProfileModule || !$aContent || !self::isAvailable($oProfile, $oModule))
            throw BxDolApiV2Problem::notFound('The profile');

        BxDolApiV2Search::isolated(function () use ($oModule, $aContent) {
            $CNF = &$oModule->_oConfig->CNF;
            $mCheck = $oModule->checkAllowedView($aContent);
            if ($mCheck !== CHECK_ACTION_RESULT_ALLOWED && $oModule instanceof BxBaseModGroupsModule && !empty($CNF['OBJECT_PRIVACY_VIEW']) && !empty($CNF['FIELD_ALLOW_VIEW_TO'])
                && ($oPrivacy = BxDolPrivacy::getObjectInstance($CNF['OBJECT_PRIVACY_VIEW'])) && $oPrivacy->isPartiallyVisible($aContent[$CNF['FIELD_ALLOW_VIEW_TO']] ?? ''))
                $mCheck = CHECK_ACTION_RESULT_ALLOWED;
            if ($mCheck !== CHECK_ACTION_RESULT_ALLOWED) {
                if (self::isSecretContext($oModule, $aContent))
                    throw BxDolApiV2Problem::notFound('The profile');
                throw BxDolApiV2Problem::forbidden(is_string($mCheck) ? BxDolApiV2Map::text($mCheck) : '');
            }
        });

        return [$oProfile, $oModule, $aContent];
    }

    /**
     * The items of a page's More the apps do themselves (GET /profiles/{id}/actions): the items of
     * the module's view actions menus the apps get (active in the apps, and visible to the viewer:
     * the menu's own checks, as getMenuItemsNames makes them in its API mode, without building the
     * items, whose connection buttons need api.php's mode), all actions first and then the More
     * popup's, each name once.
     */
    protected static function moreActions($oProfile, $oModule, $iViewerId)
    {
        $CNF = &$oModule->_oConfig->CNF;
        $iContentId = (int)$oProfile->getContentId();
        $aOut = [];
        $aSeen = [];
        foreach (['OBJECT_MENU_ACTIONS_VIEW_ENTRY_ALL', 'OBJECT_MENU_ACTIONS_VIEW_ENTRY_MORE'] as $sKey) {
            if (empty($CNF[$sKey]) || !($oMenu = BxTemplMenu::getObjectInstance($CNF[$sKey])) || !method_exists($oMenu, 'getMenuItemsNames'))
                continue;
            if (method_exists($oMenu, 'setContentId'))
                $oMenu->setContentId($iContentId);
            $fItems = Closure::bind(function () {
                $bIsApi = $this->_bIsApi;
                $this->_bIsApi = true;
                try {
                    $aItems = [];
                    foreach ($this->getMenuItemsNames() as $sName) {
                        $a = $this->_aObject['menu_items'][$sName] ?? [];
                        $aItems[] = ['name' => (string)$sName, 'title' => !empty($a['title']) ? _t($a['title']) : '', 'icon' => (string)($a['icon'] ?? '')];
                    }
                    return $aItems;
                }
                finally {
                    $this->_bIsApi = $bIsApi;
                }
            }, $oMenu, get_class($oMenu));
            foreach ($fItems() as $aItem) {
                $sName = $aItem['name'];
                if ($sName === '' || isset($aSeen[$sName]) || !($aAction = self::moreAction($sName, $oProfile, $oModule, $iViewerId)))
                    continue;
                $aSeen[$sName] = true;
                $sTitle = trim(BxDolApiV2Map::text($aItem['title']));
                $aOut[] = [
                    'name' => $sName,
                    'title' => $sTitle !== '' ? $sTitle : $aAction['title'],
                    'icon' => BxBaseApiV2Navigation::icon($aItem['icon']) ?? $aAction['icon'],
                    'action' => $aAction['action'],
                    'done' => $aAction['done'],
                    'choices' => $aAction['choices'],
                ];
            }
        }
        return $aOut;
    }

    /**
     * What a More item does in the apps, by its name; null for one they don't do. `report` is the
     * module's report object (the menu's item checks only that it is on); `edit-<module>-profile`
     * the profile editor (PATCH /profiles/{id}), for persons and organizations, not contexts.
     */
    protected static function moreAction($sName, $oProfile, $oModule, $iViewerId)
    {
        if ($sName === 'report') {
            if ((int)$oProfile->id() === (int)$iViewerId)
                return null;
            $iContentId = (int)$oProfile->getContentId();
            $oReport = self::reportObject($oModule, $iContentId);
            if (!$oReport || !$oReport->isAllowedReport())
                return null;
            $aChoices = [];
            foreach (self::reportChoices() as $sValue => $sTitle)
                $aChoices[] = ['name' => (string)$sValue, 'title' => $sTitle];
            return ['action' => 'report', 'title' => 'Report', 'icon' => 'flag', 'done' => (bool)$oReport->isPerformed($iContentId, $iViewerId), 'choices' => $aChoices];
        }
        if (preg_match('/^edit-[a-z0-9-]+-profile$/', $sName) && !$oModule instanceof BxBaseModGroupsModule) {
            $aContent = $oModule->_oDb->getContentInfoById((int)$oProfile->getContentId());
            if (!$aContent || $oModule->checkAllowedEdit($aContent) !== CHECK_ACTION_RESULT_ALLOWED)
                return null;
            return ['action' => 'edit', 'title' => 'Edit profile', 'icon' => 'square-pen', 'done' => false, 'choices' => null];
        }
        return null;
    }

    /** The module's report object of a profile's content, when the site has it on; null otherwise. */
    protected static function reportObject($oModule, $iContentId)
    {
        $CNF = &$oModule->_oConfig->CNF;
        if (empty($CNF['OBJECT_REPORTS']))
            return null;
        $oReport = BxDolReport::getObjectInstance($CNF['OBJECT_REPORTS'], $iContentId);
        return $oReport && $oReport->isEnabled() ? $oReport : null;
    }

    /** The site's reasons for a report (the `sys_report_types` list, Studio > Forms > Data lists): value => title. */
    protected static function reportChoices()
    {
        $a = BxDolFormQuery::getDataItems('sys_report_types');
        if (!is_array($a) || !$a)
            $a = ['spam' => 'Spam', 'scam' => 'Scam', 'fraud' => 'Fraud', 'nude' => 'Nudity', 'other' => 'Other'];
        $aOut = [];
        foreach ($a as $sValue => $sTitle)
            $aOut[(string)$sValue] = BxDolApiV2Map::text((string)$sTitle);
        return $aOut;
    }

    /**
     * Whether the viewer may know of the profile at all, as the site's profile page decides
     * (BxBaseModProfilePageEntry::_isAvailablePage): an active one, or one that is not (suspended,
     * waiting for approval) to the profile itself and to those who may edit any of the module's.
     */
    public static function isAvailable($oProfile, $oModule)
    {
        if ($oProfile->isActive() || (int)$oProfile->id() === (int)bx_get_logged_profile_id())
            return true;
        return method_exists($oModule, 'checkAllowedEditAnyEntry') && $oModule->checkAllowedEditAnyEntry() === CHECK_ACTION_RESULT_ALLOWED;
    }

    /**
     * A context (group, space, event) whose privacy is secret: members and invitees only.
     */
    protected static function isSecretContext($oModule, $aContent)
    {
        if (!($oModule instanceof BxBaseModGroupsModule))
            return false;
        $CNF = &$oModule->_oConfig->CNF;
        if (empty($CNF['FIELD_ALLOW_VIEW_TO']) || empty($CNF['OBJECT_PRIVACY_VIEW']))
            return false;
        // the privacy class defines BX_BASE_MOD_GROUPS_PG_SECRET
        BxDolPrivacy::getObjectInstance($CNF['OBJECT_PRIVACY_VIEW']);
        return defined('BX_BASE_MOD_GROUPS_PG_SECRET') && (string)($aContent[$CNF['FIELD_ALLOW_VIEW_TO']] ?? '') === BX_BASE_MOD_GROUPS_PG_SECRET;
    }

    /**
     * A profile that exists and is not an account's system profile, or 404.
     */
    public static function existingProfile($iProfileId)
    {
        $oProfile = BxDolProfile::getInstance($iProfileId);
        if (!$oProfile || $oProfile->getModule() === 'system')
            throw BxDolApiV2Problem::notFound('The profile');
        return $oProfile;
    }

    /**
     * The followers, following or friends list of a profile.
     */
    protected function _list(BxDolApiV2Request $oReq, $sList)
    {
        $iProfileId = $oReq->id();
        self::viewableProfile($iProfileId);
        if (!self::canList($iProfileId, $sList))
            throw BxDolApiV2Problem::forbidden('This profile keeps the list private');

        $iOffset = $oReq->cursorOffset();
        $iLimit = $oReq->limit();

        // the connection object first: loading its class defines the BX_CONNECTIONS_* constants
        $oConnection = self::connection($sList === 'friends' ? self::FRIENDS : self::FOLLOWS);
        $iOrder = BX_CONNECTIONS_ORDER_ADDED_DESC;
        if ($sList === 'followers')
            $aRows = $oConnection->getConnectedInitiatorsWithDates($iProfileId, false, $iOffset, $iLimit + 1, $iOrder);
        else if ($sList === 'friends')
            $aRows = $oConnection->getConnectedContentWithDates($iProfileId, 1, $iOffset, $iLimit + 1, $iOrder);
        else
            // as the site's Following list (BxBaseProfileSearchResult 'subscriptions'): profile
            // modules only, since the groups and other contexts one follows are the follower's own
            // business (BxBaseMenuProfileFollowings shows them to the follower alone)
            $aRows = $oConnection->getConnectedContentWithDates($iProfileId, false, $iOffset, $iLimit + 1, $iOrder, self::profileModules());

        return self::connectedPage($oReq, $aRows, $iOffset, $iLimit);
    }

    /**
     * A page of Connected items for up to limit + 1 connection rows (other profile id => the
     * row's `added`). The cursor counts rows, so a profile that is gone leaves a page shorter
     * rather than shifting the next one.
     */
    protected static function connectedPage(BxDolApiV2Request $oReq, $aRows, $iOffset, $iLimit)
    {
        $aRows = is_array($aRows) ? $aRows : [];

        $aShown = array_slice($aRows, 0, $iLimit, true);
        $aSummaries = self::summaries(array_keys($aShown));
        $aItems = [];
        foreach ($aShown as $iOther => $iAdded) {
            if (!($aSummary = $aSummaries[(int)$iOther] ?? null))
                continue;
            $aItems[] = [
                'profile' => $aSummary,
                'since' => BxDolApiV2Map::date((int)$iAdded),
            ];
        }

        return $oReq->pageAt($aItems, count($aRows) > $iLimit ? $iOffset + $iLimit : null);
    }

    /**
     * The embedded Profiles of a page's profiles, by id (null for one that is gone), with what
     * they show read at once (BxDolApiV2Map::primeProfiles inside the file row, transcoder and
     * SEO link scopes): a query per module and table instead of a few per profile. Other
     * endpoints' lists of people (a group's members) use it too.
     */
    public static function summaries(array $aProfileIds)
    {
        $iRows = BxDolStorageQuery::openFileRowsScope();
        $iHandlers = BxDolTranscoderQuery::openHandlersScope();
        $iSeo = BxDolPageQuery::openSeoLinksScope();
        try {
            BxDolApiV2Map::primeProfiles($aProfileIds);
            $aSummaries = [];
            foreach ($aProfileIds as $iId)
                $aSummaries[(int)$iId] = BxDolApiV2Map::profileSummary((int)$iId);
            return $aSummaries;
        }
        finally {
            BxDolPageQuery::closeSeoLinksScope($iSeo);
            BxDolTranscoderQuery::closeHandlersScope($iHandlers);
            BxDolStorageQuery::closeFileRowsScope($iRows);
        }
    }

    /**
     * Names of the enabled profile modules (persons, organizations), the ones the site's
     * connection lists show.
     */
    protected static function profileModules()
    {
        static $aNames = null;
        if ($aNames === null) {
            $aNames = [];
            foreach (bx_srv('system', 'get_modules_by_type', ['profile']) as $aModule)
                $aNames[] = $aModule['name'];
        }
        // an empty IN () would be invalid SQL; no profile module means no such profile either
        return $aNames ?: ['-'];
    }

    /**
     * How the viewer relates to a profile (Relation), with what the viewer may do next.
     */
    protected static function relation($oFollows, $oFriends, $iViewerId, $iProfileId)
    {
        $bFollowing = (bool)$oFollows->isConnected($iViewerId, $iProfileId);
        $bFriends = (bool)$oFriends->isConnected($iViewerId, $iProfileId, true);
        $bSent = !$bFriends && $oFriends->isConnected($iViewerId, $iProfileId);
        $bReceived = !$bFriends && $oFriends->isConnected($iProfileId, $iViewerId);

        return [
            'following' => $bFollowing,
            'followed_by' => (bool)$oFollows->isConnected($iProfileId, $iViewerId),
            'friends' => $bFriends,
            'request_sent' => $bSent,
            'request_received' => $bReceived,
            'blocking' => false,
            'muting' => false,
            'can_follow' => !$bFollowing && $oFollows->checkAllowedAddConnection($iViewerId, $iProfileId) === CHECK_ACTION_RESULT_ALLOWED,
            'can_befriend' => !$bFriends && !$bSent && self::friendsOn($iViewerId) && self::friendsOn($iProfileId)
                && $oFriends->checkAllowedAddConnection($iViewerId, $iProfileId) === CHECK_ACTION_RESULT_ALLOWED,
        ];
    }

    /**
     * The viewer and the profile a graph change is about: 401 for a guest, 404 for no such
     * profile, 409 for the viewer's own.
     */
    protected static function pair(BxDolApiV2Request $oReq)
    {
        $iViewerId = (int)$oReq->requireViewer();
        $iProfileId = $oReq->id();
        self::existingProfile($iProfileId);
        if ($iProfileId === $iViewerId)
            throw new BxDolApiV2Problem(409, 'own_profile', 'A profile can\'t follow or befriend itself');
        return [$iViewerId, $iProfileId];
    }

    /**
     * Whether the viewer may open a list of the profile: friends whenever the profile is
     * visible, following and followers as the site's browse blocks decide.
     */
    protected static function canList($iProfileId, $sList)
    {
        if ($sList === 'friends')
            return self::friendsOn($iProfileId);

        $oService = new BxTemplServiceProfiles();
        return (bool)$oService->canBrowseFollowList($iProfileId, $sList === 'followers' ? 'PARAM_PUBLIC_SBSD' : 'PARAM_PUBLIC_SBSN');
    }

    /**
     * Friends exist for persons and organizations whose module has them turned on, not for groups.
     */
    protected static function friendsOn($iProfileId)
    {
        $oProfile = BxDolProfile::getInstance($iProfileId);
        if (!$oProfile || ($sModule = $oProfile->getModule()) === 'system' || BxDolApiV2Map::profileKind($sModule) === 'group')
            return false;

        // _oConfig is made on first read (BxDolModule::__get), so isset() would say false
        $oModule = BxDolModule::getInstance($sModule);
        $oConfig = $oModule ? $oModule->_oConfig : null;
        return is_object($oConfig) && method_exists($oConfig, 'isFriends') && $oConfig->isFriends();
    }

    protected static function connection($sObject)
    {
        $o = BxDolConnection::getObjectInstance($sObject);
        if (!$o)
            throw new BxDolApiV2Problem(503, 'unavailable', 'Connections are not set up on this site');
        return $o;
    }

    public static function schemas()
    {
        $aBool = ['type' => 'boolean'];
        return [
            'Connections' => [
                'type' => 'object',
                'required' => ['followers', 'following', 'friends', 'viewer', 'lists'],
                'properties' => [
                    'followers' => ['type' => 'integer', 'minimum' => 0],
                    'following' => ['type' => 'integer', 'minimum' => 0],
                    'friends' => ['type' => 'integer', 'minimum' => 0],
                    'viewer' => ['oneOf' => [['$ref' => '#/components/schemas/Relation'], ['type' => 'null']], 'description' => 'How the acting profile relates to this one; null for guests and for one\'s own profile'],
                    'lists' => [
                        'type' => 'object',
                        'description' => 'Which lists the viewer may open (the others answer 403)',
                        'required' => ['followers', 'following', 'friends'],
                        'properties' => ['followers' => $aBool, 'following' => $aBool, 'friends' => $aBool],
                    ],
                ],
            ],
            'Relation' => [
                'type' => 'object',
                'required' => ['following', 'followed_by', 'friends', 'request_sent', 'request_received', 'blocking', 'muting', 'can_follow', 'can_befriend'],
                'properties' => [
                    'following' => $aBool,
                    'followed_by' => $aBool,
                    'friends' => $aBool,
                    'request_sent' => array_merge($aBool, ['description' => 'The viewer asked to be friends and waits']),
                    'request_received' => array_merge($aBool, ['description' => 'The profile asked to be friends; POST /profiles/{id}/friend accepts']),
                    'blocking' => array_merge($aBool, ['description' => 'Always false: UNA has no blocking of profiles']),
                    'muting' => array_merge($aBool, ['description' => 'Always false for now']),
                    'can_follow' => array_merge($aBool, ['description' => 'POST /profiles/{id}/follow would make a new follow']),
                    'can_befriend' => array_merge($aBool, ['description' => 'POST /profiles/{id}/friend would send a request or accept one']),
                ],
            ],
            'ProfileChanges' => [
                'type' => 'object',
                'description' => 'What to change in a profile; at least one field.',
                'additionalProperties' => false,
                'properties' => [
                    'display_name' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 255, 'description' => 'The name the profile goes by; the site\'s own checks of the name apply'],
                    'about' => ['type' => 'string', 'maxLength' => 10000, 'description' => 'Plain text that replaces the whole about; each line becomes a paragraph, an empty one clears it'],
                    'avatar_id' => ['type' => ['string', 'null'], 'pattern' => '^[1-9][0-9]*$', 'description' => 'An upload of purpose `profile` for the picture; null takes the picture off'],
                    'cover_id' => ['type' => ['string', 'null'], 'pattern' => '^[1-9][0-9]*$', 'description' => 'An upload of purpose `profile` for the cover; null takes the cover off'],
                ],
            ],
            'ProfileAction' => [
                'type' => 'object',
                'description' => 'An item of the More menu of a profile\'s or a context\'s page that the apps do themselves (GET /profiles/{id}/actions).',
                'required' => ['name', 'title', 'icon', 'action', 'done', 'choices'],
                'properties' => [
                    'name' => ['type' => 'string', 'description' => 'The site\'s name of the menu item', 'example' => 'report'],
                    'title' => ['type' => 'string', 'description' => 'What the site\'s item says', 'example' => 'Report'],
                    'icon' => ['type' => ['string', 'null'], 'description' => 'A Lucide icon name: Studio\'s icon of the item as the site\'s Lucide set draws it, else the action\'s own', 'example' => 'flag'],
                    'action' => ['type' => 'string', 'enum' => ['report', 'edit'], 'description' => '`report`: POST /profiles/{id}/report with one of `choices`; `edit`: the profile\'s editor (PATCH /profiles/{id})'],
                    'done' => ['type' => 'boolean', 'description' => '`report`: the viewer has reported it (a second report is 409); false otherwise'],
                    'choices' => [
                        'type' => ['array', 'null'],
                        'description' => '`report`: the site\'s reasons, in its order; null otherwise',
                        'items' => [
                            'type' => 'object',
                            'required' => ['name', 'title'],
                            'properties' => ['name' => ['type' => 'string', 'example' => 'spam'], 'title' => ['type' => 'string', 'example' => 'Spam']],
                        ],
                    ],
                ],
            ],
            'ProfileReport' => [
                'type' => 'object',
                'description' => 'A report of a profile or a context.',
                'required' => ['type'],
                'additionalProperties' => false,
                'properties' => [
                    'type' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 32, 'description' => 'One of the report item\'s `choices`', 'example' => 'spam'],
                    'text' => ['type' => 'string', 'maxLength' => 1000, 'description' => 'A note for the moderators, plain text'],
                ],
            ],
            'FriendStatus' => ['type' => 'string', 'enum' => ['requested', 'friends']],
            'FriendResult' => [
                'type' => 'object',
                'required' => ['status'],
                'properties' => ['status' => ['$ref' => '#/components/schemas/FriendStatus']],
            ],
            'Connected' => [
                'type' => 'object',
                'description' => 'A connected profile and when the connection was made.',
                'required' => ['profile', 'since'],
                'properties' => [
                    'profile' => ['$ref' => '#/components/schemas/Profile'],
                    'since' => ['type' => 'string', 'format' => 'date-time'],
                ],
            ],
            'Page_Connected' => BxDolApiV2Map::pageSchema('Connected'),
            'Suggestion' => [
                'type' => 'object',
                'description' => 'A profile the site suggests to the acting profile (v2 only), with the site\'s points for the match.',
                'required' => ['profile', 'score'],
                'properties' => [
                    'profile' => ['$ref' => '#/components/schemas/Profile'],
                    'score' => ['type' => 'integer', 'minimum' => 0],
                ],
            ],
            'Page_Suggestion' => BxDolApiV2Map::pageSchema('Suggestion'),
            'InfoField' => [
                'type' => 'object',
                'description' => 'A field of a profile\'s Info block (v2 only): its label and the text the site shows',
                'additionalProperties' => false,
                'required' => ['name', 'label', 'value', 'datetime'],
                'properties' => [
                    'name' => ['type' => 'string', 'description' => 'The form field\'s name', 'example' => 'birthday'],
                    'label' => ['type' => 'string', 'example' => 'Birthday'],
                    'value' => ['type' => 'string', 'description' => 'As the site shows it, plain text'],
                    'datetime' => ['type' => ['string', 'null'], 'description' => 'For a date field, its moment (ISO 8601); null for others'],
                ],
            ],
            'ProfileInfo' => [
                'type' => 'object',
                'required' => ['fields'],
                'properties' => [
                    'fields' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/InfoField']],
                ],
            ],
        ];
    }
}

/** @} */
