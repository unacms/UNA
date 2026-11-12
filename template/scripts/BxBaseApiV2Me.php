<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * API v2: the signed-in account, its profiles and the profile it acts as.
 */
class BxBaseApiV2Me
{
    #[BxDolApiV2Operation(
        method: 'GET', path: '/me', id: 'getMe', tag: 'me', auth: 'required',
        summary: 'The signed-in account, its profiles and the active one',
        responses: [200 => 'Me'],
    )]
    public function getMe(BxDolApiV2Request $oReq)
    {
        $iProfileId = $oReq->requireViewer();
        $oAccount = BxDolProfile::getInstance($iProfileId)->getAccountObject();
        $aAccount = $oAccount->getInfo();

        $aProfiles = [];
        BxDolApiV2Map::primeBadges(array_column($oAccount->getProfiles(), 'id'));
        foreach ($oAccount->getProfiles() as $aProfile)
            if (($a = BxDolApiV2Map::profile($aProfile['id'])) !== null)
                $aProfiles[] = $a;

        $aRoles = [];
        if (isAdmin($oAccount->id()))
            $aRoles[] = 'admin';
        $aRoles[] = 'member';

        return [
            'account' => [
                'id' => BxDolApiV2Map::id($oAccount->id()),
                'email' => (string)$aAccount['email'],
                'email_verified' => (bool)$oAccount->isConfirmedEmail(),
                'locale' => BxDolLanguages::getInstance()->getCurrentLanguage(),
            ],
            'active_profile_id' => BxDolApiV2Map::id($iProfileId),
            'profiles' => $aProfiles,
            'roles' => $aRoles,
        ];
    }

    #[BxDolApiV2Operation(
        method: 'PUT', path: '/me/active-profile', id: 'setActiveProfile', tag: 'me', auth: 'required',
        summary: 'Act as another profile of this account',
        description: 'The same switch as on the site: it changes the account\'s current profile, for this token and the site session alike. Answers 204 with no body: GET /me then has the new `active_profile_id`. 403 for a profile of another account.',
        body: 'ActiveProfileRequest',
        responses: [204 => null, 403 => null, 404 => null],
    )]
    public function setActiveProfile(BxDolApiV2Request $oReq)
    {
        $iViewerId = $oReq->requireViewer();
        $iProfileId = (int)$oReq->body()['profile_id'];

        if (!($oProfile = BxDolProfile::getInstance($iProfileId)))
            throw BxDolApiV2Problem::notFound('The profile');

        // only profiles of this account: the site lets admins switch to anyone's profile, but a
        // token stays with its own account (BxDolApiV2Auth), so such a switch would not hold
        $oViewerAccount = BxDolProfile::getInstance($iViewerId)->getAccountObject();
        if (!$oViewerAccount || (int)$oProfile->getAccountId() !== (int)$oViewerAccount->id() || !in_array($iProfileId, array_map('intval', $oViewerAccount->getProfilesIds()), true))
            throw BxDolApiV2Problem::forbidden('Only profiles of the signed-in account can be made active');

        // PUT is idempotent: the profile already active stays so (the site's switch refuses it)
        if ($iProfileId !== (int)$iViewerId) {
            $mResult = BxDolService::call('system', 'switch_profile', [$iProfileId], 'TemplServiceAccount');
            if ($mResult !== true && !is_array($mResult))
                throw BxDolApiV2Problem::forbidden(is_string($mResult) ? strip_tags($mResult) : '');
        }

        $oReq->auth()->setProfile($oProfile);
        return BxDolApiV2Response::noContent();
    }

    public static function schemas()
    {
        return [
            'Account' => [
                'type' => 'object',
                'required' => ['id', 'email', 'email_verified', 'locale'],
                'properties' => [
                    'id' => ['$ref' => '#/components/schemas/Id'],
                    'email' => ['type' => 'string', 'format' => 'email'],
                    'email_verified' => ['type' => 'boolean'],
                    'locale' => ['type' => 'string', 'example' => 'en'],
                ],
            ],
            'Me' => [
                'type' => 'object',
                'required' => ['account', 'active_profile_id', 'profiles', 'roles'],
                'properties' => [
                    'account' => ['$ref' => '#/components/schemas/Account'],
                    'active_profile_id' => ['$ref' => '#/components/schemas/Id'],
                    'profiles' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/Profile']],
                    'roles' => ['type' => 'array', 'items' => ['type' => 'string', 'enum' => ['admin', 'member']]],
                ],
            ],
            'ActiveProfileRequest' => [
                'type' => 'object',
                'additionalProperties' => false,
                'required' => ['profile_id'],
                'properties' => [
                    'profile_id' => ['$ref' => '#/components/schemas/Id'],
                ],
            ],
        ];
    }
}

/** @} */
