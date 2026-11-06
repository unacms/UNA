<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Timeline Timeline
 * @ingroup     UnaModules
 *
 * @{
 */

require_once('BxTimelineMenuItemActions.php');

/**
 * 'Item' menu.
 */
class BxTimelineMenuItemCounters extends BxTimelineMenuItemActions
{
    public function __construct($aObject, $oTemplate = false)
    {
        parent::__construct($aObject, $oTemplate);

        $this->_sMode = self::$_sModeCounters;
        $this->_bShowCounters = true;

        $this->_aItem2CheckFunc = array_merge($this->_aItem2CheckFunc, array(
            'item-vote' => 'isAllowedVoteView',
            'item-reaction' => 'isAllowedReactionView',
        ));
    }

    protected function _getMenuItemItemComment($aItem)
    {
        if(!isset($this->_aEvent['comments']) || !is_array($this->_aEvent['comments']) || !isset($this->_aEvent['comments']['system'])) 
            return false;

        $sCommentsSystem = $this->_aEvent['comments']['system'];
        $iCommentsObject = $this->_aEvent['comments']['object_id'];

        if(($aElement = $this->_getElementApiFromActions($aItem['name'], $sCommentsSystem, $iCommentsObject)) !== false)
            return $this->_getMenuItemElementApi($aItem, $aElement);

        $aCommentsParams = array(
            'overwrite_counter_link_href' => 'javascript:void(0)',
            'overwrite_counter_link_onclick' => bx_replace_markers('{comment_onclick}', $this->_aMarkers),
            'show_do_comment_label' => $this->_bShowTitles,
            'show_counter' => $this->_bShowCounters,
            'show_counter_empty' => $this->_bShowCountersEmpty,
            'show_counter_label_icon' => true,
            'dynamic_mode' => $this->_bDynamicMode,
        );

        switch($this->_sMode) {
            case self::$_sModeActions:
                $sCommentsMethod = 'getElementInline';
                break;

            case self::$_sModeCounters:
                $sCommentsMethod = 'getCounter';
                break;
        }

        $oObject = $this->_oModule->getCmtsObject($sCommentsSystem, $iCommentsObject);
        if($this->_bIsApi)
            return $this->_getMenuItemElementApi($aItem, $oObject->getElementApi(array_merge($aCommentsParams, [
                'show_counter' => true,
            ])));

        return $oObject->$sCommentsMethod($aCommentsParams);
    }

    protected function _getMenuItemItemReaction($aItem)
    {
        if(isset($this->_aEvent['reactions']['system'], $this->_aEvent['reactions']['object_id'])) {
            $aElement = $this->_getElementApiFromActions($aItem['name'], $this->_aEvent['reactions']['system'], $this->_aEvent['reactions']['object_id']);
            if($aElement !== false)
                return $this->_getMenuItemElementApi($aItem, $aElement);
        }

        return parent::_getMenuItemItemReaction($aItem);
    }

    /**
     * API: the element the actions menu of the same event built for this object.
     * BxTimelineTemplate::_getPostApi puts the actions menu into the event before it builds this one,
     * and in API mode both menus get the element from getElementApi with the same visible parameters,
     * so it's taken from there instead of counting and checking everything again.
     * Override it to return false if a custom actions menu builds these elements differently.
     * @param $sName menu item name, the same in both menus
     * @param $sSystem comments or votes system
     * @param $iObjectId object id
     * @return array, or false when the actions menu has no such element (web mode, hidden for the viewer, other callers)
     */
    protected function _getElementApiFromActions($sName, $sSystem, $iObjectId)
    {
        if(!$this->_bIsApi)
            return false;

        $aActions = $this->_aEvent['menu_actions'] ?? null;
        if(!is_array($aActions) || empty($aActions['items']) || !is_array($aActions['items']))
            return false;

        foreach($aActions['items'] as $aActionsItem) {
            if(!is_array($aActionsItem) || ($aActionsItem['name'] ?? '') !== $sName || ($aActionsItem['display_type'] ?? '') !== 'element')
                continue;

            $aElement = $aActionsItem['data'] ?? null;
            if(is_array($aElement) && isset($aElement['system'], $aElement['object_id']) && $aElement['system'] === $sSystem && (int)$aElement['object_id'] === (int)$iObjectId)
                return $aElement;
        }

        return false;
    }
}

/** @} */
