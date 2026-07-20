<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

class BxBaseFormView extends BxDolForm
{
    protected static $_isToggleJsAdded = false;

    protected static $_isCssJsAdded = false;
    protected static $_isCssJsUiAdded = false;
    protected static $_isCssJsUiSortableAdded = false;
    protected static $_isCssJsMinicolorsAdded = false;
    protected static $_isCssJsCodeMirrorAdded = false;
    protected static $_isCssJsLabelsAdded = false;
    protected static $_isCssJsTimepickerAdded = false;
    protected static $_isCssJsAddedViewMode = false;

    /**
     * Enable or disable error message displaying
     */
    protected $bEnableErrorIcon = true;

    /**
     * HTML Code of this form
     */
    protected $sCode;

    /**
     * Code which will be added to the beginning of the form.
     * For example, hidden inputs.
     * For internal use only
     */
    protected $_sCodeAdd = '';

    /**
     * for internal use only
     */
    protected $_isSectionOpened = false;

    /**
     * Default divider for several inputs
     */
    protected $_sDivider = '<span class="bx-def-margin-left"></span>';

    /**
     * Alternative divider for several inputs
     */
    protected $_sDividerAlt = '<div class="bx-form-input-dv-nl"></div>';

    /**
     * Form is added dynamically.
     */
    protected $_bDynamicMode = false;

    /**
     * Form is submitted dynamically (using Ajax Submit).
     */
    protected $_bAjaxMode = false;
    
    /**
     * Use absolute Action URL which is needed in Ajax Mode.
     */
    protected $_bAbsoluteActionUrl = false;

    /**
     * Form is displayed in view mode.
     */
    protected $_bViewMode = false;

    /**
     * Show or not sections which have no fileds
     */
    protected $_bShowEmptySections = false;

    /**
     * Function name for generation close form section HTML.
     */
    protected $_sSectionClose = 'getCloseSection';

    /**
     * Function name for generation open form section HTML.
     */
    protected $_sSectionOpen = 'getOpenSection';

    /**
     * JS files list for form
     */
    protected $_aJs = array();

    /**
     * CSS files list for form
     */
    protected $_aCss = array();

    protected $_sJsClassName;
    protected $_sJsObjectName;
    
    protected $_aHtmlIds;

    protected $_aAgentsFormObject;
    protected $_sAgentFormObject;
    
    /**
     * Constructor
     *
     * @param array $aInfo Form contents
     *
     * $aInfo['params'] = array(
     *     'remove_form' => true|false,
     * );
     *
     * @return BxBaseFormView
     */
    function __construct($aInfo, $oTemplate)
    {
        parent::__construct($aInfo, $oTemplate);

        $this->_bAjaxMode = isset($this->aParams['ajax_mode']) && $this->aParams['ajax_mode'];
        $this->_bViewMode = isset($this->aParams['view_mode']) && $this->aParams['view_mode'];

        if($this->_bViewMode) {
            $this->_sSectionClose = 'getCloseSectionViewMode';
            $this->_sSectionOpen = 'getOpenSectionViewMode';
        }

        $this->_sJsClassName = 'BxDolForm';

        $sName = !empty($aInfo['params']['display']) ? $aInfo['params']['display'] : '';
        if(empty($sName) && !empty($aInfo['params']['object']))
            $sName = $aInfo['params']['object'];
        if(empty($sName) && !empty($aInfo['form_attrs']['id']))
            $sName = $aInfo['form_attrs']['id'];
        if(empty($sName) && !empty($aInfo['form_attrs']['name']))
            $sName = $aInfo['form_attrs']['name'];

        $this->_sJsObjectName = 'oForm' . bx_gen_method_name($sName, array('_' , '-'));

        $sHtmlId = str_replace(array('_' , ' '), array('-', '-'), $sName);
        $this->_aHtmlIds = array(
            'help_popup' => $sHtmlId . '-help-popup-',
            'pgc' =>  $sHtmlId . '-pgc-',
            'pgc_popup' => $sHtmlId . '-pgc-popup-',
            'pgc_form' => $sHtmlId . '-pgc-form-',
        );

        $this->_sAgentFormObject = $aInfo['params']['object'] ?? $this->id;
        $this->_aAgentsFormObject = BxDolAI::getInstance()->getAgentsByFormObject($this->_sAgentFormObject);
    }

    public function performActionGetHelp()
    {
        $sInput = bx_process_input(bx_get('input'));
        if(empty($sInput) || empty($this->aInputs[$sInput]['help']))
            return;

        echo $this->oTemplate->parseHtmlByName('form_field_help_popup.html', array(
            'content' => _t($this->aInputs[$sInput]['help']),
            'bx_if:show_edit' => array(
                'condition' => isAdmin(),
                'content' => array(
                    'link' => BX_DOL_URL_STUDIO . bx_append_url_params('builder_forms.php', array(
                        'page' => 'fields',
                        'module' => $this->aParams['module'],
                        'object' => $this->aParams['object'],
                        'display' => $this->aParams['display']
                    ))
                )
            )
        ));
    }

    public function performActionChangePrivacyGroup()
    {
        $iAuthorId = (int)bx_get_logged_profile_id();
        if(empty($iAuthorId))
            return echoJson(array());

        $iInputId = bx_process_input(bx_get('input_id'), BX_DATA_INT);
        if(empty($iInputId))
            return echoJson(array());

        $sPrivacyObject = bx_process_input(bx_get('privacy_object'));
        $sPrivacyField = BxDolPrivacy::getFieldName($sPrivacyObject);
        if(empty($sPrivacyField))
            return echoJson(array());

        $sPrivacyGroup = bx_process_input(bx_get($sPrivacyField));
        if(empty($sPrivacyField))
            return echoJson(array());

        if(!BxDolFormQuery::setInputPrivacy($iInputId, $iAuthorId, $sPrivacyField, $sPrivacyGroup))
            return echoJson(array());

        return echoJson(array(
            'code' => 0,
            'form_id' => $this->getId(),
            'chooser_id' => $this->_aHtmlIds['pgc'] . $iInputId,
            'icon' => $this->_getPrivacyIcon($sPrivacyGroup),
            'eval' => $this->getJsObjectName() . '.pgcOnSelectGroup(oData);'
        ));
    }

    public function performActionGetPrivacyGroupChooser()
    {
        $iInputId = bx_process_input(bx_get('input_id'), BX_DATA_INT);
        $sPrivacyObject = bx_process_input(bx_get('privacy_object'));
        if(empty($iInputId) || empty($sPrivacyObject))
            return '';

        $sFormId = $this->_aHtmlIds['pgc_form'] . $iInputId;
        $aFormActionParams = array();
        if(!empty($this->aParams['object']) && !empty($this->aParams['display']))
            $aFormActionParams = array(
                'o' => $this->aParams['object'], 
                'd' => $this->aParams['display']
            );
        $aFormActionParams['a'] = 'change_privacy_group';

        $iAuthorId = bx_get_logged_profile_id();
        $mixedPrivacyGroup = $this->_getPrivacyGroup($sPrivacyObject, $iInputId, $iAuthorId);

        $oPrivacy = BxDolPrivacy::getObjectInstance($sPrivacyObject);
        $aInputPgc = $oPrivacy->getGroupChooser($sPrivacyObject, $iAuthorId);
        $aInputPgc['value'] = $mixedPrivacyGroup;

        if(!isset($aInputPgc['content']))
            $aInputPgc['content'] = '';
        $aInputPgc['content'] .= $oPrivacy->addCssJs(true);
        $aInputPgc['content'] .= $oPrivacy->initGroupChooser($sPrivacyObject, $iAuthorId, array(
            'content_id' => $iInputId,
            'group_id' => $mixedPrivacyGroup,
            'html_ids' => array(
                'form' => $sFormId
            )
        ));
        
        $aFormInfo = array(
            'form_attrs' => array(
                'id' => $sFormId,
                'action' => BX_DOL_URL_ROOT . bx_append_url_params('form.php', $aFormActionParams),
                'method' => 'post'
            ),
            'inputs' => array (
                'input_id' => array(
                    'type' => 'hidden',
                    'name' => 'input_id',
                    'value' => $iInputId,
                    'db' => array (
                        'pass' => 'Int',
                    ),
                ),
                'privacy_object' => array(
                    'type' => 'hidden',
                    'name' => 'privacy_object',
                    'value' => $sPrivacyObject,
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                ),
                'privacy_group_chooser' => $aInputPgc,
                'controls' => array(
                    'name' => 'controls',
                    'type' => 'input_set',
                    array(
                        'type' => 'button',
                        'name' => 'do_submit',
                        'value' => _t('_sys_submit'),
                        'attrs' => array(
                            'onclick' => "$('#" . $sFormId . "').submit()",
                        ),
                    ),
                    array (
                        'type' => 'reset',
                        'name' => 'do_cancel',
                        'value' => _t('_Cancel'),
                        'attrs' => array(
                            'onclick' => "$(this).parents('.bx-popup-applied:visible:first').dolPopupHide()",
                            'class' => 'bx-def-margin-sec-left',
                        ),
                    )
                )
            )
        );
        $oForm = new BxTemplFormView($aFormInfo);

        echo $this->oTemplate->parseHtmlByName('form_field_privacy_popup.html', array(
            'form_id' => $oForm->getId(),
            'form' => $oForm->getCode(true),
        ));
    }

    function setShowEmptySections($b)
    {
        $this->_bShowEmptySections = $b;
    }

    function setAjaxMode($bAjaxMode)
    {
        $this->_bAjaxMode = (bool)$bAjaxMode;
    }

    function isAjaxMode()
    {
        return $this->_bAjaxMode;
    }

    function isViewMode()
    {
        return (bool)($this->aParams['view_mode'] ?? 0);
    }

    function setAbsoluteActionUrl($sUrl)
    {
        if(empty($sUrl))
            return;

        $this->aFormAttrs['action'] = $sUrl;

        $this->_bAbsoluteActionUrl = true;
    }

    /**
     * Return Form code
     * @param $bDynamicMode - set it to true if form is added via JS/AJAX call, for example form in AJAX popup.
     * @return string
     */
    function getCode($bDynamicMode = false)
    {
        if(!$bDynamicMode && bx_is_dynamic_request())
            $bDynamicMode = true;

        $this->_bDynamicMode = $bDynamicMode;
        $this->aFormAttrs = $this->_replaceMarkers($this->aFormAttrs);

        $sInclude = '';
        $this->sCode = false;

        /**
         * @hooks
         * @hookdef hook-system-form_output 'system', 'form_output' - hook to override form object and/or code to be output
         * - $unit_name - equals `system`
         * - $action - equals `form_output`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `dynamic` - [boolean] is dynamic mode
         *      - `object` - [object] by ref, an instance of form class, @see BxDolForm, can be overridden in hook processing
         *      - `code` - [boolean] or [string] by ref, when false the default generation mechanism will be used, can be overridden in hook processing
         *      - `include` - [string] by ref, additional data to be attached to output, can be overridden in hook processing
         * @hook @ref hook-system-form_output
         */
        bx_alert('system', 'form_output', 0, 0, [
            'dynamic' => $this->_bDynamicMode,
            'object' => &$this,
            'code' => &$this->sCode,
            'include' => &$sInclude,

            'code_ref' => &$this->sCode,
            'include_ref' => &$sInclude,
            'form_inputs_ref' => &$this->aInputs,
        ]);

        if($this->sCode === false)
            $this->sCode = $this->genForm();

        $this->addCssJs();
        $sDynamicCssJs = $this->_processCssJs();
        return $sInclude . $sDynamicCssJs . $this->sCode;
    }

