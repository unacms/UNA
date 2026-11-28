<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defdroup    Spaces Spaces
 * @indroup     UnaModules
 *
 * @{
 */

/*
 * Spaces module representation.
 */
class BxSpacesTemplate extends BxBaseModGroupsTemplate
{
    function __construct(&$oConfig, &$oDb)
    {
        $this->MODULE = 'bx_spaces';
        parent::__construct($oConfig, $oDb);

        // the gallery card (unit.html here) is the apps' card (unit_card.html), as people's and organizations' is
        $this->_bUnitCard = true;
        $this->_aUnitCardTemplates = ['unit.html', 'unit_with_cover.html'];
        $this->_sUnitCardViewIcon = 'arrow-circle-right';
    }
    
    public function entryChilds($aData, $aParams = [])
    {
        $aChild = $this->_oModule->_oDb->getChildEntriesIdByProfileId($aData['profile_id']);
        if(count($aChild) == 0)
            return false;

        if(!isset($aParams['template']))
            $aParams['template'] = 'unit_wo_cover';

        return $this->parseHtmlByName('entry-childs.html', [
            'content' => $this->getBrowseQuick($aChild, $aParams['template'])
        ]);
    }

    public function entryParent($aData, $aParams = [])
    {
        $CNF = $this->_oConfig->CNF;

        $iParentPid = (int)$aData[$CNF['FIELD_PARENT']];
        if($iParentPid == 0)
            return false;
        
        $aParent = $this->_oDb->getContentInfoByProfileId($iParentPid);
        if(empty($aParent) || !is_array($aParent) || $aParent[$CNF['FIELD_STATUS']] != 'active' || $aParent[$CNF['FIELD_STATUS_ADMIN']] != 'active')
            return false;

        if(!isset($aParams['template']))
            $aParams['template'] = 'unit_wo_cover';
        return $this->parseHtmlByName('entry-parent.html', [
            'content' => $this->getBrowseQuick([$aData[$CNF['FIELD_PARENT']]], $aParams['template'])
        ]);
    }

    public function entryRating($aData)
    {
        $CNF = &$this->getModule()->_oConfig->CNF;

        $sVotes = '';
        if(($oVotes = BxDolVote::getObjectInstance($CNF['OBJECT_VOTES_STARS'], $aData['id']))) {
            $sVotes = $oVotes->getElementBlock(['show_counter' => true, 'show_legend' => true]);
            if(!empty($sVotes))
                $sVotes = $this->parseHtmlByName('entry-rating.html', [
                    'content' => $sVotes,
                ]);
        }

        return $sVotes; 
    }

    protected function _getBrowsingFiltersContent($aParams)
    {
        $sModule = $this->_oConfig->getName();
        $sJsObject = $this->_oConfig->getJsObject('main');

        $sForm = $sModule . '_filters_' . $aParams['mode'];
        $aForm = [
            'form_attrs' => [
                'id' => $sForm,
                'name' => $sForm,
                'action' => ''
            ],
            'params' => [
                'db' => [
                    'table' => '',
                    'key' => '',
                    'uri' => '',
                    'uri_title' => '',
                    'submit_name' => ''
                ],
                'browse' => $aParams,
                'module' => $sModule,
                'object' => $sModule . '_filters',
                'display' => $sModule . '_filters_apply',
                'view_mode' => 0,
            ],
            'inputs' => [
                'controls' => [
                    'name' => 'controls',
                    'type' => 'input_set',
                    [
                        'name' => 'apply',
                        'type' => 'button',
                        'value' => _t('_bx_spaces_form_filters_input_do_apply'),
                        'attrs' => ['onclick' => $sJsObject . '.applyBrowsingFilter(this, ' . json_encode($aParams) . ')']
                    ], [
                        'name' => 'cancel',
                        'type' => 'button',
                        'value' => _t('_Cancel'),
                        'attrs' => [
                            'class' => 'bx-def-margin-sec-left',
                            'onclick' => "$('.bx-popup-applied:visible').dolPopupHide()"
                        ]
                    ],
                    
                ],
                
            ]
        ];

        $oForm = new BxTemplFormView($aForm);
        if($this->_bIsApi) 
            return [
                'name' => $oForm->getName(), 
                'data' => $oForm->getCodeAPI()
            ];

        $sIncludes = '';
        $sIncludes .= $this->addCss(['filters.css'], true);

        return $sIncludes . $oForm->getCode(true);
    }

    private function getBrowseQuick($aProfiles, $sTemplate = 'unit_wo_cover')
    {
        $sRv = '';
        foreach ($aProfiles as $iProfileId) {
            $oProfile = BxDolProfile::getInstance($iProfileId);
            if(!$oProfile)
                continue;
            $sRv .= $oProfile->getUnit(false, array('template' => $sTemplate));
        }
        return $sRv;
    }
}

/** @} */
