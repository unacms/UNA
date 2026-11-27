<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defdroup    Channels Channels
 * @indroup     UnaModules
 *
 * @{
 */

/*
 * Channels module representation.
 */
class BxCnlTemplate extends BxBaseModGroupsTemplate
{
    function __construct(&$oConfig, &$oDb)
    {
        $this->MODULE = 'bx_channels';
        parent::__construct($oConfig, $oDb);

        // the gallery card (unit.html here) is the apps' card (unit_card.html), as groups' is
        $this->_bUnitCard = true;
        $this->_aUnitCardTemplates = ['unit.html', 'unit_with_cover.html'];
        $this->_sUnitCardViewIcon = 'arrow-circle-right';
    }

    public function entryBreadcrumb($aContentInfo, $aTmplVarsItems = array())
    {
    	$CNF = &$this->_oConfig->CNF;

        $oLabel = BxDolLabel::getInstance();
        $oPermalink = BxDolPermalinks::getInstance();

        $aLabel = $oLabel->getLabels(array('type' => 'value', 'value' => $aContentInfo[$CNF['FIELD_NAME']]));
        if(empty($aLabel) || !is_array($aLabel))
            return '';

        $aTmplVarsItems = array();
        $this->_entryBreadcrumb($aLabel['id'], $oLabel, $oPermalink, $aTmplVarsItems);
        $aTmplVarsItems = array_reverse($aTmplVarsItems);

    	return parent::entryBreadcrumb($aContentInfo, $aTmplVarsItems);
    }

    public function entryParent($aContentInfo)
    {
        $CNF = &$this->_oConfig->CNF;
        $oLabel = BxDolLabel::getInstance();

        $aLabel = $oLabel->getLabels(array('type' => 'value', 'value' => $aContentInfo[$CNF['FIELD_NAME']]));
        if(empty($aLabel) || !is_array($aLabel) || (int)$aLabel['parent'] == 0)
            return false;

        $aLabelParent = $oLabel->getLabels(array('type' => 'id', 'id' => $aLabel['parent']));
        $aContentInfoParent = $this->_oDb->getChannelInfoByName($aLabelParent['value']);
        if(empty($aContentInfoParent) || !is_array($aContentInfoParent))
            return false;

        return $this->parseHtmlByName('entry-parent.html', array('content' => $this->_entryRelatives(array($aContentInfoParent['profile_id']))));
    }

    public function entryChilds($aContentInfo)
    {
        $CNF = &$this->_oConfig->CNF;
        $oLabel = BxDolLabel::getInstance();

        $aLabel = $oLabel->getLabels(array('type' => 'value', 'value' => $aContentInfo[$CNF['FIELD_NAME']]));
        if(empty($aLabel) || !is_array($aLabel))
            return false;

        $aLabelChildren = $oLabel->getLabels(array('type' => 'parent', 'parent' => $aLabel['id']));
        if(empty($aLabelChildren) || !is_array($aLabelChildren))
            return false;

        $aIds = array();
        foreach($aLabelChildren as $aLabelChild) {
            $aContentInfoChild = $this->_oDb->getChannelInfoByName($aLabelChild['value']);
            if(empty($aContentInfoChild) || !is_array($aContentInfoChild))
                continue;
            
            $aIds[] = $aContentInfoChild['profile_id'];
        }

        if(empty($aIds))
            return false;

        return $this->parseHtmlByName('entry-childs.html', array('content' => $this->_entryRelatives($aIds)));
    }

    protected function _entryBreadcrumb($iLabel, &$oLabel, &$oPermalink, &$aTmplVarsItems)
    {
        $CNF = &$this->_oConfig->CNF;

        $aLabel = $oLabel->getLabels(array('type' => 'id', 'id' => $iLabel));
        if(empty($aLabel) || !is_array($aLabel))
            return;

        $iChannel = (int)$this->_oDb->getChannelIdByName($aLabel['value']);
        $aTmplVarsItems[] = array(
            'url' => $iChannel != 0 ? $oPermalink->permalink('page.php?i=' . $CNF['URI_VIEW_ENTRY'] . '&id=' . $iChannel) : 'javascript:void(0)',
            'title' => bx_process_output($aLabel['value'])
        );

        if(empty($aLabel['parent']))
            return;

        $this->_entryBreadcrumb((int)$aLabel['parent'], $oLabel, $oPermalink, $aTmplVarsItems);
    }
    
    protected function _entryRelatives($aProfiles)
    {
        $sResult = '';

        foreach($aProfiles as $iProfile) {
            $oProfile = BxDolProfile::getInstance($iProfile);
            if(!$oProfile)
                continue;

            $sResult .= $oProfile->getUnit(false, array('template' => 'unit_wo_cover'));
        }

        return $sResult;
    }
}

/** @} */