    function getCodeAPI()
    {
        $this->aFormAttrs = $this->_replaceMarkers($this->aFormAttrs);
    
        $this->sCode = false;
        /**
         * @hooks
         * @hookdef hook-system-form_output_api 'system', 'form_output_api' - hook to override form object and/or code to be output. Is used in API calls.
         * - $unit_name - equals `system`
         * - $action - equals `form_output_api`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `dynamic` - [boolean] is dynamic mode
         *      - `object` - [object] by ref, an instance of form class, @see BxDolForm, can be overridden in hook processing
         *      - `code` - [boolean] by ref, when false the default generation mechanism will be used, can be overridden in hook processing
         * @hook @ref hook-system-form_output_api
         */
        bx_alert('system', 'form_output_api', 0, 0, [
            'dynamic' => $this->_bDynamicMode,
            'object' => &$this,
            'code' => &$this->sCode,
            'code_ref' => &$this->sCode,
            'form_inputs_ref' => &$this->aInputs,
        ]);

        if($this->sCode === false) {
            if(!$this->genForm() && (bool)($this->aParams['view_mode'] ?? 0))
                return [];
        }

        $oIconset = BxDolIconset::getObjectInstance();
        $oFunctions = BxTemplFunctions::getInstanceWithTemplate($this->oTemplate);

        // TODO: process inputs to translate titles, alerts, etc

        $aInputs = [];
        foreach($this->aInputs as $sKey => $aInput) {
            if(isset($aInput['visible_for_levels']) && !self::isVisible($aInput)) 
                continue;

            if(isset($aInput['type']) && in_array($aInput['name'], ['captcha'])) 
                continue;

            list($sIcon, $sIconUrl, $sIconA, $sIconHtml) = $oFunctions->getIcon($aInput['icon'] ?? '');

            $aInput['icon'] = $sIcon ? $oIconset->getIcon($sIcon) : ($sIconHtml ? $sIconHtml : '');
            if(!empty($aInput['info']))
                $aInput['info'] = strip_tags($aInput['info']);
            if(!empty($aInput['help']))
                $aInput['help'] = strip_tags($aInput['help']);
            if(!empty($aInput['error']))
                $aInput['error'] = strip_tags($aInput['error']);

            if (isset($aInput['type']) && 'files' == $aInput['type']){
                $oStorage = BxDolStorage::getObjectInstance($aInput['storage_object']);
                $aInput['ext_allow'] = $oStorage->getObjectData()['ext_allow'];
                $aInput['ext_deny'] = $oStorage->getObjectData()['ext_deny'];
                $aInput['ghost_template'] = '';
                $aInput['value'] = '';
                $aInput['values'] = '';
                $aInput['values_src'] = '';
                if(!empty($aInput['content_id']) && ($sUpr = reset($aInput['uploaders'])) && ($sStg = $aInput['storage_object'] ?? '') && ($oUploader = BxDolUploader::getObjectInstance($sUpr, $sStg, genRndPwd(8))) !== false) {
                    $oUploader->setMultiple($aInput['multiple'] ?? true);
                    if(($sMethod = 'setSubmitted') && method_exists($oUploader, $sMethod))
                        $oUploader->$sMethod($this->isSubmitted());

                    $sData = $oUploader->getGhostsWithOrder((int)bx_get_logged_profile_id(), 'json', $aInput['images_transcoder'], $aInput['content_id']);
                    if($sData && ($aData = json_decode($sData, true)) && !empty($aData['g']) && is_array($aData['g'])) {
                        $aInput['values_src'] = array_values($aData['g']);

                        $aGhostIds = [];
                        array_walk($aData['g'], function($aGhost) use (&$aGhostIds) {
                            $aGhostIds[] = $aGhost['file_id'];
                        });

                        $aInput['value'] = implode(',', $aGhostIds);
                    }
                }
            }

            if (isset($aInput['type']) && 'custom' == $aInput['type']){
                $sCustomMethod = 'genCustomInput' . $this->_genMethodName($aInput['name']);
                if (method_exists($this, $sCustomMethod))
                     $aInput = $this->$sCustomMethod($aInput);
            }

            if (isset($aInput['type']) && 'block_header' == $aInput['type']){
                $aInput['name'] = $sKey;
            }

            if (isset($aInput['type']) && 'block_header' == $aInput['type']){
                $aInput['name'] = $sKey;
            }

            if (isset($aInput['type']) && 'location' == $aInput['type']){
                $oLocation = BxDolLocationField::getObjectInstance(getParam('sys_location_field_default'));

                $aVars = [];
                foreach(BxDolForm::$LOCATION_INDEXES as $sKey)
                    $aVars[$sKey] = $oLocation->getLocationVal($aInput, $sKey, $this);

                if(($sLocationString = bx_api_get_location_string($aVars)))
                    $aVars['location_string'] = $sLocationString;

                $aInput['value'] = $aVars;
            }

            if (isset($aInput['type']) && 'textarea' == $aInput['type']){
                if (isset($aInput['value'], $aInput['html']) && (int)$aInput['html'] == 0)
                    $aInput['value'] = strip_tags($aInput['value']);
            }

            /**
             * Everytime when [key => value] is used it should be converted to [key => ..., value => ...]
             */
            if (($sVt = $aInput['type'] ?? false) && in_array($sVt, ['select', 'select_multiple', 'checkbox_set', 'radio_set']) && is_array(($aVv = $aInput[($sKv = 'values')] ?? false)) && !(is_array(($aVv1 = reset($aVv))) && isset($aVv1['key'], $aVv1['value']))) {
                $aInput[$sKv] = array_map(function($sKey) use($aInput, $sKv) {
                    return ['key' => $sKey, 'value' => $aInput[$sKv][$sKey]];
                }, array_keys($aInput[$sKv]));
            }

            if(isset($aInput['name']) && in_array($aInput['name'], ['allow_view_to', 'object_privacy_view'])) {
                $aParams = bx_get('params');
                if(empty($aParams) || !is_array($aParams))
                    $aParams = [];

                if(!isset($aParams['context_id']) || ($iContextId = (int)$aParams['context_id']) >= 0) {
                    $oProfile = BxDolProfile::getInstance();

                    foreach($aInput['values'] as $aValue) {
                        //--- Selected friends
                        if(isset($aValue['key']) && (int)$aValue['key'] == BX_DOL_PG_FRIENDS_SELECTED) {
                            $aIds = BxDolConnection::getObjectInstance('sys_profiles_friends')->getConnectedContent($oProfile->id(), true, 0, 20);
                            if(!empty($aIds) && is_array($aIds)) {
                                $aInput['values_friends'] = [];
                                foreach($aIds as $iId)
                                    $aInput['values_friends'][] = ['key' => $iId, 'value' => BxDolProfile::getData($iId)];
                            }
                        }

                        //--- Selected relations
                        if(isset($aValue['key']) && (int)$aValue['key'] == BX_DOL_PG_RELATIONS_SELECTED) {
                            $aIds = BxDolConnection::getObjectInstance('sys_profiles_relations')->getConnectedContent($oProfile->id(), true, 0, 20);
                            if(!empty($aIds) && is_array($aIds)) {
                                $aInput['values_relations'] = [];
                                foreach($aIds as $iId)
                                    $aInput['values_relations'][] = ['key' => $iId, 'value' => BxDolProfile::getData($iId)];
                            }
                        }

                        //--- Selected memberships
                        if(isset($aValue['key']) && (int)$aValue['key'] == BX_DOL_PG_MEMBERSHIPS_SELECTED) {
                            $aLevels = BxDolAcl::getInstance()->getMemberships(false, true, true, true);
                            if(!empty($aLevels) && is_array($aLevels)) {
                                $aInput['values_memberships'] = [];
                                foreach($aLevels as $iId => $sTitle)
                                    $aInput['values_memberships'][] = ['key' => $iId, 'value' => $sTitle];
                            }
                        }
                    }
                }
                else
                    $aInput = array_merge($aInput, [
                        'type' => 'hidden',
                        'value' => $iContextId,
                        'owner_info' => BxDolProfile::getData(abs($iContextId))
                    ]);
            }

            $aInputs[$sKey] = $aInput;
        }

        return [
            'inputs' => $aInputs, 
            'attrs' => $this->aFormAttrs, 
            'params' => $this->aParams
        ];
    }

    public function getJsClassName()
    {
        return $this->_sJsClassName;
    }

    public function getJsObjectName()
    {
        return $this->_sJsObjectName;
    }

    public function getJsScript($bWrap = false)
    {
        $sJsObjName = $this->getJsObjectName();
        $sJsObjClass = $this->getJsClassName();

        $sCode = "if(window['" . $sJsObjName . "'] == undefined) window['" . $sJsObjName . "'] = new " . $sJsObjClass . "(" . json_encode(array(
            'sObjName' => $sJsObjName,
            'sId' => $this->getId(),
            'sName' => $this->getName(),
            'sObject' => isset($this->aParams['object']) ? $this->aParams['object'] : '',
            'sDisplay' => isset($this->aParams['display']) ? $this->aParams['display'] : '',
            'sRootUrl' => BX_DOL_URL_ROOT,
            'aHtmlIds' => $this->_aHtmlIds,
            'bInitCodeMirror' => self::$_isCssJsCodeMirrorAdded === true,
            'bLeavePageConfirmation' => getParam('sys_form_lpc_enable') == 'on',
            'sTxtLeavePageConfirmation' => _t('_sys_leave_page_confirmation')
        )) . "); window['" . $sJsObjName . "'].init();";

        return $bWrap ? $this->oTemplate->_wrapInTagJsCode($sCode) : $sCode;
    }

    /**
     * Generate the whole form
     *
     * @return string
     */
    function genForm()
    {
        $this->_sCodeAdd = '';

        $bViewMode = $this->isViewMode();
        $sTable = $this->genRows();
        if($bViewMode && !$sTable)
            return '';

        $sHtmlBefore = isset($this->aParams['html_before']) ? $this->aParams['html_before'] : '';
        $sHtmlAfter = isset($this->aParams['html_after']) ? $this->aParams['html_after'] : '';

        if (!empty($this->aParams['remove_form']) || $bViewMode) {
            $sForm = <<<BLAH
                    $sHtmlBefore
                    {$this->_sCodeAdd}
                    <div class="bx-form-advanced-wrapper {$this->id}_wrapper">
                        $sTable
                    </div>
                    $sHtmlAfter
BLAH;
        } else {
            $sFormAttrs = bx_convert_array2attrs($this->aFormAttrs, 'bx-form-advanced');

            $sAjaxFormJs = '';
            if($this->_bAjaxMode)
            	$sAjaxFormJs = <<<BLAH
	            	$("form#{$this->id}").ajaxForm({ 
			            dataType: "json",
			            beforeSubmit: function (formData, jqForm, options) {
			                bx_loading($("form#{$this->id}"), true);
			            },
			            success: function (oData) {
			            	bx_loading($("form#{$this->id}"), false);
			
			                processJsonData(oData);
			            }
			        });
BLAH;

            $sJsCodeDynamic = '';
            if($this->_bDynamicMode)
                $sJsCodeDynamic = 'function() {' . $this->getJsScript() . '}';

            $sForm = <<<BLAH
                $sHtmlBefore
                <form $sFormAttrs>
                    {$this->_sCodeAdd}
                    <div class="bx-form-advanced-wrapper {$this->id}_wrapper">
                        $sTable
                    </div>
                </form>
                <script>
                    $(document).ready(function() {
                        $(this).addWebForms($sJsCodeDynamic);
                    });
                    $sAjaxFormJs
                </script>
                $sHtmlAfter
BLAH;
        }

        if(!$this->_bDynamicMode)
            $sForm = $sForm . $this->getJsScript(true);

        return $sForm;
    }

    /**
     * Generate Table HTML code
     *
     * @return string
     */
    function genRows()
    {
        // add CSRF token if it's needed.
        if (!(isset($this->aParams['view_mode']) && $this->aParams['view_mode']) && getParam('sys_security_form_token_enable') == 'on' && (!isset($this->aParams['csrf']['disable']) || (isset($this->aParams['csrf']['disable']) && $this->aParams['csrf']['disable'] !== true)) && ($mixedCsrfToken = BxDolForm::getCsrfToken()) !== false) {
            $this->aInputs['csrf_token'] = array(
                'type' => 'hidden',
                'name' => 'csrf_token',
                'value' => $mixedCsrfToken,
                'db' => array ('pass' => 'Xss'),
                'visible_for_levels' => PHP_INT_MAX,
            );
        }

        // add 'Ajax Mode' flag
        if($this->_bAjaxMode)
            $this->aInputs['ajax_mode'] = array(
                'type' => 'hidden',
                'name' => 'ajax_mode',
                'value' => 1,
                'db' => array ('pass' => 'Int'),
                'visible_for_levels' => PHP_INT_MAX,
            );

        // add 'Absolute Action Url' flag
        if($this->_bAbsoluteActionUrl)
            $this->aInputs['absolute_action_url'] = array(
                'type' => 'hidden',
                'name' => 'absolute_action_url',
                'value' => 1,
                'db' => array ('pass' => 'Int'),
                'visible_for_levels' => PHP_INT_MAX,
            );

        // check if we need to generate open section clause
        $sOpenSection = '';
        foreach ($this->aInputs as $aInput) {
            if (isset($aInput['type']) && 'hidden' == $aInput['type'])
                continue;
            if (isset($aInput['type']) && 'block_header' != $aInput['type'])
                $sOpenSection = $this->{$this->_sSectionOpen}();
            break;
        }

        // generate rows contents
        $sCont = '';
        $sContHeader = '';
        $sContFields = '';
        $sFuncGenRow = isset($this->aParams['view_mode']) && $this->aParams['view_mode'] ? 'genViewRow' : 'genRow';
        foreach ($this->aInputs as &$aInput) {
    
            if (!isset($aInput['visible_for_levels']) || self::isVisible($aInput)) {
                if ((isset($aInput['type']) && 'block_header' == $aInput['type']) && !$this->_bShowEmptySections) {
                    // don't show section with no fields or with empty fields
                    if ($sContHeader) {                        
                        if ($sContFields)
                            $sCont .= $sContHeader . $sContFields;
                        else
                            $sContHeader = '';
                        $sContFields = '';
                    } 
                    else {
                        $sCont .= $sContFields;
                        $sContFields = '';
                    }
                    $sContHeader = $this->$sFuncGenRow($aInput);
                } else {
                    $sContFields .= $this->$sFuncGenRow($aInput);
                }
            }
        }
        $sCont .= $sContHeader . $sContFields;

        $sCloseSection = $this->{$this->_sSectionClose}();

        return $this->isViewMode() && !$sCont ? '' : $sOpenSection . $sCont . $sCloseSection;
    }

