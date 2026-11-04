<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * Acl representation.
 * @see BxDolAcl
 */
class BxBaseAcl extends BxDolAcl
{
    public function __construct ()
    {
        parent::__construct ();
    }

    public function getProfileMembership ($iProfileId)
    {
        $aLevel = $this->getMemberMembershipInfo($iProfileId, 0, true);
        if(empty($aLevel) || !is_array($aLevel))
            return $this->_bIsApi ? [] : '';

        $oTemplate = BxDolTemplate::getInstance();

        $aLevelInfo = $this->getMembershipInfo($aLevel['id']);

        $bOwner = $bCanView = false;
        if(($iLoggedPid = bx_get_logged_profile_id()) && ($oLogged = BxDolProfile::getInstance($iLoggedPid)) !== false) {
            $bOwner = BxDolProfile::getInstance($iProfileId)->getAccountId() == $oLogged->getAccountId();

            $aCheck = checkActionModule($iLoggedPid, 'show membership private info', 'system', false);
            $bCanView = $aCheck[CHECK_ACTION_RESULT] === CHECK_ACTION_RESULT_ALLOWED;
        }

        if($this->_bIsApi) {
            $sIconS = $aLevelInfo['icon'];
            $sIconD = $oTemplate->getImage($sIconS, ['wrap_in_tag' => false]);

            $aLevelApi = [
                'id' => $aLevel['id'],
                'name' => !empty($aLevelInfo['name']) ? _t($aLevelInfo['name']) : '',
                'description' => !empty($aLevelInfo['description']) ? _t($aLevelInfo['description']) : '',
                'icon' => strcmp($sIconS, $sIconD) != 0 ? $sIconD : BxDolIconset::getObjectInstance()->getIcon($sIconD),
            ];
            if ($bOwner || $bCanView) {
                $aLevelApi['date_starts'] = (int)$aLevel['date_starts'];
                $aLevelApi['date_expires'] = (int)$aLevel['date_expires'];
            }

            return [
                'profile' => BxDolProfile::getData($iProfileId),
                'level' => $aLevelApi,
            ];
        }

        $aTmplVarsPrivateInfo = [];
        $bTmplVarsPrivateInfo = (($bOwner || $bCanView) && !empty($aLevel['date_starts']));
        if($bTmplVarsPrivateInfo)
            $aTmplVarsPrivateInfo = array(
                'date_start' => bx_time_js($aLevel['date_starts']),
                'date_expire' => (int)$aLevel['date_expires'] > 0 ? bx_time_js($aLevel['date_expires']) : _t('_sys_acl_expire_never'),
                'bx_if:show_state' => array(
                    'condition' => !empty($aLevel['state']),
                    'content' => array(
                        'state' => _t('_sys_acl_state_' . $aLevel['state'])
                    )
                )
            );        

        $aTmplVarsActions = [];
        if($bOwner) {
            $aDowngradable = $this->getMemberships(false, true, true, true);
            unset($aDowngradable[MEMBERSHIP_ID_STANDARD]);

            if(in_array($aLevel['id'], array_keys($aDowngradable)))
                $aTmplVarsActions[] = [
                    'href' => 'javascript:void(0)',
                    'bx_if:show_onclick' => [
                        'condition' => true,
                        'content' => [
                            'onclick' => 'javascript:bx_reset_acl_level(' . $iProfileId . ', this)'
                        ]
                    ],
                    'content' => _t('_sys_acl_downgrade')
                ];
        }

        $sTmplName = 'acl_membership.html';
        $aTmplVars = [
            'html_id' => 'sys-acl-profile-' . $iProfileId,
            'level' => _t($aLevel['name']),
            'thumbnail' => $oTemplate->getImage($aLevelInfo['icon'], ['class' => 'bx-acl-m-thumbnail']),
            'bx_if:show_private_info' => [
                'condition' => $bTmplVarsPrivateInfo,
                'content' => $aTmplVarsPrivateInfo
            ],
            'bx_if:show_actions' => [
                'condition' => !empty($aTmplVarsActions),
                'content' => [
                    'bx_repeat:actions' => $aTmplVarsActions
                ]
            ]
        ];

        $sContent = $oTemplate->parseHtmlByName($sTmplName, $aTmplVars);

        /**
         * @hooks
         * @hookdef hook-system-page_output_block_acl_level 'system', 'page_output_block_acl_level' - hook to override profile membership page block
         * - $unit_name - equals `system`
         * - $action - equals `page_output_block_acl_level`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `block_owner` - [int] profile id to show membership level for
         *      - `block_code` - [string] by ref, block code, can be overridden in hook processing
         * @hook @ref hook-system-page_output_block_acl_level
         */
        bx_alert('system', 'page_output_block_acl_level', 0, false, [
            'block_owner' => $iProfileId,
            'block_tmpl_name' => $sTmplName,
            'block_tmpl_vars' => $aTmplVars,
            'block_code' => &$sContent,
            'block_code_ref' => &$sContent,
        ]);

        $oTemplate->addCss(['acl.css']);
        return $sContent;
    }

    /**
     * Print code for membership status
     * $iProfileId - ID of profile
     * $offer_upgrade - will this code be printed at [c]ontrol [p]anel
     */
    function GetMembershipStatus($iProfileId, $bOfferUpgrade = true)
    {
        $aMembershipInfo = $this->getMemberMembershipInfo($iProfileId);

        $sViewMembershipActions = "<br />(<a onclick=\"javascript:window.open('explanation.php?explain=membership&amp;type=".$aMembershipInfo['ID']."', '', 'width=660, height=500, menubar=no, status=no, resizable=no, scrollbars=yes, toolbar=no, location=no');\" href=\"javascript:void(0);\">"._t("_VIEW_MEMBERSHIP_ACTIONS")."</a>)<br />";

        // Show colored membership name
        $ret = '';
        if ( $aMembershipInfo['ID'] == MEMBERSHIP_ID_STANDARD || $aMembershipInfo['ID'] == MEMBERSHIP_ID_AUTHENTICATED) {
            $ret .= _t( "_MEMBERSHIP_STANDARD" ). $sViewMembershipActions;
            if ( $bOfferUpgrade )
                $ret .= " ". _t( "_MEMBERSHIP_UPGRADE_FROM_STANDARD" );
        } else {
            $ret .= "<font color=\"red\">{$aMembershipInfo['Name']}</font>$sViewMembershipActions";

            $days_left = (int)( ($aMembershipInfo['DateExpires'] - time()) / (24 * 3600) );

            if(!is_null($aMembershipInfo['DateExpires'])) {
                $ret .= ( $days_left > 0 ) ? _t( "_MEMBERSHIP_EXPIRES_IN_DAYS", $days_left ) : _t( "_MEMBERSHIP_EXPIRES_TODAY", date( "H:i", $aMembershipInfo['DateExpires'] ), date( "H:i" ) );
            } else {
                $ret.= _t("_MEMBERSHIP_EXPIRES_NEVER");
            }
        }
        return $ret;
    }
}
/** @} */
