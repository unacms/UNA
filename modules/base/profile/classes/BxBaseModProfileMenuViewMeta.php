<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    BaseProfile Base classes for profile modules
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * View entry meta menu
 */
class BxBaseModProfileMenuViewMeta extends BxTemplMenuUnitMeta
{
    protected $_sModule;
    protected $_oModule;

    protected $_bShowZeros;

    protected $_iContentId;
    protected $_aContentInfo;
    protected $_bContentPublic;
    protected $_oContentProfile;
    protected $_aContentProfileInfo;

    /**
     * The friends' and followers' counts share one group of avatars, drawn before the first of them
     * (BxBaseModProfileTemplate::getConnectionsPreview); whether it is drawn already.
     */
    protected $_bConnectionsPreview;

    public function __construct($aObject, $oTemplate = false)
    {
        $this->_oModule = BxDolModule::getInstance($this->_sModule);

        parent::__construct($aObject, $oTemplate);

        $this->_bShowZeros = false;

        $this->_iContentId = 0;
        $this->_aContentInfo = [];
        $this->_bContentPublic = false;
        $this->_oContentProfile = null;
        $this->_aContentProfileInfo = [];
        $this->_bConnectionsPreview = false;
    }

    public function setContentId($iContentId)
    {
        $this->_iContentId = $iContentId;
        $this->_bConnectionsPreview = false;
        $this->_aContentInfo = $this->_oModule->_oDb->getContentInfoById($this->_iContentId);
        if(empty($this->_aContentInfo) || !is_array($this->_aContentInfo))
            return;

        $this->_oContentProfile = BxDolProfile::getInstanceByContentAndType($this->_iContentId, $this->_sModule);
        if(!$this->_oContentProfile) 
            return;

        $this->_aContentProfileInfo = $this->_oContentProfile->getInfo();     

        $this->addMarkers($this->_aContentProfileInfo);
        $this->addMarkers(array(
            'profile_id' => $this->_oContentProfile->id()
        ));
    }

    public function setContentPublic($bContentPublic)
    {
        $this->_bContentPublic = $bContentPublic;
    }

    public function getCode()
    {
        if(empty($this->_iContentId))
            $this->_retrieveContentId();

        return parent::getCode();
    }

    /**
     * A count of the profile's friends or followers on the site: its text, after the one group of avatars the two
     * counts share where it is the first of them drawn.
     */
    protected function _getConnectionCounter($oConnection, $bIsMutual, $aItem)
    {
        $iContentProfileId = $this->_oContentProfile->id();

        $sCounter = $oConnection->getCounter($iContentProfileId, $bIsMutual, [
            'content_type' => BX_CONNECTIONS_CONTENT_TYPE_INITIATORS, 
            'caption' => $aItem['title'], 
            'show_counter_label_with_profiles' => false,
            'show_counter_label_icon' => false
        ]);
        if(empty($sCounter) || $this->_bConnectionsPreview) {
            return $sCounter;
        }

        $this->_bConnectionsPreview = true;

        return $this->_oModule->_oTemplate->getConnectionsPreview($iContentProfileId, $this->_isCountShown('friends'), $this->_isCountShown('subscribers')) . $sCounter;
    }

    protected function _isCountShown($sName)
    {
        if(!isset($this->_aObject['menu_items'][$sName])) {
            return false;
        }

        $aItem = $this->_aObject['menu_items'][$sName];
        return $this->_isActive($aItem) && $this->_isVisible($aItem);
    }

    protected function _getMenuItemMembership($aItem)
    {
        if(!$this->_bContentPublic || !$this->_oContentProfile)
            return false;

        $oTemplate = BxDolTemplate::getInstance();

        $iProfileId = $this->_oContentProfile->id();

        $oAcl = BxDolAcl::getInstance();
        $aMembership =  $oAcl->getMemberMembershipInfo($iProfileId);
        $aLevelInfo =  $oAcl->getMembershipInfo($aMembership['id']);

        if($this->_bIsApi) {
            $sIconS = $aLevelInfo['icon'];
            $sIconD = $oTemplate->getImage($sIconS, ['wrap_in_tag' => false]);

            return $this->_getMenuItemAPI($aItem, ['display' => 'button'], [
                'title' => _t($aMembership['name']),
                'icon' => strcmp($sIconS, $sIconD) != 0 ? $sIconD : BxDolIconset::getObjectInstance()->getIcon($sIconD)
            ]);
        }

        $sMembership = '';
        if($aMembership)
            $sMembership = $oTemplate->parseHtmlByName('menu_meta_item.html', [
                'icon' => $oTemplate->getImage($aLevelInfo['icon'], ['class' => 'bx-acl-m-thumbnail']), 
                'caption' => _t($aMembership['name'])
            ]);

        return $aMembership ? $this->getUnitMetaItemText($sMembership, ['id' => 'sys-mi-acl-' . $iProfileId]) : false;
    }
    