    /**
     * Generate single Table Row
     *
     * @param  array  $aInput
     * @return string
     */
    function genRow(&$aInput)
    {
        if (!isset($aInput['type']))
            $aInput['type'] = false;

        if (!empty($aInput['name'])) {
            $sCustomMethod = 'genCustomRow' . $this->_genMethodName($aInput['name']);
            if (method_exists($this, $sCustomMethod))
                return $this->$sCustomMethod($aInput);
        }
        
        switch ($aInput['type']) {

            case 'block_header':
                $sRow = $this->genRowBlockHeader($aInput);
            break;

            case 'block_end':
                $sRow = $this->genBlockEnd($aInput);
            break;

            case 'hidden':
                // do not generate row for hidden inputs
                $sRow = '';
                $this->_sCodeAdd .= $this->genInput($aInput);
            break;

            case 'select_box':
                $sRow = $this->genRowCustom($aInput, 'genInputSelectBox');
            break;

            case 'files':
                $sRow = $this->genRowCustom($aInput, 'genInputFiles');
            break;

            case 'switcher':
            case 'checkbox':
                $sRow = $this->genRowStandard($aInput, true);
            break;
            
            default:
                $sRow = $this->genRowStandard($aInput);
        }

        return $sRow;
    }

    public function isInputVisible($mixedInput)
    {
        if(!is_array($mixedInput) && isset($this->aInputs[$mixedInput]))
            $mixedInput = $this->aInputs[$mixedInput];

        if(empty($mixedInput) || !is_array($mixedInput))
            $mixedInput = BxDolFormQuery::getInputByName($this->aParams['object'], $mixedInput);

        if(empty($mixedInput) || !is_array($mixedInput))
            return false;

        if(!empty($mixedInput['privacy']) && !empty($this->_iAuthorId) && !$this->_isInputVisibleByPrivacy($mixedInput))
            return false;

        return true;
    }

    protected function _isInputVisibleByPrivacy($aInput)
    {
        $mixedResult = checkActionModule($this->_iAuthorId, 'set form fields privacy', 'system');
        if($mixedResult[CHECK_ACTION_RESULT] !== CHECK_ACTION_RESULT_ALLOWED)
            return true;            

        $aInputPrivacy = BxDolFormQuery::getInputPrivacy($aInput['id'], $this->_iAuthorId);
        if(empty($aInputPrivacy) || !is_array($aInputPrivacy))
            if(BxDolFormQuery::setInputPrivacy($aInput['id'], $this->_iAuthorId, BxDolPrivacy::getFieldName($this->_sPrivacyObjectView), $this->_sPrivacyGroupDefault))
                $aInputPrivacy = BxDolFormQuery::getInputPrivacy($aInput['id'], $this->_iAuthorId);

        if((empty($aInputPrivacy) || !is_array($aInputPrivacy)) && $this->_sPrivacyGroupDefault != BX_DOL_PG_ALL)
            return false;

        $oPrivacy = BxDolPrivacy::getObjectInstance($this->_sPrivacyObjectView);            
        if($oPrivacy && !$oPrivacy->check($aInputPrivacy['id']))
            return false;

        return true;
    }

    /**
     * Generate single Table Row for view mode
     *
     * @param  array  $aInput
     * @return string
     */
    function genViewRow(&$aInput)
    {
        if (!isset($aInput['type']))
            $aInput['type'] = false;

        if(!$this->isInputVisible($aInput))
            return '';

        if (!empty($aInput['name'])) {
            $sCustomMethod = 'genCustomRow' . $this->_genMethodName($aInput['name']);
            if (method_exists($this, $sCustomMethod))
                return $this->$sCustomMethod($aInput);
        }

        switch ($aInput['type']) {

            case 'block_header':
                $sRow = $this->genRowBlockHeader($aInput);
                break;

            case 'block_end':
                $sRow = $this->genBlockEnd($aInput);
                break;

            case 'nested_form':
                $sRow =  $this->genNestedForm($aInput);
                break;

            case 'textarea':
                $sRow = $this->{'genViewRowWrapped' . ($aInput['html'] != 0 ? 'Html' : '')}($aInput);
                break;

            default:
                $sRow = $this->genViewRowWrapped($aInput);
        }

        return $sRow;
    }

    /**
     * Generate complete wrapped row for view mode form
     *
     * @param  array  $aInput
     * @return string
     */
    function genViewRowWrapped(&$aInput)
    {
        return $this->_genViewRowWrapped($aInput);
    }

    function genViewRowWrappedHtml(&$aInput)
    {
        return $this->_genViewRowWrapped($aInput, [
            'class_value' => 'bx-def-vanilla-html max-w-none'
        ]);
    }

    protected function _genViewRowWrapped(&$aInput, $aParams = [])
    {
        $sValue = $this->genViewRowValue($aInput);
        if (null === $sValue)
            return '';

        $sClass = !empty($aParams['class']) ? $aParams['class'] : '';
        $sClassValue = !empty($aParams['class_value']) ? $aParams['class_value'] : '';

        $aTmplVarsIcon = [];
        if(!empty($aInput['icon']))
            $aTmplVarsIcon = [
                'icon' => $this->genIcon($aInput['icon'])
            ];

        return $this->oTemplate->parseHtmlByName('form_view_row.html', [
            'type' => $aInput['type'], 
            'class' => $sClass,
            'bx_if:show_icon' => [
                'condition' => !empty($aTmplVarsIcon),
                'content' => $aTmplVarsIcon
            ],
            'caption' => isset($aInput['caption']) ? bx_process_output($aInput['caption']) : '',
            'class_value' => $sClassValue,
            'value' => $sValue
        ]);
    }

    /**
     * Generate value for view mode row
     *
     * @param  array  $aInput
     * @return string
     */
    function genViewRowValue(&$aInput)
    {
        if (!empty($aInput['name'])) {
            $sCustomMethod = 'genCustomViewRowValue' . $this->_genMethodName($aInput['name']);
            if (method_exists($this, $sCustomMethod))
                return $this->$sCustomMethod($aInput);
        }

        switch ($aInput['type']) {

            case 'hidden':
                $sValue = null;
            break;

            case 'select':
            case 'radio_set':
                $sValue = $this->genViewRowValueForSelect($aInput);
            break;

            case 'dateselect':    
            case 'datepicker':
                $sValue = null;
                if (empty($aInput['value']) || !$aInput['value'] || '0000-00-00' == $aInput['value'])
                    break;

                if (isset($aInput['db']['pass']) && ('DateUtc' == $aInput['db']['pass'] || 'DateTimeUtc' == $aInput['db']['pass']) && !is_numeric($aInput['value'])) 
                    $sValue = BxTemplFunctions::getInstance()->timeForJsFullDate($aInput['value'], isset($aInput['date_format']) ? $aInput['date_format']: BX_FORMAT_DATE, true, true);
                else
                    $sValue = BxTemplFunctions::getInstance()->{is_numeric($aInput['value']) ? 'timeForJs' : 'timeForJsFullDate'}($aInput['value'], isset($aInput['date_format']) ? $aInput['date_format'] : BX_FORMAT_DATE, true);
            break;

            case 'date_time':
            case 'datetime':
                $sValue = null;
                if(empty($aInput['value']) || !$aInput['value'] || '0000-00-00 00:00:00' == $aInput['value'] || '0000-00-00 00:00' == $aInput['value'])
                    break;

                if (isset($aInput['db']['pass']) && ('DateUtc' == $aInput['db']['pass'] || 'DateTimeUtc' == $aInput['db']['pass']) && !is_numeric($aInput['value'])) 
                    $sValue = BxTemplFunctions::getInstance()->timeForJsFullDate($aInput['value'], isset($aInput['date_format']) ? $aInput['date_format'] : BX_FORMAT_DATE_TIME, true, true);
                else
                    $sValue = BxTemplFunctions::getInstance()->{is_numeric($aInput['value']) ? 'timeForJs' : 'timeForJsFullDate'}($aInput['value'], isset($aInput['date_format']) ? $aInput['date_format'] : BX_FORMAT_DATE_TIME, true);
            break;

            case 'checkbox_set':
            case 'select_multiple':
                $sValue = null;
                if (!empty($aInput['value']) && is_array($aInput['value'])) {
                    $sValue = '';
                    foreach ($aInput['value'] as $sVal)
                        $sValue .= $aInput['values'][$sVal] . ', ';
                    $sValue = trim ($sValue, ', ');
                }
            break;

            case 'checkbox':
            case 'switcher':
                $sValue = isset($aInput['checked']) && $aInput['checked'] ? _t('_sys_form_checkbox_value_on') : _t('_sys_form_checkbox_value_off');
            break;

            case 'textarea':
                if (isset($aInput['value']) && '' !== $aInput['value']) 
                    $sValue = (isset($aInput['html']) && $aInput['html']) || (isset($aInput['code']) && $aInput['code']) ? $aInput['value'] : bx_process_output($aInput['value'], BX_DATA_TEXT_MULTILINE);
                else
                    $sValue = null;
            break;

            case 'text':
                if(isset($aInput['value']) && '' !== $aInput['value'])
                    $sValue = bx_linkify(bx_process_output($aInput['value']));
                else 
                    $sValue = null;
                break;

            case 'price':
                if(isset($aInput['value']) && $aInput['value'] !== '')
                    $sValue = _t_format_currency(bx_process_output($aInput['value']));
                else
                    $sValue = null;
                break;

            default:
                if(isset($aInput['value']) && '' !== $aInput['value']) {
                    $sValue = $aInput['value'];
                    if(get_mb_substr($sValue, 0, 1) == '_')
                        $sValue = _t($sValue);

                    $sValue = bx_process_output($sValue);
                }
                else
                    $sValue = null;
        }

        return $sValue;
    }

    function genViewRowValueForSelect(&$aInput)
    {
        if (!isset($aInput['value']) || !$aInput['value'])
            return null;
        $s = isset($aInput['value']) && isset($aInput['values'][$aInput['value']]) ? $aInput['values'][$aInput['value']] : null;
        if (isset($aInput['values_list_name'])  && ($oCategory = BxDolCategory::getObjectInstanceByFormAndList($this->aFormAttrs['name'], $aInput['values_list_name'])) !== false)
            return $oCategory->getCategoryLink($s, $aInput['value']);
        return $s;
    }

    protected function genCustomRowBirthday(&$aInput)
    {
        if(!$this->_bViewMode)
            return $this->genRowStandard($aInput);

        $sTxtAge = '_sys_form_input_age';
        $aInput = array_merge($aInput, [
            'caption_src' => $sTxtAge,
            'caption' => _t($sTxtAge),
        ]);

        if(bx_is_api())
            $aInput = array_merge($aInput, [
                'type' => 'text',
                'value' => bx_birthday2age($aInput['value'])
            ]);

        return $this->genViewRowWrapped($aInput);
    }

    protected function genCustomRowCf(&$aInput)
    {
        $aInput = BxDolContentFilter::getInstance()->getInput($aInput);
        if($aInput['type'] == 'hidden') {
            $this->_sCodeAdd .= $this->genInput($aInput);
            return '';
        }

        return $this->genRowStandard($aInput);
    }

    protected function genCustomViewRowValueBirthday(&$aInput)
    {
        if(!isset($aInput['value']) || !$aInput['value'] || in_array($aInput['value'], array('0000-00-00', '0000-00-00 00:00:00', '0000-00-00Z', '0000-00-00 00:00:00Z')))
            return null;

        return bx_birthday2age($aInput['value']);
    }

