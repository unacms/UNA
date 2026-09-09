<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

require_once(BX_DIRECTORY_PATH_INC . "design.inc.php");

class BxBaseSearch extends BxDolSearch
{
    protected $_oTemplate;

    protected $_sIdForm = 'sys_search_form';
    protected $_sIdResults = 'sys_search_results';
    protected $_sIdLoading;
    protected $_sSuffixLiveSearch = '_quick';

    protected $_iSearchLenth;
    protected $_sSearchFunctionParams;

    public function __construct($aChoice, $oTemplate)
    {
        if (!is_array($aChoice) && $aChoice != '')
            $aChoice = array($aChoice);
        parent::__construct($aChoice);

        $this->_oTemplate = $oTemplate ? $oTemplate : BxDolTemplate::getInstance();

        $this->_sIdLoading = $this->_sIdForm;

        $this->_iSearchLenth = (int)getParam('sys_live_search_limit');
        $this->_sSearchFunctionParams = "%d, '%s', '%s', '%s', %d, %d";
    }

    public function setLiveSearch($bLiveSearch)
    {
        parent::setLiveSearch($bLiveSearch);

        if($this->_bLiveSearch) {
            $this->_sIdForm .= $this->_sSuffixLiveSearch;
            $this->_sIdResults .= $this->_sSuffixLiveSearch;
            $this->_sIdLoading = $this->_sIdResults;
        }
    }

    public function getForm($iDesignBoxTemplate = BX_DB_PADDING_DEF, $sTitle = false, $bOnlyForm = false)
    {
        if ($this->_sMetaType || $this->_sCategoryObject)
            return '';

        if (false === $sTitle)
            $sTitle = _t( "_Search");

        $aSection = '';
        if (bx_get('type'))
            $aSection = bx_process_input(bx_get('type'));
        else if (bx_get('section'))
            $aSection = bx_process_input(bx_get('section'));

        $aForm = $this->_getForm([
            'section' => $aSection,
            'keyword' => bx_get('keyword') ? bx_process_input(bx_get('keyword')) : ''
        ]);

        $oForm = new BxTemplFormView($aForm);
        $sForm = $oForm->getCode();

        if (!$this->_bLiveSearch) {
            $o = new BxTemplPaginate(array());
            $o->addCssJs();
        }
        if ($bOnlyForm)
            return $sForm;

        return $this->_oTemplate->parseHtmlByName('designbox_container.html', array(
            'class_add' => '',
            'bx_if:show_html_id' => array(
                'condition' => false,
                'content' => array(),
            ),
            'content' => DesignBoxContent($sTitle, $sForm, $iDesignBoxTemplate)
        ));
    }

    public function getResultsContainer($sCode = '')
    {
        return $this->_oTemplate->parseHtmlByName('search_result.html', [
            'html_id' => $this->_sIdResults,
            'class' => str_replace('_', '-', $this->_sIdResults),
            'content' => $sCode
        ]);
    }

    protected function _getForm($aValues = array())
    {
        $aForm = array(
            'form_attrs' => array(
               'id' => $this->_sIdForm,
               'action' => BX_DOL_URL_ROOT . 'searchKeyword.php',
               'method' => 'post',
            ),
            'params' => array(
                'csrf' => array(
                    'disable' => true,
                ),
            ),
            'inputs' => array(
                'live_search' => array(
                    'type' => 'hidden',
                    'name' => 'live_search',
                    'value' => $this->_bLiveSearch ? 1 : 0,
                ),
                'section' => array(
                    'type' => 'select',
                    'name' => 'section',
                    'caption' => _t('_Section'),
                    'values' => array_merge(array('' => _t('_search_in_all_section')), $this->getKeyTitlesPairs()),
                    'value' => $aValues['section'],
                ),
                'keyword' => array(
                    'type' => 'text',
                    'name' => 'keyword',
                    'caption' => _t('_Keyword'),
                    'value' => $aValues['keyword'],
                ),
                'search' => array(
                    'type' => 'submit',
                    'name' => 'search',
                    'value' => _t('_Search'),
                )
            )
        );

        if ($this->_bLiveSearch) {
            $sJsParams = sprintf($this->_sSearchFunctionParams, $this->_iSearchLenth, '#' . $this->_sIdForm, '#' . $this->_sIdResults, '#' . $this->_sIdLoading, $this->_bLiveSearch, (int)getParam('sys_search_keyword_min_len'));

            unset($aForm['inputs']['section']);
            unset($aForm['inputs']['search']);
            unset($aForm['inputs']['keyword']['caption']);
            $aForm['inputs']['keyword']['attrs']['placeholder'] = _t('_sys_search_placeholder');
            $aForm['inputs']['keyword']['attrs']['onkeydown'] = "return bx_search_on_type(event, $sJsParams);";
            $aForm['inputs']['keyword']['attrs']['onpaste'] = $aForm['inputs']['keyword']['attrs']['onkeydown'];
        }
        
        /**
         * @hooks
         * @hookdef hook-search-get_form 'search', 'get_form' - hook in create search form 
         * - $unit_name - equals `search`
         * - $action - equals `get_form` 
         * - $object_id - not used 
         * - $sender_id - not used 
         * - $extra_params - array of additional params with the following array keys:
         *      - `object` - [object] current search object
         *      - `override_result` - [array] by ref, form arrray defenition, can be overridden in hook processing
         * @hook @ref hook-search-get_form
         */
        bx_alert('search', 'get_form', 0, 0, array('object' => $this, 'override_result' => &$aForm));

        return $aForm;
    }
            
    protected function getKeyTitlesPairs ()
    {
        $a = array();
        foreach ($this->aClasses as $sKey => $r)
            if ($this->_sMetaType || $r['GlobalSearch'])
                $a[$sKey] = _t($r['title']);
        return $a;
    }
}

/** @} */