    protected function _getMenuItemBadges($aItem)
    {
        if($this->_bIsApi) 
            return false;

        $sResult = $this->_oModule->serviceGetBadges($this->_iContentId);
        if(!empty($sResult))
            $sResult = $this->getUnitMetaItemText($sResult, ['class' => 'bx-base-bages-container']);

        return $sResult;
    }

    protected function _getMenuItemFriends($aItem)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(!$this->_oModule->_oConfig->isFriends() || !$this->_bContentPublic || !$this->_oContentProfile)
            return false;

        $oConnection = BxDolConnection::getObjectInstance('sys_profiles_friends');
        if(!$oConnection)
            return false;

        $iContentProfileId = $this->_oContentProfile->id();

        if($this->_bIsApi) {
            $aCounter = $oConnection->getCounterAPI($iContentProfileId, true, [
                'content_type' => BX_CONNECTIONS_CONTENT_TYPE_INITIATORS, 
                'caption' => $aItem['title']
            ]);

            $sUrl = $this->_oContentProfile->getUrl();
            if(!empty($CNF['URI_VIEW_FRIENDS']))
                $sUrl = bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $CNF['URI_VIEW_FRIENDS'] . '&profile_id=' . $iContentProfileId));

            return $this->_getMenuItemAPI($aItem, ['display' => 'button'], [
                'title' => $aCounter['countf'],
                'link' => bx_api_get_relative_url($sUrl),
                'list' => $oConnection->getConnectedListAPI($iContentProfileId, true, BX_CONNECTIONS_CONTENT_TYPE_CONTENT)
            ]);
        }

        return $this->_getConnectionCounter($oConnection, true, $aItem);
    }

    protected function _getMenuItemSubscribers($aItem)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(!$this->_bContentPublic || !$this->_oContentProfile)
            return false;

        $oConnection = BxDolConnection::getObjectInstance('sys_profiles_subscriptions');
        if(!$oConnection)
            return false;

        $iContentProfileId = $this->_oContentProfile->id();

        if($this->_bIsApi) {
            $aCounter = $oConnection->getCounterAPI($iContentProfileId, false, [
                'content_type' => BX_CONNECTIONS_CONTENT_TYPE_INITIATORS, 
                'caption' => $aItem['title']
            ]);

            $sUrl = $this->_oContentProfile->getUrl();
            if(!empty($CNF['URI_VIEW_SUBSCRIPTIONS']))
                $sUrl = bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $CNF['URI_VIEW_SUBSCRIPTIONS'] . '&profile_id=' . $iContentProfileId));

            return $this->_getMenuItemAPI($aItem, ['display' => 'button'], [
                'title' => $aCounter['countf'],
                'link' => bx_api_get_relative_url($sUrl),
                'list' => $oConnection->getConnectedListAPI($iContentProfileId, false, BX_CONNECTIONS_CONTENT_TYPE_INITIATORS)
            ]);
        }

        return $this->_getConnectionCounter($oConnection, false, $aItem);
    }

    protected function _getMenuItemRelations($aItem)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(!$this->_bContentPublic || !$this->_oContentProfile)
            return false;

        $oConnection = BxDolConnection::getObjectInstance('sys_profiles_relations');
        if(!$oConnection)
            return false;

        $iContentProfileId = $this->_oContentProfile->id();

        if($this->_bIsApi) {
            $aCounter = $oConnection->getCounterAPI($iContentProfileId, false, [
                'content_type' => BX_CONNECTIONS_CONTENT_TYPE_INITIATORS, 
                'caption' => $aItem['title']
            ]);

            $sUrl = $this->_oContentProfile->getUrl();
            if(!empty($CNF['URI_VIEW_RELATIONS']))
                $sUrl = bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $CNF['URI_VIEW_RELATIONS'] . '&profile_id=' . $iContentProfileId));

            return $this->_getMenuItemAPI($aItem, ['display' => 'button'], [
                'title' => $aCounter['countf'],
                'link' => bx_api_get_relative_url($sUrl),
                'list' => $oConnection->getConnectedListAPI($iContentProfileId, false, BX_CONNECTIONS_CONTENT_TYPE_INITIATORS)
            ]);
        }

        return $oConnection->getCounter($iContentProfileId, true, [
            'content_type' => BX_CONNECTIONS_CONTENT_TYPE_INITIATORS, 
            'caption' => $aItem['title'], 
            'custom_icon' => BxTemplFunctions::getInstanceWithTemplate($this->_oTemplate)->getIconAsHtml(!empty($aItem['icon']) ? $aItem['icon'] : '')
        ]);
    }

    protected function _getMenuItemViews($aItem)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if($this->_bIsApi)
            return false;

        if(empty($CNF['OBJECT_VIEWS']) || empty($CNF['FIELD_VIEWS']) || (empty($this->_aContentInfo[$CNF['FIELD_VIEWS']]) && !$this->_bShowZeros))
            return false;

        $oObject = isset($CNF['OBJECT_VIEWS']) ? BxDolView::getObjectInstance($CNF['OBJECT_VIEWS'], $this->_aContentInfo[$CNF['FIELD_ID']]) : null;
        
        $sIcon = BxTemplFunctions::getInstanceWithTemplate($this->_oTemplate)->getIconAsHtml(!empty($aItem['icon']) ? $aItem['icon'] : '');
        
        return $oObject ? $oObject->getCounter(['show_counter_empty' => false, 'show_counter_in_brackets' => false, 'dynamic_mode' => true, 'caption' => '_view_n_views', 'custom_icon' => $sIcon]) : '';
    }

    protected function _getMenuItemVotes($aItem)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if($this->_bIsApi)
            return false;

        if(empty($CNF['OBJECT_VOTES']) || empty($CNF['FIELD_VOTES']) || (empty($this->_aContentInfo[$CNF['FIELD_VOTES']]) && !$this->_bShowZeros))
            return false;
        
        $sIcon = BxTemplFunctions::getInstanceWithTemplate($this->_oTemplate)->getIconAsHtml(!empty($aItem['icon']) ? $aItem['icon'] : '');
        
        $oObject = BxDolVote::getObjectInstance($CNF['OBJECT_VOTES'], $this->_aContentInfo[$CNF['FIELD_ID']]);
        if(!$oObject || !$oObject->isEnabled())
            return '';

        return $oObject->getCounter([
            'show_counter_label_icon' => true, 
            'show_counter_empty' => false, 
            'dynamic_mode' => true, 
            'caption' => '_vote_n_votes', 
            'custom_icon' => $sIcon
        ]);
    }

    protected function _getMenuItemReactions($aItem)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if($this->_bIsApi)
            return false;

        $sKo = 'OBJECT_REACTIONS';
        if(($sKf = 'FIELD_REACTIONS') && (empty($CNF[$sKo]) || empty($CNF[$sKf]) || (empty($this->_aContentInfo[$CNF[$sKf]]) && !$this->_bShowZeros)))
            return false;

        $oObject = BxDolVote::getObjectInstance($CNF[$sKo], $this->_aContentInfo[$CNF['FIELD_ID']]);
        if(!$oObject || !$oObject->isEnabled())
            return false;

        return $oObject->getCounter([
            'show_counter_style' => 'compound',
            'show_counter_empty' => false, 
            'dynamic_mode' => true
        ]);
    }

    protected function _getMenuItemScores($aItem)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if($this->_bIsApi)
            return false;

        $sKo = 'OBJECT_SCORES';
        if(($sKfu = 'FIELD_SCORE_UP') && ($sKfd = 'FIELD_SCORE_DOWN') && (empty($CNF[$sKo]) || empty($CNF[$sKfu]) || empty($CNF[$sKfd]) || (empty($this->_aContentInfo[$CNF[$sKfu]]) && empty($this->_aContentInfo[$CNF[$sKfd]]) && !$this->_bShowZeros)))
            return false;

        $oObject = BxDolScore::getObjectInstance($CNF[$sKo], $this->_aContentInfo[$CNF['FIELD_ID']]);
        if(!$oObject || !$oObject->isEnabled())
            return false;

        return $oObject->getCounter([
            'show_counter_label_icon' => true,
            'show_counter_empty' => false,
            'dynamic_mode' => true,
        ]);
    }

    protected function _getMenuItemComments($aItem)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if($this->_bIsApi)
            return false;

        if(empty($CNF['OBJECT_COMMENTS']) || empty($CNF['FIELD_COMMENTS']) || (empty($this->_aContentInfo[$CNF['FIELD_COMMENTS']]) && !$this->_bShowZeros))
            return false;

        $oComments = BxDolCmts::getObjectInstance($CNF['OBJECT_COMMENTS'], $this->_aContentInfo[$CNF['FIELD_ID']]);
        if(!$oComments || !$oComments->isEnabled())
            return false;

        $oObject = isset($CNF['OBJECT_COMMENTS']) ? BxDolCmts::getObjectInstance($CNF['OBJECT_COMMENTS'], $this->_aContentInfo[$CNF['FIELD_ID']]) : null;

        return $oObject ? $oObject->getCounter([
            'overwrite_counter_link_onclick' => 'javascript:void(0)', 
            'show_counter_empty' => false, 
            'recalculate_counter' => true,
            'dynamic_mode' => true, 
            'caption' => '_cmt_txt_n_comments', 
            'custom_icon' => BxTemplFunctions::getInstanceWithTemplate($this->_oTemplate)->getIconAsHtml(!empty($aItem['icon']) ? $aItem['icon'] : '')
        ]) : '';
    }

    protected function _retrieveContentId()
    {
        if(bx_get('id') !== false)
            $this->setContentId(bx_process_input(bx_get('id'), BX_DATA_INT));

        if(empty($this->_iContentId) && bx_get('profile_id') !== false)
            $this->setContentId(BxDolProfile::getInstance(bx_process_input(bx_get('profile_id'), BX_DATA_INT))->getContentId());
    }
}

/** @} */