    /**
     * Generate standard row
     *
     * @param  array  $aInput
     * @return string
     */
    function genRowStandard(&$aInput, $isOneLine = false)
    {
        $sCaption = isset($aInput['caption']) ? bx_process_output($aInput['caption'], BX_DATA_HTML) : '';

        $sRequired = !empty($aInput['required']) ? '<span class="bx-form-required">*</span>' : '';
        
        $sHelp = !empty($aInput['help']) ? ' <a href="javascript:void(0)" onclick="javascript:' . $this->getJsObjectName() . '.showHelp(this, \'' . $aInput['name'] . '\')"><i class="sys-icon question-circle"></i></a> ' : '';

        $sClassAdd = !empty($aInput['error']) ? ' bx-form-error' : '';
        $sInfoIcon = !empty($aInput['info']) ? $this->genInfoIcon($aInput['info']) : '';

        $sErrorIcon = $this->genErrorIcon(empty($aInput['error']) ? '' : $aInput['error']);

        $sClassWrapper = 'bx-form-element-wrapper';
        if($isOneLine)
            $sClassWrapper .= ' ' . $sClassWrapper . '-oneline';
        $sClassWrapper .= ' bx-def-margin-top-auto';

        if (isset($aInput['name'])) {
            if (!isset($aInput['tr_attrs']) || !is_array($aInput['tr_attrs']))
                $aInput['tr_attrs'] = [];
            $aInput['tr_attrs']['id'] = "bx-form-element-" . $aInput['name'];
        }
        $sTrAttrs = bx_convert_array2attrs(isset($aInput['tr_attrs']) && is_array($aInput['tr_attrs']) ? $aInput['tr_attrs'] : array(), $sClassWrapper);

        $sClassOneLineCaption = '';
        $sClassOneLineValue = '';
        if ($isOneLine) {
            $sClassOneLineCaption = ' bx-form-caption-oneline bx-form-caption-oneline-' . $aInput['type'] . ' ltr:ml-4 rtl:mr-4';
            $sClassOneLineValue = ' bx-form-value-oneline bx-form-value-oneline-' . $aInput['type'];
            if (!isset($aInput['attrs']) || !is_array($aInput['attrs']))
                $aInput['attrs'] = [];
            $aInput['attrs']['id'] = $this->getInputId($aInput);
            if ($sCaption)
                $sCaption = '<label for="' . $aInput['attrs']['id'] . '">' . $sCaption . '</label>';
        }

        $sInput = $this->genInput($aInput);
        if(isset($aInput['error_updated']) && $aInput['error_updated'] === true)
            $sErrorIcon = $this->genErrorIcon(empty($aInput['error']) ? '' : $aInput['error']);
        if(empty($sErrorIcon)) 
            $sErrorIcon = '';

        $aTmplVarsRow = array(
            'bx_if:show_caption' => array(
                'condition' => !empty($sCaption),
                'content' => array(
                    'class_caption' => $sClassOneLineCaption,
                    'caption' => $sCaption,
                    'required' => $sRequired,
                    'help' => $sHelp,
                )
            ),
            'class_value' => $sClassAdd . $sClassOneLineValue,
            'value' => $this->genWrapperInput($aInput, $sInput),
            'info' => $sInfoIcon,
            'error' => $sErrorIcon,
        );

        return $this->oTemplate->parseHtmlByName('form_row_standard.html', array(
            'tr_attrs' => $sTrAttrs,
            'bx_if:show_one_line' => array(
                'condition' => $isOneLine,
                'content' => $aTmplVarsRow
            ),
            'bx_if:show_lined' => array(
                'condition' => !$isOneLine,
                'content' => $aTmplVarsRow
            ),
            'info' => $sInfoIcon,
            'error' => $sErrorIcon
        ));
    }

    function genWrapperInput($aInput, $sContent)
    {
        $aAttrs = $this->_genWrapperInputAttrs($aInput);

        $sClass = "bx-form-input-wrapper bx-form-input-wrapper-{$aInput['type']}";
        if(isset($aInput['html']) && $aInput['html'] && $this->isHtmlEditor($aInput['html'], $aInput))
            $sClass .= ' bx-form-input-wrapper-html';

        return $this->oTemplate->parseHtmlByName('form_input_wrapper.html', array(
            'attrs' =>  bx_convert_array2attrs($aAttrs, $sClass),
            'content' => $sContent
        ));
    }

    protected function _genWrapperInputAttrs(&$aInput)
    {
        return isset($aInput['attrs_wrapper']) && is_array($aInput['attrs_wrapper']) ? $aInput['attrs_wrapper'] : [];
    }

    /**
     * Generate custom row
     *
     * @param  array  $aInput
     * @param  string $sCustomMethod custom method to generate code for input
     * @return string
     */
    function genRowCustom(&$aInput, $sCustomMethod)
    {
        $sCaption = isset($aInput['caption']) ? bx_process_output($aInput['caption']) : '';

        $sRequired = !empty($aInput['required']) ? '<span class="bx-form-required">*</span>' : '';
        
        $sHelp = !empty($aInput['help']) ? ' <a href="javascript:void(0)" onclick="javascript:' . $this->getJsObjectName() . '.showHelp(this, \'' . $aInput['name'] . '\')"><i class="sys-icon question-circle"></i></a> ' : '';

        $sClassAdd = !empty($aInput['error']) ? ' bx-form-error' : '';
        $sInfoIcon = !empty($aInput['info']) ? $this->genInfoIcon($aInput['info']) : '';

        $sErrorIcon = $this->genErrorIcon(empty($aInput['error']) ? '' : $aInput['error']);
        $sInput = $this->$sCustomMethod($aInput, $sInfoIcon, $sErrorIcon);

        if (isset($aInput['name'])) {
            if (!isset($aInput['tr_attrs']) || !is_array($aInput['tr_attrs']))
                $aInput['tr_attrs'] = [];
            $aInput['tr_attrs']['id'] = "bx-form-element-" . $aInput['name'];
        }
        $sTrAttrs = bx_convert_array2attrs(empty($aInput['tr_attrs']) ? array() : $aInput['tr_attrs'], "bx-form-element-wrapper bx-def-margin-top");

        return $this->oTemplate->parseHtmlByName('form_row_custom.html', array(
            'tr_attrs' => $sTrAttrs,
            'bx_if:show_caption' => array(
                'condition' => !empty($sCaption),
                'content' => array(
                    'class_caption' => '',
                    'caption' => $sCaption,
                    'required' => $sRequired,
                    'help' => $sHelp
                )
            ),
            'class_value' => $sClassAdd,
            'value' => $sInput,
        ));
    }

    /**
     * Generate Block Headers row
     *
     * @param  array  $aInput
     * @return string
     */
    function genRowBlockHeader(&$aInput)
    {
        $aAttrs = empty($aInput['attrs']) ? '' : $aInput['attrs'];

        // if there is no caption - show divider only
        if (empty($aInput['caption']))
            return $this->{$this->_sSectionOpen}($aAttrs);

        // if section is collapsed by default, add necessary code
        $sClassAddCollapsable = 'bx-form-collapsable';
        if(isset($aInput['collapsed']) && $aInput['collapsed'])
            $sClassAddCollapsable .= ' bx-form-collapsed bx-form-section-hidden';

        // display section with caption
        if(empty($aAttrs))
            $aAttrs = ['class' => $sClassAddCollapsable];
        else
            $aAttrs['class'] .= ' ' . $sClassAddCollapsable;

        $bViewMode = !empty($this->aParams['view_mode']);

        $sCaption = bx_process_output($aInput['caption'], BX_DATA_HTML);
        $sInfo = !empty($aInput['info']) ? bx_process_output($aInput['info']) : '';
        $bInfo = !empty($sInfo);

        $sTitle = $this->oTemplate->parseHtmlByName('form_field_section_title.html', [
            'bx_if:show_view' => [
                'condition' => $bViewMode,
                'content' => [
                    'caption' => $sCaption,
                    'bx_if:show_view_info' => [
                        'condition' => $bInfo,
                        'content' => [
                            'info' => $sInfo
                        ]
                    ]
                ]
            ],
            'bx_if:show_default' => [
                'condition' => !$bViewMode,
                'content' => [
                    'caption' => $sCaption,
                    'bx_if:show_default_info' => [
                        'condition' => $bInfo,
                        'content' => [
                            'info' => $sInfo
                        ]
                    ]
                ]
            ]
        ]);

        if (isset($aInput['name'])) {
            if (!isset($aInput['tr_attrs']) || !is_array($aInput['tr_attrs']))
                $aInput['tr_attrs'] = [];

            $aInput['tr_attrs']['id'] = "bx-form-section-" . $aInput['name'];
        }

        return $this->{$this->_sSectionOpen}($aAttrs, $sTitle, !empty($aInput['tr_attrs']) ? $aInput['tr_attrs'] : []);
    }

    function genBlockEnd()
    {
        return $this->{$this->_sSectionClose}();
    }

    /**
     * Generate HTML Input Element
     *
     * @param  array  $aInput
     * @return string Output HTML Code
     */
    function genInput(&$aInput)
    {
        if (!empty($aInput['name'])) {
            $sCustomMethod = 'genCustomInput' . $this->_genMethodName($aInput['name']);
            if (method_exists($this, $sCustomMethod))
                return $this->$sCustomMethod($aInput);
        }

        switch ($aInput['type']) {

            case 'datepicker':
                if (!isset($aInput['attrs']))
                    $aInput['attrs'] = array();
                $aInput['attrs']['autosuggestion'] = 'off'; 
                
                $sInput = $this->genInputStandard($aInput);
            break;
                
            // standard inputs (and non-standard, interpreted as standard)
            case 'text':
            case 'datepicker':
            case 'dateselect':
            case 'date_time':
            case 'datetime':
            case 'number':
            case 'time':
            case 'checkbox':
            case 'radio':
            case 'image':
            case 'slider':
            case 'doublerange':
            case 'hidden':
                $sInput = $this->genInputStandard($aInput);
            break;

            case 'phone':
                $aInput['type'] = 'text';

                $sInput = $this->genInputStandard($aInput);
            break;

            case 'password':
            	$sInput = $this->genInputPassword($aInput);
            	break;
            
            case 'price':
            	$sInput = $this->genInputPrice($aInput);
            	break;

            case 'file':
            	$sInput = $this->genInputFile($aInput);
            	break;

            case 'rgb':
            case 'rgba':
            	$sClass = 'bx-form-input-' . $aInput['type'];
            	$aInput['attrs']['class'] = !empty($aInput['attrs']['class']) ? $aInput['attrs']['class'] . ' ' . $sClass : $sClass; 

            	$aInput['type'] = 'text';
                $sInput = $this->genInputStandard($aInput);
            break;
                
            case 'rgb-list':
                $sInput = $this->genInputSelectRgb($aInput);
            break;    

            case 'switcher':
                $sInput = $this->genInputSwitcher($aInput);
            break;

            case 'button':
            case 'reset':
            case 'submit':
                $sInput = $this->genInputButton($aInput);
            break;

            case 'textarea':
                $sInput = $this->genInputTextarea($aInput);
            break;

            case 'select':
                $sInput = $this->genInputSelect($aInput);
            break;

            case 'select_multiple':
                $sInput = $this->genInputSelectMultiple($aInput);
            break;

            case 'checkbox_set':
                $sInput = $this->genInputCheckboxSet($aInput);
            break;

            case 'radio_set':
                $sInput = $this->genInputRadioSet($aInput);
            break;

            case 'input_set': // numeric array of inputs
                $sInput = '';
                $sDivider = isset($aInput['dv']) ? $aInput['dv'] : ' ';
                foreach ($aInput as $iKey => $aSubInput) {
                    if (!is_int($iKey) or !$aSubInput)
                        continue; // parse only integer keys and existing values

                    $sInput .= $this->genInput($aSubInput); // recursive call
                    $sInput .= $sDivider;
                }
                $sInput .= '<div class="bx-clear"></div>';
            break;

            case 'custom':
                $sInput = isset($aInput['content']) ? $aInput['content'] : '';
            break;

            case 'captcha':
                $sInput = $this->genInputCaptcha($aInput);
            break;

            case 'location':
                $sInput = $this->genInputLocation($aInput);
            break;
            
            case 'nested_form':
                $sInput = $this->genInputNestedForm($aInput);
                break;

            case 'value':
                $sInput = '';
                if(!isset($aInput['value']))
                    break;

                $sInput = $aInput['value'];
                if(get_mb_substr($sInput, 0, 1) == '_') 
                    $sInput = _t($sInput);
            break;

            default:
                //unknown control type
                $sInput = 'Unknown control type';
        }

        // create input label
        $sInput .= $this->genLabel($aInput);

        // create input privacy group chooser
        $sInput .= $this->genPrivacyGroupChooser($aInput);

        return $sInput;
    }

