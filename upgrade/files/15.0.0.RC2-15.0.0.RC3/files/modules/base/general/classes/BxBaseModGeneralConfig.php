<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    BaseGeneral Base classes for modules
 * @ingroup     UnaModules
 *
 * @{
 */

class BxBaseModGeneralConfig extends BxDolModuleConfig
{
    public $CNF;

    protected $_aObjects;
    protected $_aPrefixes;
    protected $_aJsClasses;
    protected $_aJsObjects;
    protected $_aHtmlIds;
    protected $_aHtmlIdsPoll;
    protected $_aGridObjects;

    protected $_bIsApi;

    /**
     * Delayed Publishing Notification Time (in seconds)
     * If video transcoding takes more than specified amount of time
     * then author will be notified about publishing (failure).
     */
    protected $_iDpnTime;

    function __construct($aModule)
    {
        parent::__construct($aModule);

        $this->CNF = [
            // modules icon
            'ICON_POLLS_ANSWERS' => 'vote-yea',
            'ICON_POLLS_RESULTS' => 'poll-h',

            // database tables
            'TABLE_POLLS' => $aModule['db_prefix'] . 'polls',
            'TABLE_POLLS_ANSWERS' => $aModule['db_prefix'] . 'polls_answers',
            'TABLE_POLLS_ANSWERS_VOTES' => $aModule['db_prefix'] . 'polls_answers_votes',
            'TABLE_POLLS_ANSWERS_VOTES_TRACK' => $aModule['db_prefix'] . 'polls_answers_votes_track',
            
            // database fields
            'FIELD_POLL' => 'polls',

            'FIELD_POLL_ID' => 'id',
            'FIELD_POLL_AUTHOR_ID' => 'author_id',
            'FIELD_POLL_CONTENT_ID' => 'content_id',
            'FIELD_POLL_TEXT' => 'text',
            'FIELD_POLL_ANSWERS' => 'answers',

            // some params
            'PARAM_POLL_ENABLED' => true,
            'PARAM_POLL_HIDDEN_RESULTS' => false,
            'PARAM_POLL_ANONYMOUS_VOTING' => true,

            // objects
            'OBJECT_VOTES_POLL_ANSWERS' => $this->_sName . '_poll_answers',

            // styles
            'STYLES_POLLS_EMBED_CLASS' => 'body.bx-page-iframe.bx-def-color-bg-page',
            'STYLES_POLLS_EMBED_CONTENT' => [
                'background-color' => '#ffffff'
            ]
        ];

        $sPrefix = str_replace('_', '-', $this->_sName);

        $this->_aObjects = [];

        $this->_aPrefixes = [];

        $this->_aJsClasses = [
            'poll' => $this->_sClassPrefix . 'Polls'
        ];
        $this->_aJsObjects = [
            'poll' => 'o' . $this->_sClassPrefix . 'Polls'
        ];

        $this->_aGridObjects = [];

        $this->_aHtmlIds = [];
        $this->_aHtmlIdsPoll = [
            'add_poll_popup' =>  $sPrefix . '-add-poll-popup',
            'add_poll_form_field' => $sPrefix . '-add-poll-form-field',
            'polls_showcase' => $sPrefix . '-polls-showcase-',
            'poll' => $sPrefix . '-poll-',
            'poll_content' => $sPrefix . '-poll-content-',
            'poll_view_menu' => $sPrefix . '-poll-view-menu',
            'poll_view_link_answers' => $sPrefix . '-poll-view-answers-',
            'poll_view_link_results' => $sPrefix . '-poll-view-results-',
        ];

        $this->_bIsApi = bx_is_api();

        $this->_iDpnTime = 3600;
    }

    public function getCNF()
    {
        /**
         * @hooks
         * @hookdef hook-bx_base_general-get_cnf '{module_name}', 'get_cnf' - hook to override module's configuration array
         * - $unit_name - module name
         * - $action - equals `get_cnf`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `override_result` - [array] by ref, module's configuration array, can be overridden in hook processing
         * @hook @ref hook-bx_base_general-get_cnf
         */
        bx_alert($this->getName(), 'get_cnf', 0, 0, ['override_result' => &$this->CNF]);
        return $this->CNF;
    }

    public function getObject($sType = '')
    {
    	if(empty($sType))
            return $this->_aObjects;

        return isset($this->_aObjects[$sType]) ? $this->_aObjects[$sType] : '';
    }
    
    public function getApiFormType()
    {
        return 'content';
    }

    public function getPrefix($sType = '')
    {
    	if(empty($sType))
            return $this->_aPrefixes;

        return isset($this->_aPrefixes[$sType]) ? $this->_aPrefixes[$sType] : '';
    }

    public function getJsClass($sType)
    {
        return isset($this->_aJsClasses[$sType]) ? $this->_aJsClasses[$sType] : '';
    }

    public function getJsObject($sType)
    {
        return isset($this->_aJsObjects[$sType]) ? $this->_aJsObjects[$sType] : '';
    }
    
    public function getJsObjectPoll($iId = 0)
    {
        if(($sJsObject = $this->getJsObject('poll')) !== '')
            return $sJsObject .= (int)$iId == 0 ? 'Add' : 'Edit' . $iId;

        return '';
    }

    public function getGridObject($sType)
    {
        return isset($this->_aGridObjects[$sType]) ? $this->_aGridObjects[$sType] : '';
    }

    /**
     * Is Auto Approve mode is available.
     */
    public function isAutoApprove()
    {
        return !empty($this->CNF['FIELD_STATUS_ADMIN']) && !empty($this->CNF['PARAM_AUTO_APPROVE']);
    }

    public function isAutoApproveEnabled()
    {
        return !$this->isAutoApprove() || getParam($this->CNF['PARAM_AUTO_APPROVE']) == 'on';
    }

    public function isEqualUrls($sUrl1, $sUrl2)
    {
        $sUrl1 = trim($sUrl1, "/");
        $sUrl2 = trim($sUrl2, "/");

        return strncmp($sUrl1, $sUrl2, strlen($sUrl1)) === 0;
    }

    public function getViewEntryUrl($mixedData)
    {
        if(!isset($this->CNF['URI_VIEW_ENTRY']))
            return '';

        $iId = 0;
        if(is_numeric($mixedData))
            $iId = (int)$mixedData;
        else if(is_array($mixedData) && isset($this->CNF['FIELD_ID'], $mixedData[$this->CNF['FIELD_ID']]))
            $iId = (int)$mixedData[$this->CNF['FIELD_ID']];
        else
            return '';

        return bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $this->CNF['URI_VIEW_ENTRY'] . '&id=' . $iId));
    }

    public function getEntryUri($sAction)
    {
        $sUri = '';

        if(($sKeyUri = 'URI_' . strtoupper($sAction) . '_ENTRY') && !empty($this->CNF[$sKeyUri]))
            $sUri = $this->CNF[$sKeyUri];
        if(!$sUri && $sAction == 'add' && ($sKeyUri = 'URI_EDIT_ENTRY') && !empty($this->CNF[$sKeyUri]))
            $sUri = str_replace('edit', 'create', $this->CNF[$sKeyUri]);

        return $sUri;
    }

    /*
     * Note. The first Transcoder in the array $aTranscoders has the highest priority. 
     */
    public function getImageUrl($iId, $aTranscoders)
    {
        $sResult = '';
        if(empty($iId) || empty($aTranscoders) || !is_array($aTranscoders))
            return $sResult;

        foreach($aTranscoders as $sTranscoder) {
            if(empty($this->CNF[$sTranscoder])) 
                continue;

            $oTranscoder = BxDolTranscoderImage::getObjectInstance($this->CNF[$sTranscoder]);
        	if(!$oTranscoder)
        	    continue;

            $sResult = $oTranscoder->getFileUrl($iId);
            if(!empty($sResult))
                break;
        }

        return $sResult;
    }

    public function getDpnTime()
    {
        return $this->_iDpnTime;
    }
}

/** @} */