    /**
     * Generate new Input Element id
     *
     * @param  array  $aInput
     * @return string
     */
    function getInputId(&$aInput)
    {
        if (isset($aInput['id']))
            return $aInput['id'];

        $sName = md5($aInput['name']);

        $sID = $this->id . '_input_' . $sName;

        if ( // multiple elements cause identical id's
            (
                (
                    $aInput['type'] == 'checkbox' and
                    substr($aInput['name'], -2) == '[]' // it is multiple element
                ) or
                $aInput['type'] == 'radio' // it is always multiple (i think so... hm)
            ) and
            isset($aInput['value']) // if we can make difference
        ) {
            $sValue = md5($aInput['value']);

            // add value
            $sID .= '_' . $sValue;
        }

        $sID = trim($sID, '_');

        $aInput['id'] = $sID; // just for repeated calls

        return $sID;
    }

    /**
     * Generate standard Input Element
     *
     * @param  array  $aInput
     * @return string
     */
    function genInputStandard(&$aInput)
    {
        $aAttrs = $this->_genInputStandardAttrs($aInput);

        $aAgent = [];
        if(!empty($this->_aAgentsFormObject) && isset($aInput['name'])) {
            foreach($this->_aAgentsFormObject as $a) {
                if($a['form_object'] == $this->_sAgentFormObject && $a['form_input'] == $aInput['name']) {
                    $aAgent = $a;
                    break;
                }
            }
        }

        $sAgentButton = '';
        if($aInput['type'] == 'text' && !empty($aAgent)) {
            $sAgentButton = $this->oTemplate->parseHtmlByName('form_field_agent_button.html', [
                'input' => 'input',
                'name' => $aInput['name'],
                'agent_id' => $aAgent['id'] ?? 0,
                'form_id' => $this->getId(),
                'html' => $aInput['html'] ?? 0,
                'popup_text' => $aInput['agent_popup_text'] ?? _t('_sys_agents_agent_form_input_popup_text'),
            ]);
        }

        return  $this->oTemplate->parseHtmlByName('form_field_standard.html', [
            'attrs' => bx_convert_array2attrs($aAttrs, "bx-def-font-inputs bx-form-input-{$aInput['type']}"),
            'agent_button' => $sAgentButton,
        ]);
    }

    protected function _genInputStandardAttrs(&$aInput)
    {
        // clone attributes for system use ;)
        $aAttrs = empty($aInput['attrs']) ? array() : $aInput['attrs'];

        // add default className to attributes
        $aAttrs['type'] = $aInput['type'];
        if ('datetime' == $aAttrs['type'])
            $aAttrs['type'] = 'date_time';

        switch($aAttrs['type']) {
            case 'datepicker':
            case 'date_time':
                $this->addCssJsTimepicker ();
                break;
            case 'slider':
            case 'doublerange':
                $this->addCssJsUi ();
                break;
            case 'dateselect':
                if(!empty($aInput['value']) && strpos($aInput['value'], ' ') !== false)
                    list($aInput['value']) = explode(' ', $aInput['value']);

                $this->_addJs(array(
                    'combodate/combodate.js',
                ), "'undefined' === typeof($.combodate)");
                break;
            case 'text':
                if (isset($aAttrs['class']) && false !== strpos($aAttrs['class'], 'bx-form-input-rgb'))
                    $this->addCssJsMinicolors ();
                break;
        }

        if ('doublerange' == $aAttrs['type'] && (!isset($aInput['value']) || !$aInput['value']) && !empty($aAttrs['min']) && !empty($aAttrs['max'])) {
            $aInput['value'] = $aAttrs['min'] . '-' . $aAttrs['max'];
        }

        if (isset($aInput['name'])) $aAttrs['name'] = $aInput['name'];
        if (isset($aInput['value'])) $aAttrs['value'] = $aInput['value'];
        if (isset($aInput['db']['pass']) && ('DateUtc' == $aInput['db']['pass'] || 'DateTimeUtc' == $aInput['db']['pass'])) $aAttrs['data-utc'] = 1;

        if (!isset($aAttrs['data-format-24h']))
            $aAttrs['data-frmt-24h'] = getParam('sys_format_input_24h');
        if (!isset($aAttrs['data-format-date']))
            $aAttrs['data-frmt-date'] = getParam('sys_format_date');
        if (!isset($aAttrs['data-format-datetime']))
            $aAttrs['data-frmt-datetime'] = getParam('sys_format_datetime');

        // for inputs with labels generate id
        if (isset($aInput['label']))
            $aAttrs['id'] = $this->getInputId($aInput);

        // for checkboxes
        if (isset($aInput['checked']) and $aInput['checked'])
            $aAttrs['checked'] = 'checked';

        return $aAttrs;
    }

    /**
     * Generate Switcher Input Element (based on checkbox)
     *
     * @param  array  $aInput
     * @return string
     */
    function genInputSwitcher(&$aInput)
    {
        $aInput['type'] = 'checkbox';
        $sCheckbox = $this->genInputStandard($aInput);

        $aInput['type'] = 'switcher';

        $sClass = 'off';
        if(isset($aInput['checked']) && $aInput['checked'])
            $sClass = 'on';

        return $this->oTemplate->parseHtmlByName('form_field_switcher.html', [
            'class' => $sClass,
            'checkbox' => $sCheckbox
        ]);
    }
    
    function genInputCheckbox(&$aInput, $bWrapped = false)
    {
        $sInput = $this->genInputStandard($aInput);

        return $bWrapped ? $this->genWrapperInput($aInput, $sInput) : $sInput;
    }

    /**
     * Generate Button Input Element
     *
     * @param  array  $aInput
     * @return string
     */
    function genInputButton(&$aInput)
    {
        $aAttrs = $this->_genInputButtonAttrs($aInput);

        $sClassAdd = "bx-def-font-inputs bx-form-input-{$aInput['type']} bx-btn";
        if($aInput['type'] == 'submit')
            $sClassAdd .= ' bx-btn-primary';

        $aTmplVarsIcon = [];
        if(isset($aInput['icon']) && ($sIcon = $this->genIcon($aInput['icon'])))
            $aTmplVarsIcon = ['icon' => $sIcon];

        return $this->oTemplate->parseHtmlByName('form_field_button.html', [
            'attrs' => bx_convert_array2attrs($aAttrs, $sClassAdd),
            'bx_if:show_icon' => [
                'condition' => !empty($aTmplVarsIcon),
                'content' => $aTmplVarsIcon
            ],
            'value' => $aInput['value']
        ]);
    }
    
    protected function _genInputButtonAttrs(&$aInput)
    {
        $aAttrs = !empty($aInput['attrs']) ? $aInput['attrs'] : [];

        // add default className to attributes
        $aAttrs['type'] = $aInput['type'];
        if(isset($aInput['value']))
            $aAttrs['value'] = $aInput['value'];

        if(isset($aInput['name'])) 
            $aAttrs['name'] = $aInput['name'];
        
        return $aAttrs;
    }

    /**
     * Generate Textarea Element
     *
     * @param  array  $aInput
     * @return string
     */
    function genInputTextarea(&$aInput)
    {
        $aAttrs = $this->_genInputTextareaAttrs($aInput);

        $sUniq = genRndPwd(10, false);
        $sClassAdd = "bx-def-font-inputs bx-form-input-{$aInput['type']}";

        $bHtml = $bHtmlEditor = false;
        if(($bHtmlEditor = ($bHtml = (bool)($aInput['html'] ?? false)) && $this->addHtmlEditor($aInput['html'], $aInput, $sUniq))) {
            $sClassAdd .= ' bx-form-input-html ' . $sUniq;
        }

        $bCode = $bCodeEditor = false;
        if(($bCodeEditor = ($bCode = (bool)($aInput['code'] ?? false)) && $this->addCodeEditor($aInput['code'], $aInput, $sUniq))) {
            $sClassAdd .= ' bx-form-input-code ' . $sUniq;
        }

        $aTmplVarsSwitcher = [];
        if(($aInput['html_toggle'] ?? false) && $bHtmlEditor && ($aHtmlEditor = $this->getHtmlEditorInfo($aInput['html'], $aInput, $sUniq))) {
            if(($sJsInit = ($aHtmlEditor['js_call_init'] ?? false)) && ($sJsDestroy = ($aHtmlEditor['js_call_destroy'] ?? false))) {
                $aInputSwitcher = [
                    'type' => 'switcher',
                    'name' => $aInput['name'] . '_switcher',
                    'checked' => true,
                    'attrs' => [
                        'onchange' => "if($(this).prop('checked')) " . $sJsInit . "; else " . $sJsDestroy . ";",
                    ],
                ];
                $aTmplVarsSwitcher = [
                    'class' => 'bx-form-input-' . $aInput['type'] . '-switcher',
                    'title' => _t('_sys_form_input_textarea_editor'),
                    'switcher' => $this->genInputSwitcher($aInputSwitcher)
                ];
            }
        }

        $sValue = isset($aInput['value']) ? bx_process_output($bHtml || $bCode ? $aInput['value'] : strip_tags($aInput['value']), BX_DATA_TEXT, ['no_process_macros']) : '';

        $aAgent = [];
        if(!empty($this->_aAgentsFormObject)) {
            foreach($this->_aAgentsFormObject as $a) {
                if($a['form_object'] == $this->_sAgentFormObject && $a['form_input'] == $aInput['name']) {
                    $aAgent = $a;
                    break;
                }
            }
        }

        $sAgentButton = '';
        if(!empty($aAgent)) {
            $sAgentButton = $this->oTemplate->parseHtmlByName('form_field_agent_button.html', [
                'input' => 'textarea',
                'name' => $aInput['name'],
                'agent_id' => $aAgent['id'] ?? 0,
                'form_id' => $this->getId(),
                'html' => $aInput['html'] ?? 0,
                'popup_text' => $aInput['agent_popup_text'] ?? _t('_sys_agents_agent_form_input_popup_text'),
            ]);
        }

        return $this->oTemplate->parseHtmlByName('form_field_textarea.html', [
            'attrs' => bx_convert_array2attrs($aAttrs, $sClassAdd),
            'value' => $sValue,
            'bx_if:show_switcher' => [
                'condition' => !empty($aTmplVarsSwitcher),
                'content' => $aTmplVarsSwitcher
            ],
            'agent_button' => $sAgentButton,
        ]);
    }

    protected function _genInputTextareaAttrs(&$aInput)
    {
        $aAttrs = !empty($aInput['attrs']) ? $aInput['attrs'] : array();

        $aAttrs['name'] = $aInput['name'];

        // for inputs with labels generate id
        if (isset($aInput['label']))
            $aAttrs['id'] = $this->getInputId($aInput);
        
        return $aAttrs;
    }

    function isHtmlEditor($iViewMode, &$aInput)
    {
        return BxDolEditor::getObjectInstance(false, $this->oTemplate) !== false;
    }

    function addHtmlEditor($iViewMode, &$aInput, $sUniq)
    {
        $oEditor = BxDolEditor::getObjectInstance(false, $this->oTemplate);
        if(!$oEditor)
            return false;

        $this->_sCodeAdd .= $oEditor->attachEditor ('#' . $this->aFormAttrs['id'] . ' [name=' . $aInput['name'] . ']', $iViewMode, $this->_bDynamicMode, [
            'form_id' => $this->aFormAttrs['id'], 
            'element_name' => $aInput['name'], 
            'query_params' => $this->getHtmlEditorQueryParams($aInput), 
            'uniq' => $sUniq
        ]);

        return true;
    }

    function getHtmlEditorInfo($iViewMode, &$aInput, $sUniq)
    {
        $oEditor = BxDolEditor::getObjectInstance(false, $this->oTemplate);
        if(!$oEditor)
            return false;

        return $oEditor->getEditorInfo('#' . $this->aFormAttrs['id'] . ' [name=' . $aInput['name'] . ']', $iViewMode, $this->_bDynamicMode, [
            'form_id' => $this->aFormAttrs['id'], 
            'element_name' => $aInput['name'], 
            'uniq' => $sUniq
        ]);
    }
    
    function addCodeEditor($iViewMode, &$aInput, $sUniq)
    {
        $this->addCssJsCodeMirror();

        return true;
    }
    
    function getHtmlEditorQueryParams($aInput)
    {
        $aQueryParams = ['i' => $aInput['name'], 'f' => $this->aFormAttrs['id'], 'fi' => ''];

        /**
         * @hooks
         * @hookdef hook-system-editor_query_params 'system', 'editor_query_params' - hook to override http(s) request's query params, which is used in HTML editor
         * - $unit_name - equals `system`
         * - $action - equals `editor_query_params`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `form` - [object] an instance of form, @see BxDolForm
         *      - `override_result` - [array] by ref, query string params, can be overridden in hook processing
         * @hook @ref hook-system-editor_query_params
         */
        bx_alert('system', 'editor_query_params', 0, 0, [
            'form' => $this,
            'override_result' => &$aQueryParams
        ]);

        return $aQueryParams;
    }

    /**
     * Generate Select Box Element
     *
     * @param  array  $aInput
     * @return string
     */
    function genInputSelectBox(&$aInput, $sInfo = '', $sError = '')
    {
        $aNewInput = $aInput;

        $aNewInput['type'] = 'select';
        $aNewInput['name'] .= '[]';

        $sInput = $this->genInput($aNewInput);
        return <<<BLAH
                <div class="bx-form-input-wrapper input-wrapper-{$aInput['type']}">
                   $sInput
                </div>
                $sInfo
                $sError
BLAH;

    }

    /**
     * Generate Browse File Element
     *
     * @param  array  $aInput
     * @return string
     */
    function genInputFile(&$aInput)
    {
    	$sOnChange = "$(this).parents('.bx-form-input-wrapper-file:first').find('.bx-fif-value').html($(this).val());";
    	if(!empty($aInput['attrs']['onchange']))
    		$aInput['attrs']['onchange'] = $sOnChange . $aInput['attrs']['onchange'];
    	else
    		$aInput['attrs']['onchange'] = $sOnChange;

    	$sInput = $this->genInputStandard($aInput);
    	return '<label class="bx-btn">' . $sInput . '<span class="bx-fif-label">' . _t('_sys_form_txt_select_file') . '</span></label><span class="bx-fif-value bx-def-margin-thd-left"></span>';
    }

    /**
     * Generate Select Box Element
     *
     * @param  array  $aInput
     * @return string
     */
    function genInputFiles(&$aInput, $sInfo = '', $sError = '')
    {
        if(empty($aInput['uploaders']) || !is_array($aInput['uploaders']))
            return '';

        $sUniqId = !empty($aInput['uploaders_id']) ? $aInput['uploaders_id'] : genRndPwd (8, false);
        $bMultiple = $aInput['multiple'] ?? true;
        $bInitGhosts = isset($aInput['init_ghosts']) && !$aInput['init_ghosts'] ? 0 : 1;
        $bInitReordering = empty($aInput['init_reordering']) ? 0 : 1;

        $oUploader = null;
        $sUploadersButtons = $sUploadersJs = '';
        foreach ($aInput['uploaders'] as $sUploaderObject) {
            $oUploader = BxDolUploader::getObjectInstance($sUploaderObject, $aInput['storage_object'], $sUniqId, $this->oTemplate);
            if(!$oUploader)
                continue;

            $oUploader->setMultiple($bMultiple);

            //--- Get Button code.
            $aAttrs = !empty($aInput['attrs']) ? $aInput['attrs'] : array();
            if(empty($aInput['attrs']['disabled']))
                $aAttrs = array_merge($aAttrs, array('onclick' => $oUploader->getNameJsInstanceUploader() . '.showUploaderForm();'));

            $aParamsButtons = [
                'content_id' => isset($aInput['content_id']) ? $aInput['content_id'] : '',
                'storage_private' => isset($aInput['storage_private']) ? $aInput['storage_private'] : '1',
                'attrs' => bx_convert_array2attrs($aAttrs),
                'btn_class' => !empty($aInput['attrs']['disabled']) ? 'bx-btn-disabled' : '',
                'button_title' => bx_js_string($oUploader->getUploaderButtonTitle(isset($aInput['upload_buttons_titles']) ? $aInput['upload_buttons_titles'] : false)),
            ];

            $sUploadersButtons .= $oUploader->getUploaderButton($aParamsButtons);

            //--- Get JS code.
            $sGhostTemplate = $this->genGhostTemplate($aInput);

            $aParamsJs = array_merge($oUploader->getUploaderJsParams(), 
                [
                    'content_id' => isset($aInput['content_id']) ? $aInput['content_id'] : '',
                    'storage_private' => isset($aInput['storage_private']) ? $aInput['storage_private'] : '1',
                    'is_init_ghosts' => $bInitGhosts,
                    'is_init_reordering' => $bInitReordering
                ]
            );
            if(isset($aInput['images_transcoder']) && $aInput['images_transcoder'])
                $aParamsJs['images_transcoder'] = bx_js_string($aInput['images_transcoder']);

            $sUploadersJs .= $oUploader->getUploaderJs($sGhostTemplate, $bMultiple, $aParamsJs, $this->_bDynamicMode);
        }

        if(!$oUploader)
            return '';

        if($bInitReordering) {
            $this->addCssJsUi();
            $this->addCssJsUiSortable();
        }

        return $this->oTemplate->parseHtmlByName('form_field_uploader.html', array(
            'uploaders_buttons' => $sUploadersButtons,
            'info' => $sInfo,
            'error' => $sError,
            'id_container_errors' => $oUploader ? $oUploader->getIdContainerErrors() : '',
            'id_container_result' => $oUploader ? $oUploader->getIdContainerResult() : '',
            'uploader_instance_name' => $oUploader ? $oUploader->getNameJsInstanceUploader() : '',
            'uploaders_js' => $sUploadersJs,
        ));
    }

    protected function genGhostTemplate(&$aInput)
    {
        $sGhostTemplate = false;
        if (isset($aInput['ghost_template']) && is_object($aInput['ghost_template'])) { // form is not submitted and ghost template is BxDolFormNested object

            $oFormNested = $aInput['ghost_template'];
            if ($oFormNested instanceof BxDolFormNestedGhost)
                $sGhostTemplate = $oFormNested->genForm();

        } elseif (isset($aInput['ghost_template']) && is_array($aInput['ghost_template']) && isset($aInput['ghost_template']['inputs'])) { // form is not submitted and ghost template is form array

            $oFormNested = new BxDolFormNestedGhost($aInput['name'], $aInput['ghost_template'], $this->aParams['db']['submit_name'], $this->oTemplate);
            $sGhostTemplate = $oFormNested->getCode();

        } elseif (isset($aInput['ghost_template']) && is_array($aInput['ghost_template']) && $aInput['ghost_template']) { // form is submitted and ghost template is array of BxDolFormNested objects

            $sGhostTemplate = array ();
            foreach ($aInput['ghost_template'] as $iFileId => $oFormNested)
                if (is_object($oFormNested) && $oFormNested instanceof BxDolFormNestedGhost)
                    $sGhostTemplate[$iFileId] = $oFormNested->genForm();

        } elseif (isset($aInput['ghost_template']) && is_string($aInput['ghost_template'])) { // ghost template is just string template, without nested form

            $sGhostTemplate = $aInput['ghost_template'];

        }

        return $sGhostTemplate;
    }

    protected function genCustomInputUsernamesSuggestions ($aInput)
    {
        $bDisabled = isset($aInput['attrs']['disabled']) && $aInput['attrs']['disabled'] == 'disabled';

        $aAttrs = $this->_genCustomInputUsernamesSuggestionsAttrs($aInput, $bDisabled);

        $aTmplVarsVals = [];
        $sValue = '';
        if(!empty($aInput['value'])) {
            $sCustomMethod = 'genCustomInput' . $this->_genMethodName($aInput['name']) . 'Value';
            if(method_exists($this, $sCustomMethod))
                $aTmplVarsVals = $this->$sCustomMethod($aInput);
            else if(is_array($aInput['value']) || (is_numeric($aInput['value']))) {
                if (!is_array($aInput['value']))
                    $aInput['value'] = [$aInput['value']];
                    
                foreach($aInput['value'] as $sVal) {
                    if(!$sVal || !($oProfile = BxDolProfile::getInstance($sVal)))
                        continue;

                   $aTmplVarsVals[] = [
                       'item_unit' => $oProfile->getUnit(0, ['template' => ['name' => 'unit_wo_info', 'size' => 'icon']]),
                       'item_name' => $oProfile->getDisplayName(),
                       'name' => $aInput['name'] . (isset($aInput['custom']['only_once']) && $aInput['custom']['only_once'] == 1 ? '' : '[]'),
                       'value' => $sVal
                   ];
                }
            }
            else if(is_string($aInput['value']))
                $sValue = $aInput['value'];
        }

        $aTmplVarsInputText = [];
        if(!$bDisabled) {
            $aInputText = $aInput;
            $aInputText['type'] = 'text';
            $aInputText['value'] = '';
            $aInputText['attrs'] = $this->_genCustomInputUsernamesSuggestionsTextAttrs($aInputText, $bDisabled);       
            unset($aInputText['name']);

            $aTmplVarsInputText['input'] = $this->genInputStandard($aInputText);
        }

       if (bx_is_api()){
           $aInput['type'] = 'initial_members';
           return $aInput;
       }
        
        $this->addCssJsUi();

        $sJsCode = '';
        if(!$bDisabled) {
            $sJsCode = $this->oTemplate->parseHtmlByName('form_field_custom_suggestions_js.html', [
                'id' => $aAttrs['id'],
                'name' => $aInput['name'],
                'url_get_recipients' => $aInput['ajax_get_suggestions'],
                'b_img' => isset($aInput['custom']['b_img']) ? (int)$aInput['custom']['b_img'] : 1,
                'only_once' => isset($aInput['custom']['only_once']) ? 1 : 0,
                'on_select' => isset($aInput['custom']['on_select']) ? $aInput['custom']['on_select']: 'null',
                'placeholder' => bx_html_attribute(isset($aInput['placeholder']) ? $aInput['placeholder'] : _t('_sys_form_paceholder_profiles_suggestions'), BX_ESCAPE_STR_QUOTE),
            ]);

            if($this->_bDynamicMode)
                $sJsCode = $this->oTemplate->addJsPreloadedWrapped([
                    'jquery-ui/jquery-ui.min.js'
                ], $sJsCode);
            else 
                $sJsCode = $this->oTemplate->addJsCodeOnLoadWrapped($sJsCode);
        }       

        return $this->oTemplate->parseHtmlByName('form_field_custom_suggestions.html', array(
            'name' => $aInput['name'],
            'attrs' => bx_convert_array2attrs($aAttrs),
            'bx_repeat:vals' => $aTmplVarsVals,
            'value' => $sValue,
            'bx_if:input' => array(
                'condition' => !$bDisabled,
                'content' => $aTmplVarsInputText
            ),
            'js_code' => $sJsCode
        ));
    }

    protected function _genCustomInputUsernamesSuggestionsAttrs (&$aInput, $bDisabled = false)
    {
        $aAttrs = ['id' => $aInput['name'] . time() . mt_rand(0, 100)];

        $aAttrs['class'] = 'bx-form-input-autotoken bx-form-input-text bx-def-font-inputs';
        if($bDisabled)
            $aAttrs['class'] .= ' bx-form-input-disabled';
        if(!empty($aInput['attrs']['class']))
            $aAttrs['class'] .= ' ' . $aInput['attrs']['class'];

        return $aAttrs;
    }

    protected function _genCustomInputUsernamesSuggestionsTextAttrs (&$aInput, $bDisabled = false)
    {
        $aAttrs = ['value' => '', 'autocomplete' => 'off', 'autocapitalize' => 'off', 'autocorrect' => 'off'];

        if(!empty($aInput['attrs']) && is_array($aInput['attrs'])) {
            if(isset($aInput['attrs']['class']))
                unset($aInput['attrs']['class']);

            $aAttrs = array_merge($aAttrs, $aInput['attrs']);
        }

        return $aAttrs;
    }

    protected function genCustomViewRowValueLabels ($aInput)
    {        
        if (empty($aInput['value']) || !($oMetatags = BxDolMetatags::getObjectInstance($aInput['meta_object'])) || !$oMetatags->keywordsIsEnabled())
            return null;
        
        if (!empty($aInput['value']) && !is_array($aInput['value']))
            $aInput['value'] = unserialize($aInput['value']);
        
        $s = ''; 
        foreach ($aInput['value'] as $sLabel)
            $s .= '<a href="' . $oMetatags->keywordsGetHashTagUrl($sLabel, $aInput['content_id']) . '"><b class="bx-def-label val">' . trim($sLabel) . '</b></a>';

        return $this->oTemplate->parseHtmlByName('form_field_labels_view.html', array(
            'values' => $s,
        ));
    }

    protected function genCustomInputLabels (&$aInput)
    {
        $oLabel = BxDolLabel::getInstance();

        $sName = !empty($aInput['name']) ? $aInput['name'] : 'labels';

        $sValue = '';
        if(!empty($aInput['value'])) {
            if(!is_array($aInput['value']))
                $aInput['value'] = unserialize($aInput['value']);

            if(is_array($aInput['value']))
                foreach($aInput['value'] as $sLabel)
                    $sValue .= $oLabel->getLabel($sName, $sLabel);
        }

        $sKeyPlaceholder = $aInput['caption_src'] . '_placeholder';
        if(strcmp($sKeyPlaceholder, _t($sKeyPlaceholder)) != 0)
            $sValue .= $oLabel->getLabelPlaceholder($sKeyPlaceholder);                   

        $aInputLabels = array(
            'type' => 'custom',
            'name' => $sName,
            'caption' => '',
            'value' => $sValue,
            'ajax_get_suggestions' => BX_DOL_URL_ROOT . bx_append_url_params('label.php', array(
                'action' => 'labels_list',
            )),
            'attrs' => array(
                'class' => 'bx-form-input-labels',
                'disabled' => 'disabled'
            )
        );

        if (bx_is_api()) {
            return array_merge($aInput, [
                'type' => 'labels',
                'values' => bx_srv('system', 'get_labels', [], 'TemplLabelsServices')
            ]);
        }

        return $this->oTemplate->parseHtmlByName('label_select_field.html', array(
            'js_object' => $oLabel->getJsObjectName(),
            'js_code' => $oLabel->getJsCodeForm(),
            'html_id' => $oLabel->getFormFieldId($aInput),
            'name' => $sName,
            'input_labels' => $this->genCustomInputUsernamesSuggestions($aInputLabels)
        ));
    }

    /**
     * Generate Select Element	
     *
     * @param  array  $aInput
     * @return string
     */
    function genInputSelect(&$aInput)
    {
        $sCurValue = isset($aInput['value']) ? $aInput['value'] : '';
        return $this->_genInputSelect($aInput, false, $sCurValue, '_isSelected');
    }
    
    /**
     * Generate Select RGB Element	
     *
     * @param  array  $aInput
     * @return string
     */
    function genInputSelectRgb(&$aInput)
    {
        $aInput['type'] = 'select';
        
        $sCurValue = isset($aInput['value']) ? $aInput['value'] : '';
        
        $aInput['values_list_name'] = 'sys_colors';
        $aInput['values'] = self::getDataItems('sys_colors', isset(self::$TYPES_SET[$aInput['type']]));
        $aInput['attrs'] = ['class' => 'bx-form-input-rgb-list'];
        
        foreach ($aInput['values'] as $sOptValue => $sOptTitle) {
            $aInput['values'][$sOptValue] = ['key' => $sOptValue, 'value' => $sOptTitle, 'class' => 'bg-' . $sOptValue, 'style' => 'color:#fff'];
        }

        return $this->_genInputSelect($aInput, false, $sCurValue, '_isSelected');
    }

    /**
     * Generate Multiple Select Element
     *
     * @param  array  $aInput
     * @return string
     */
    function genInputSelectMultiple(&$aInput)
    {
        $aCurValues = array();
        if (isset($aInput['value']) && $aInput['value'])
            $aCurValues = is_array($aInput['value']) ? $aInput['value'] : array();
        return $this->_genInputSelect($aInput, true, $aCurValues, '_isSelectedMultiple');
    }

    /**
     * Generate Checkbox Set Element
     *
     * @param  array  $aInput
     * @return string
     */
    function genInputCheckboxSet(&$aInput)
    {
        $aCurValues = array();
        if (isset($aInput['value']) && $aInput['value'])
            $aCurValues = is_array($aInput['value']) ? $aInput['value'] : array();
        return $this->_genInputsSet($aInput, 'checkbox', $aCurValues, '_isSelectedMultiple', '[]');
    }
    /**
     * Generate Radiobuttons Set Element
     *
     * @param  array  $aInput
     * @return string
     */
    function genInputRadioSet(&$aInput)
    {
        $sCurValue = isset($aInput['value']) ? $aInput['value'] : '';
        return $this->_genInputsSet($aInput, 'radio', $sCurValue, '_isSelected');
    }

    function _isSelected ($sValue, $sCurValue)
    {
        return ((string)$sValue === (string)$sCurValue);
    }

    function _isSelectedMultiple ($sValue, $aCurValues)
    {
        return in_array($sValue, $aCurValues);
    }

    function _genInputSelect(&$aInput, $isMultiple, $mixedCurrentVal, $sIsSelectedFunc)
    {
        $aOptions = [];
        if(isset($aInput['values']) && is_array($aInput['values'])) {
            foreach ($aInput['values'] as $sOptValue => $sOptTitle) {
                $aOption = array(
                    'bx_if:show_option_group_begin' => [
                        'condition' => false,
                        'content' => []
                    ],
                    'bx_if:show_option_group_end' => [
                        'condition' => false,
                        'content' => []
                    ],
                    'bx_if:show_option' => [
                        'condition' => false,
                        'content' => []
                    ]
                );

                $sOptAttrs = "";
                if(is_array($sOptTitle)) {
                    if(isset($sOptTitle['type'])) {
                        switch($sOptTitle['type']) {
                            case 'group_header':
                                $aOption = array_merge($aOption, [
                                    'bx_if:show_option_group_begin' => [
                                        'condition' => true,
                                        'content' => [
                                            'opt_label' => bx_process_output($sOptTitle['value'])
                                        ]
                                    ]
                                ]);
                                $aOptions[] = $aOption;
                                break;

                            case 'group_end':
                                $aOption = array_merge($aOption, [
                                    'bx_if:show_option_group_end' => [
                                        'condition' => true,
                                        'content' => []
                                    ]
                                ]);
                                $aOptions[] = $aOption;
                                break;
                        }

                        continue;
                    }

                    $aOptAttrs = $this->_genInputSelectOptionAttrs($sOptTitle);
                    if(!empty($aOptAttrs))
                        $sOptAttrs = bx_convert_array2attrs($aOptAttrs);

                    $sOptValue = $sOptTitle['key'];
                    $sOptTitle = $sOptTitle['value'];
                }

                $aOption = array_merge($aOption, [
                    'bx_if:show_option' => [
                        'condition' => true,
                        'content' => [
                            'opt_title' => bx_process_output($sOptTitle),
                            'opt_value' => !empty($sOptValue) ? bx_html_attribute($sOptValue) : '',
                            'opt_attrs' => $sOptAttrs,
                            'bx_if:show_selected' => [
                                'condition' => $this->$sIsSelectedFunc($sOptValue, $mixedCurrentVal),
                                'content' => []
                            ]
                        ]
                    ]
                ]);

                $aOptions[] = $aOption;
            }
        }

        $aAttrs = $this->_genInputSelectAttrs($aInput, $isMultiple);

        return $this->_parseInputSelect('form_field_select.html', [
            'attrs' => bx_convert_array2attrs($aAttrs, "bx-def-font-inputs bx-form-input-{$aInput['type']}"),
            'bx_repeat:options' => $aOptions,
            'content' => !empty($aInput['content']) ? $aInput['content'] : ''
        ]);
    }

    protected function _genInputSelectAttrs(&$aInput, $isMultiple)
    {
        $aAttrs = !empty($aInput['attrs']) ? $aInput['attrs'] : [];

        $aAttrs['name'] = $aInput['name'];
        if ($isMultiple) {
            $aAttrs['name'] .= '[]';
            $aAttrs['multiple'] = 'multiple';
        }

        // for inputs with labels generate id
        if (isset($aInput['label']))
            $aAttrs['id'] = $this->getInputId($aInput);
        
        return $aAttrs;
    }

    protected function _genInputSelectOptionAttrs(&$aOption)
    {
        $aAttrs = [];
        if(!empty($aOption['attrs']) && is_array($aOption['attrs']))
            $aAttrs = $aOption['attrs'];

        if(isset($aOption['class']))
            $aAttrs['class'] = !empty($aAttrs['class']) ? $aAttrs['class'] . ' ' . $aOption['class'] : $aOption['class'];

        if(isset($aOption['style']))
            $aAttrs['style'] = !empty($aAttrs['style']) ? $aAttrs['style'] . ' ' . $aOption['style'] : $aOption['style'];
        
        return $aAttrs;
    }

    protected function _parseInputSelect($sTmplName, $aTmplVars)
    {
        return $this->oTemplate->parseHtmlByName($sTmplName, $aTmplVars);
    }

    function _genInputsSet(&$aInput, $sType, $mixedCurrentVal, $sIsCheckedFunc, $sNameAppend = '')
    {
        $aAttrs = empty($aInput['attrs']) || 'radio_set' == $aInput['type'] || 'checkbox_set' == $aInput['type'] ? array() : $aInput['attrs'];

        $aAttrs['name']  = $aInput['name'];

        // for inputs with labels generate id
        if (isset($aInput['label']))
            $aAttrs['id'] = $this->getInputId($aInput);

        $sAttrs = bx_convert_array2attrs($aAttrs, "bx-form-input-{$aInput['type']}");

        // generate options
        $sDivider = isset($aInput['dv']) ? $aInput['dv'] : $this->_sDivider;
        $iDividerThreshold = !empty($aInput['dv_thd']) ? (int)$aInput['dv_thd'] : 3;

        $sOptions = '';

        $aAdditionalFieldInfo = [];
        if (in_array($aInput['type'], ['radio_set', 'checkbox_set']) && !empty($aInput['values_list_name']))
            $aAdditionalFieldInfo = BxDolFormQuery::getDataItems($aInput['values_list_name'], false, BX_DATA_VALUES_ALL);

        if (isset($aInput['values']) && is_array($aInput['values'])) {
            if (count($aInput['values']) > $iDividerThreshold && $sDivider == $this->_sDivider)
                $sDivider = $this->_sDividerAlt;

            // generate complex input using simple standard inputs
            foreach ($aInput['values'] as $sValue => $sLabel) {
                if(is_array($sLabel)) {
                    $sValue = $sLabel['key'];
                    $sLabel = $sLabel['value'];
                }

                // create new simple input
                $aNewInput = array(
                    'type'    => $sType,
                    'name'    => $aInput['name'] . $sNameAppend,
                    'value'   => $sValue,
                    'checked' => $this->$sIsCheckedFunc($sValue, $mixedCurrentVal),
                    'label'   => $sLabel,
                    'attrs'   => !empty($aInput['attrs']) && ('radio_set' == $aInput['type'] || 'checkbox_set' == $aInput['type']) ? $aInput['attrs'] : false,
                );
                
                if (isset($aInput['label_as_html']))
                    $aNewInput['label_as_html'] = $aInput['label_as_html'];

                $sNewInput = $this->genInputCheckbox($aNewInput, true) . $this->genLabel($aNewInput);

                // add additional info for the field
                if (isset($aAdditionalFieldInfo[$sValue]) && !empty($aAdditionalFieldInfo[$sValue]['LKey2']))
                    $sNewInput = $this->genFiledItemInfoWrapper($sNewInput, _t($aAdditionalFieldInfo[$sValue]['LKey2']));

                // attach new input to complex
                $sOptions .= ($sNewInput . $sDivider);
            }
        }

        // generate element
        $sCode = <<<BLAH
            <div $sAttrs>
                $sOptions
            </div>
BLAH;

        return $sCode;
    }

    function genInputLocation(&$aInput)
    {
        $o = BxDolLocationField::getObjectInstance(getParam('sys_location_field_default'));
        if (!$o)
            return _t('_sys_txt_error_occured');

        return $o->genInputLocation($aInput, $this);
    }
    
    public function setLocationVals ($aInput, $aVals)
    {
        $o = BxDolLocationField::getObjectInstance(getParam('sys_location_field_default'));
        if (!$o)
            return false;

        return $o->setLocationVals ($aInput, $aVals, $this);
    }

    public function setLocationVal ($aInput, $sIndex, $sVal)
    {
        $o = BxDolLocationField::getObjectInstance(getParam('sys_location_field_default'));
        if (!$o)
            return false;

        return $o->setLocationVal ($aInput, $sIndex, $sVal, $this);
    }

    protected function getLocationVal ($aInput, $sIndex)
    {
        $o = BxDolLocationField::getObjectInstance(getParam('sys_location_field_default'));
        if (!$o)
            return false;

        return $o->getLocationVal ($aInput, $sIndex, $this);
    }

    function genInputPassword(&$aInput)
    {
        return $this->oTemplate->parseHtmlByName('form_field_password.html', array('input' => $this->genInputStandard($aInput)));
    }

    function genInputPrice(&$aInput)
    {
        $sCurrency = '';
        if(!isset($aInput['value_currency'])) {
            $sCurrency = BxDolPayments::getInstance()->getOption('default_currency_code');
            if(empty($sCurrency))
                $sCurrency = getParam('currency_code');
        }
        else
            $sCurrency = $aInput['value_currency'];

        return $this->oTemplate->parseHtmlByName('form_field_price.html', array(
            'bx_if:show_currency' => [
                'condition' => !empty($sCurrency),
                'content' => [
                    'currency' => $sCurrency,
                ]
            ],
            'input' => $this->genInputStandard($aInput)
        ));
    }

    function genInputNestedForm(&$aInput)
    {
        return '';
    }
    
    function genNestedForm(&$aInput)
    {
        return '';
    }
    
    
    function genInputCaptcha(&$aInput)
    {
        $aAttrs = empty($aInput['attrs']) ? array() : $aInput['attrs'];

        // for inputs with labels generate id
        if (isset($aInput['label']))
            $aAttrs['id'] = $this->getInputId($aInput);

        $sAttrs = bx_convert_array2attrs($aAttrs, "bx-form-input-{$aInput['type']}");

        $oCaptcha = BxDolCaptcha::getObjectInstance();

        return "<div $sAttrs>" . ($oCaptcha ? $oCaptcha->display($this->_bDynamicMode) : _t('_sys_txt_captcha_not_available')) . "</div>";
    }

    /**
     * Generate Label Element
     *
     * @param  string $aInput   input array
     * @return string HTML code
     */
    function genLabel(&$aInput)
    {
        if (!isset($aInput['label']) || empty($aInput['label']))
            return '';

        $sInputID = $this->getInputId($aInput);
        
        $sLabel = bx_process_output($aInput['label']);
        if (isset($aInput['label_as_html']) && $aInput['label_as_html'] == true)
            $sLabel = $aInput['label'];
        
        return '<label for="' . $sInputID . '">' . $sLabel . '</label>';
    }

    function genPrivacyGroupChooser(&$aInput, $sPrivacyObject = '')
    {
        if(!isset($aInput['privacy']) || empty($aInput['privacy']))
            return '';

        $iAuthorId = bx_get_logged_profile_id();
        $mixedResult = checkActionModule($iAuthorId, 'set form fields privacy', 'system');
        if($mixedResult[CHECK_ACTION_RESULT] !== CHECK_ACTION_RESULT_ALLOWED)
            return '';

        if(empty($sPrivacyObject))
            $sPrivacyObject = $this->_sPrivacyObjectView;

        $iInputId = (int)$aInput['id'];
        $mixedPrivacyGroup = $this->_getPrivacyGroup($sPrivacyObject, $iInputId, $iAuthorId);

        if(!isset($aInput['attrs_wrapper']['class']))
            $aInput['attrs_wrapper']['class'] = '';
        $aInput['attrs_wrapper']['class'] .= ' bx-form-input-wrapper-pgc';

        return $this->oTemplate->parseHtmlByName('form_field_privacy.html', array(
            'js_object' => $this->getJsObjectName(),
            'html_id' => $this->_aHtmlIds['pgc'] . $iInputId,
            'id' => $iInputId,
            'privacy_object' => $sPrivacyObject,
            'icon' => $this->_getPrivacyIcon($mixedPrivacyGroup)
        ));
    }

    function genFiledItemInfoWrapper($sInput, $sInfoValue)
    {
        $sInfo = $this->genInfoIcon($sInfoValue) ;
        return $this->oTemplate->parseHtmlByName('form_field_option_info.html', [
            'input' => $sInput,
            'info' => $sInfo
        ]);
    }

    function genIcon($sIcon)
    {
        if(!$sIcon)
            return '';

        list ($sIcon, $sIconUrl, $sIconA, $sIconHtml) = BxTemplFunctions::getInstanceWithTemplate($this->oTemplate)->getIcon($sIcon);

        return $this->oTemplate->parseHtmlByName('form_input_icon.html', [
            'bx_if:icon' => [
                'condition' => (bool)$sIcon,
                'content' => ['icon' => $sIcon],
            ],
            'bx_if:icon-html' => [
                'condition' => (bool)$sIconHtml,
                'content' => ['icon' => $sIconHtml],
            ],
            'bx_if:image_inline' => [
                'condition' => false,
                'content' => ['image' => ''],
            ]
        ]);
    }

    function genInfoIcon($sInfo)
    {
        return '<div class="bx-form-info bx-def-font-grayed bx-def-font-small mt-1">' . bx_process_output($sInfo, BX_DATA_HTML) . '</div>';
    }

    function genErrorIcon( $sError = '' )
    {
        if ($this->bEnableErrorIcon) {
            $sStyle = '';
            if (!$sError)
                $sStyle = 'style="display:none;"';
            return '<div class="bx-form-warn" ' . $sStyle . '>' . $sError . '</div>';
        }
    }

    function getOpenSection($aAttrs = [], $sTitle = '', $aWrapperAttrs = [])
    {
        $sClose = '';
        if($this->_isSectionOpened)
            $sClose = $this->{$this->_sSectionClose}();

        $sWrapperAttrs = bx_convert_array2attrs($aWrapperAttrs, "bx-form-section-wrapper my-4");
            
        if(!$aAttrs || !is_array($aAttrs))
            $aAttrs = [];

        $sAttrs = bx_convert_array2attrs($aAttrs, "bx-form-section bx-form-section-" . ($sTitle ? "header" : "divider"));

        $this->_isSectionOpened = true;
        return $sClose . "<!-- form header content begins -->\n <div $sWrapperAttrs> <div $sAttrs> $sTitle <div class=\"bx-form-section-content pt-4 pb-6" . ($sTitle ? ' px-6' : '') . "\">\n";
    }

    function getCloseSection()
    {
        if(!$this->_isSectionOpened)
            return '';

        $this->_isSectionOpened = false;
        return "</div> </div> </div> \n<!-- form header content ends -->\n";
    }

    function getOpenSectionViewMode($aAttrs = array(), $sTitle = '', $aWrapperAttrs = [])
    {
        if (!$this->_isSectionOpened) {

            if (!$aAttrs || !is_array($aAttrs))
                $aAttrs = array();

            if ($sTitle)
                $sClassesAdd = "bx-form-section-header";
            else
                $sClassesAdd = "bx-form-section-divider";

            $sAttrs = bx_convert_array2attrs($aAttrs, "bx-form-section bx-form-view-section bx-def-padding-sec-top bx-def-border-top " . $sClassesAdd);

            $sWrapperAttrs = bx_convert_array2attrs($aWrapperAttrs, "bx-form-section-wrapper bx-def-margin-top");

            $this->_isSectionOpened = true;

            return "<!-- form header content begins -->\n <div $sWrapperAttrs> <div $sAttrs> $sTitle <div class=\"bx-form-section-content bx-def-padding-top\">\n";

        } else {

            return '';
        }
    }

    function getCloseSectionViewMode()
    {
        if ($this->_isSectionOpened) {

            $this->_isSectionOpened = false;
            return "</div> </div> </div> \n<!-- form header content ends -->\n";

        } else {

            return '';
        }
    }

    public static function getJsCalendarLangs ()
    {
        return array ('ar-dz' => 1, 'ar' => 1, 'at' => 1, 'az' => 1, 'be' => 1, 'bg' => 1, 'bn' => 1, 'bs' => 1, 'cat' => 1, 'ckb' => 1, 'cs' => 1, 'cy' => 1, 'da' => 1, 'de' => 1, 'default' => 1, 'eo' => 1, 'es' => 1, 'et' => 1, 'fa' => 1, 'fi' => 1, 'fo' => 1, 'fr' => 1, 'ga' => 1, 'gr' => 1, 'he' => 1, 'hi' => 1, 'hr' => 1, 'hu' => 1, 'hy' => 1, 'id' => 1, 'index' => 1, 'is' => 1, 'it' => 1, 'ja' => 1, 'ka' => 1, 'km' => 1, 'ko' => 1, 'kz' => 1, 'lt' => 1, 'lv' => 1, 'mk' => 1, 'mn' => 1, 'ms' => 1, 'my' => 1, 'nl' => 1, 'nn' => 1, 'no' => 1, 'pa' => 1, 'pl' => 1, 'pt' => 1, 'ro' => 1, 'ru' => 1, 'si' => 1, 'sk' => 1, 'sl' => 1, 'sq' => 1, 'sr-cyr' => 1, 'sr' => 1, 'sv' => 1, 'th' => 1, 'tr' => 1, 'uk' => 1, 'uz' => 1, 'uz_latn' => 1, 'vn' => 1, 'zh-tw' => 1, 'zh' => 1);
    }
    
    public static function getCssJsCalendar()
    {
        $aLangs = self::getJsCalendarLangs();
        $sLang = BxDolLanguages::getInstance()->detectLanguageFromArray($aLangs);

        return [[
                BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'flatpickr/dist/|flatpickr.min.css'
            ], [
                'flatpickr/dist/flatpickr.min.js',
                'flatpickr/dist/l10n/' . $sLang . '.js',
            ]
        ];
    }
    
    function addCssJsUi ()
    {
        if (self::$_isCssJsUiAdded)
            return;

        $this->_addJs(array(
            'jquery-ui/jquery-ui.min.js',
        ), "'undefined' === typeof(jQuery.ui.position)");
        
        $this->_addCss('jquery-ui/jquery-ui.min.css');

        self::$_isCssJsUiAdded = true;
    }
    
    function addCssJsUiSortable ()
    {
        if (self::$_isCssJsUiSortableAdded)
            return;

        $this->_addJs(array(
            'jquery-ui/jquery-ui.min.js'
        ), "'undefined' === typeof(jQuery.ui.position)");

        self::$_isCssJsUiSortableAdded = true;
    }

    function addCssJsTimepicker ()
    {
        if (self::$_isCssJsTimepickerAdded)
            return; 

        list($aCss, $aJs) = self::getCssJsCalendar();

        $this->_addCss($aCss);
        $this->_addJs($aJs, "'undefined' === typeof(flatpickr)");        

        self::$_isCssJsTimepickerAdded = true;
    }

    function addCssJsMinicolors ()
    {
        if (self::$_isCssJsMinicolorsAdded)
            return;       

        $this->_addCss(BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'jquery-minicolors/|jquery.minicolors.css');
        $this->_addJs('jquery-minicolors/jquery.minicolors.min.js', "'undefined' === typeof($.minicolors)");

        self::$_isCssJsMinicolorsAdded = true;
    }

    function addCssJsCodeMirror ()
    {
        if (self::$_isCssJsCodeMirrorAdded)
            return;       

        $this->_addCss([BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'codemirror/|codemirror.css']);
        $this->_addJs(['codemirror/codemirror-ext.min.js'], "'undefined' === typeof(CodeMirror)");

        self::$_isCssJsCodeMirrorAdded = true;
    }

    function addCssJsViewMode ()
    {
        if (self::$_isCssJsAddedViewMode)
            return;

        $this->_addCss('forms.css');

        self::$_isCssJsAddedViewMode = true;
    }

    function addCssJsCore ()
    {
        if (self::$_isCssJsAdded)
            return;

        $this->_addCss('forms.css');
        $this->_addJs('jquery.webForms.js', "'undefined' === typeof($.fn.addWebForms)");
        $this->_addJs(array('BxDolForm.js', 'BxDolNestedForm.js'), "true");

        self::$_isCssJsAdded = true;
    }

    function addCssJs ()
    {
        if (isset($this->aParams['view_mode']) && $this->aParams['view_mode']) {

            $this->addCssJsViewMode ();

        } else { 

            $this->addCssJsCore();            
        }
    }

    protected function _processCssJs()
    {
        $sRet = '';
        if ($this->_bDynamicMode) {
            $sRet .= $this->oTemplate->addCss($this->_aCss, true);


            $sRet .= "\n<script>\n";
            $sRet .= "\nglJsLoadOnaddWebForms = [];\n";
            foreach ($this->_aJs as $sCondition => $aJs) {
                $sJs = $this->oTemplate->addJs($aJs, true);
                if (!$sJs)
                    continue;
                
                $sRet .= "if ($sCondition)\n";
                if (preg_match_all("/src=\"(.*?)\"/", $sJs, $aMatches))
                    $sRet .= "\tglJsLoadOnaddWebForms = glJsLoadOnaddWebForms.concat(" . json_encode($aMatches[1]) . ");\n";
            }
            $sRet .= "\n</script>\n";
        }
        else {
            $this->oTemplate->addCss($this->_aCss);
            
            $aJs = array();
            foreach ($this->_aJs as $sCondition => $a)
                $aJs = array_merge($aJs, $a);
            $this->oTemplate->addJs($aJs);
        }
        return $sRet;
    }

    protected function _addJs($mixed, $sJsCondition)
    {
        if (!is_array($mixed))
            $mixed = array($mixed);
        $this->_aJs[$sJsCondition] = $mixed;
    }

    protected function _addCss($mixed)
    {
        if (!is_array($mixed))
            $mixed = array($mixed);
        foreach ($mixed as $s)
            $this->_aCss[$s] = $s;
    }
}

/** @} */
