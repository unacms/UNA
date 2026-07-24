<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * WIKI object.
 *
 * It's possble to create different WIKI object which will different URLs, Menus and permissions.
 * For example it's possible to create 
 * http://example.com/wiki/somepageshere and http://example.com/docs/anotherpageshere
 *
 * @section wiki_create Creating the WIKI object:
 *
 *
 * Add record to 'sys_objects_wiki' table:
 *
 * - object: name of the WIKI object, this name will be user in URL as well, 
 *          for example, 'wiki' will have URLs like this: http://example.com/wiki/somepageshere
 * - uri: wiki module URI
 * - title: title of the WIKI, for example, documentation, help, tutorial
 * - module: module name WIKI object belongs to
 * - override_class_name: user defined class name 
 * - override_class_file: the location of the user defined class, leave it empty if class is located in system folders.
 *
 * Add record to 'sys_rewrite_rules' table:
 * - preg - regular expression which matches some URL
 * - service - service method to call if abbe regular expression matches
 * - active - active flag
 *
 * Add record to 'sys_permalinks' table:
 * - standard - how link should look like when permalinks are off
 * - permalink - how link should look like when permalinks are on, 
 *      some special server configuration may be required to make permalink to work, 
 *      such as 'mod_rewrite' and .htaccess file for Apache
 * - check - option name which enables/disables permalinks
 * - compare_by_prefix - compare by prefix
 */
class BxDolWiki extends BxDolFactory implements iBxDolFactoryObject
{
    protected $_bIsApi;

    protected $_sObject;
    protected $_aObject;
    protected $_oQuery;
    protected $_sLangCateg = 'Wiki';
    protected $_sACLprefix = 'wiki ';
    protected $_bProcessMarkdown = true;

    /**
     * Constructor
     * @param $aObject array of WIKI options
     */
    protected function __construct($aObject)
    {
        parent::__construct();

        $this->_bIsApi = bx_is_api();

        $this->_sObject = $aObject['object'];
        $this->_aObject = $aObject;
        $this->_oQuery = new BxDolWikiQuery($aObject);
    }

    /**
     * Get WIKI object instance by object URI
     * @param $sObject object name
     * @return object instance or false on error
     */
    static public function getObjectInstanceByUri($sUri, $oTemplate = false)
    {
        $aObject = BxDolWikiQuery::getWikiObjectByUri($sUri);
        if (!$aObject || !is_array($aObject))
            return false;

        return self::getObjectInstance($aObject['object'], $oTemplate);
    }

    /**
     * Get WIKI object instance by object name
     * @param $sObject object name
     * @return object instance or false on error
     */
    static public function getObjectInstance($sObject, $oTemplate = false)
    {
        if (isset($GLOBALS['bxDolClasses']['BxDolWiki!'.$sObject]))
            return $GLOBALS['bxDolClasses']['BxDolWiki!'.$sObject];

        $aObject = BxDolWikiQuery::getWikiObject($sObject);
        if (!$aObject || !is_array($aObject))
            $aObject = BxDolWikiQuery::getWikiObject('system');

        $sClass = empty($aObject['override_class_name']) ? 'BxDolWiki' : $aObject['override_class_name'];
        if (!empty($aObject['override_class_file']))
            require_once(BX_DIRECTORY_PATH_ROOT . $aObject['override_class_file']);

        $o = new $sClass($aObject, $oTemplate);

        return ($GLOBALS['bxDolClasses']['BxDolWiki!'.$sObject] = $o);
    }

    static public function onModuleUninstall($sModule)
    {
        $aBlockIds = BxDolWikiQuery::getBlocks ($sModule);
        if ($aBlockIds && is_array($aBlockIds))
            self::onBlockDelete($aBlockIds);
    }

    static public function onBlockDelete($mixedBlockIds)
    {
        BxDolWikiQuery::deleteAllRevisions($mixedBlockIds);

        $aBlockIds = is_array($mixedBlockIds) ? $mixedBlockIds : [$mixedBlockIds];
        $oStorage = BxDolStorage::getObjectInstance('sys_wiki_files');
        if ($oStorage) {
            foreach ($aBlockIds as $iBlockId) {
                $aFiles = $oStorage->getGhosts(0, $iBlockId, false, true);
                $oStorage->queueFiles($aFiles);
            }
        }
    }

    /**
     * Get object name
     */
    public function getObjectName ()
    {
        return $this->_sObject;
    }

    /**
     * Get URI
     */
    public function getUri ()
    {
        return $this->_aObject['uri'];
    }

    /**
     * Get module name
     */
    public function getModule ()
    {
        return $this->_aObject['module'];
    }

    /**
     * Get WIKI block content
     * @param $iBlockId block ID
     * @param $sLang optional language name
     * @return block content
     */
    public function getBlockContent ($iBlockId, $sLang = false, $iRevision = false)
    {
        if (!$sLang)
            $sLang = bx_lang_name();

        $sContent = '';
        $aWikiVer = $this->_oQuery->getBlockContent ($iBlockId, $sLang, $iRevision);
        $aWikiLatest = $this->_oQuery->getBlockContent ($iBlockId, $sLang);
        if ($aWikiVer) {
            if ($this->_bProcessMarkdown && !$this->_bIsApi) {
                $oParsedown = new BxDolParsedown();
                $oParsedown->setSafeMode($aWikiVer['unsafe'] ? false : true);
                $sContent = $oParsedown->text($aWikiVer['content']);
            }
            else
                $sContent = $aWikiVer['content'];
        }

        if (!$aWikiVer && $aWikiLatest) {
            return ($sMsg = _t('_sys_wiki_error_no_rev', $iRevision ? $iRevision : 0, $sLang)) && $this->_bIsApi ? ['content' => $sMsg] : $sMsg;
        }

        if (!$aWikiVer && !$aWikiLatest && $this->isAllowed('edit')) {
            $sContent = _t('_sys_wiki_error_no_revs');
        }

        $mixedControls = '';
        if ($aWikiVer || $this->isAllowed('edit'))
            $mixedControls = bx_srv('system', 'wiki_controls', [$this, $aWikiVer, $aWikiLatest, $iBlockId], 'TemplServiceWiki');

        return $this->_bIsApi ? array_merge([
            'content' => $sContent,
            'menu' => ''
        ], $mixedControls) : $sContent . $mixedControls;
    }

    /**
     * Generate wiki contents - list of all wiki pages
     */
    public function getContents ($sAllExceptSpecified = '', $sOnlySpecified = '')
    {
        $aAllExceptSpecified = $sAllExceptSpecified ? explode(',', $sAllExceptSpecified) : array();
        $aAllExceptSpecified = array_merge($aAllExceptSpecified, ['wiki-pages-list', 'wiki-page-contents']);
        $aOnlySpecified = $sOnlySpecified ? explode(',', $sOnlySpecified) : array();
        if (!($a = $this->_oQuery->getPages($aAllExceptSpecified, $aOnlySpecified)))
            return '';

        $aVars = array('bx_repeat:pages' => array());
        foreach ($a as $r) {
            $oPage = BxDolPage::getObjectInstance($r['object']);
            if (!$oPage->isVisiblePage())
                continue;
            $sUrl = $this->getPageUrl($r['uri']);
            $sTitle = _t($r['title']);
            $aVars['bx_repeat:pages'][] = array(
                'url' => $sUrl,
                'title' => $sTitle ? $sTitle : _t('_Empty'),
            );
        }
        usort($aVars['bx_repeat:pages'], function ($r1, $r2) {
            return strcmp($r1['title'], $r2['title']);
        });
        return BxDolTemplate::getInstance()->parseHtmlByName('wiki_contents.html', $aVars);
    }

    /**
     * Generate list of wiki blocks with missing translations for the given language
     */
    public function getMissingTranslations ($sLang = false)
    {
        if (!$sLang)
            $sLang = bx_lang_name();

        if (!$this->isAllowed('edit') && !$this->isAllowed('translate') || !preg_match("/^[a-z]+$/", $sLang))
            return _t('_sys_txt_access_denied');

        if (!BxDolLanguages::getInstance()->getLangId($sLang))
            return _t('_sys_wiki_error_no_such_lang');

        $a = $this->_oQuery->getBlocksWithMissingTranslations($sLang);
        if (!$a)
            return _t('_sys_wiki_no_missing_translations', $sLang);

        $aVars = array(
            'title_title' => _t('_sys_wiki_title_title'),
            'title_lang' => _t('_sys_wiki_title_lang_missing'),
            'title_author' => _t('_sys_wiki_title_author', _t('_sys_wiki_orig')),
            'title_content' => _t('_sys_wiki_title_content', _t('_sys_wiki_orig')),
            'title_time' => _t('_sys_wiki_title_time', _t('_sys_wiki_orig')),
            'bx_repeat:blocks' => array()
        );
        foreach ($a as $iBlockId) {
            $aWikiVerMain = $this->_oQuery->getBlockContent ($iBlockId, false);
            $aPage = $this->_oQuery->getPageByBlockId($iBlockId);
            $sUrl = $this->getPageUrl($aPage['uri']) . '#bx-page-wiki-container-' . $iBlockId;
            $oProfile = BxDolProfile::getInstanceMagic($aWikiVerMain['profile_id']);

            $aVars['bx_repeat:blocks'][] = array(
                'author_url' => $oProfile->getUrl(),
                'author_name' => $oProfile->getDisplayName(),
                'url' => $sUrl,
                'lang' => $sLang,
                'title' => _t($aPage['title']),
                'content' => strmaxtextlen($aWikiVerMain['content']),
                'timejs' => bx_time_js($aWikiVerMain['added']),
            );
        }
        return BxDolTemplate::getInstance()->parseHtmlByName('wiki_translations_missing.html', $aVars);
    }

    /**
     * Generate list of wiki blocks with outdated translations for the given language
     */
    public function getOutdatedTranslations ($sLang = false)
    {
        if (!$sLang)
            $sLang = bx_lang_name();

        if (!$this->isAllowed('edit') && !$this->isAllowed('translate') || !preg_match("/^[a-z]+$/", $sLang))
            return _t('_sys_txt_access_denied');

        if (!BxDolLanguages::getInstance()->getLangId($sLang))
            return _t('_sys_wiki_error_no_such_lang');

        $aVars = array(
            'title_title' => _t('_sys_wiki_title_title'),
            'title_lang' => _t('_sys_wiki_title_lang_outated'),
            'title_author' => _t('_sys_wiki_title_author', _t('_sys_wiki_orig')),
            'title_content' => _t('_sys_wiki_title_content', _t('_sys_wiki_orig')),
            'title_time_main' => _t('_sys_wiki_title_time', _t('_sys_wiki_orig')),
            'title_time' => _t('_sys_wiki_title_time', '"'.$sLang.'"'),
            'bx_repeat:blocks' => array()
        );
        $a = $this->_oQuery->getBlocksWithOutdatedTranslations($sLang);
        if (!$a)
            return _t('_sys_wiki_all_translations_up_to_date', $sLang);

        foreach ($a as $iBlockId) {
            $aWikiVer = $this->_oQuery->getBlockContent ($iBlockId, $sLang, false, false);
            $aWikiVerMain = $this->_oQuery->getBlockContent ($iBlockId, false);
            $aPage = $this->_oQuery->getPageByBlockId($iBlockId);
            $sUrl = $this->getPageUrl($aPage['uri']) . '#bx-page-wiki-container-' . $iBlockId;
            $oProfile = BxDolProfile::getInstanceMagic($aWikiVerMain['profile_id']);

            $aVars['bx_repeat:blocks'][] = array(
                'author_url' => $oProfile->getUrl(),
                'author_name' => $oProfile->getDisplayName(),
                'url' => $sUrl,
                'lang' => $sLang,
                'title' => _t($aPage['title']),
                'content' => strmaxtextlen($aWikiVerMain['content']),                
                'timejs_main' => bx_time_js($aWikiVerMain['added']),
                'timejs' => bx_time_js($aWikiVer['added']),
            );
        }
        return BxDolTemplate::getInstance()->parseHtmlByName('wiki_translations_outdated.html', $aVars);
    }

    /**
     * Check if partucular action is allowed
     * @param $sType action type: add, edit, delete, translate
     * @param $sProfileId profile to check, if not provided then current profile is used
     * @return true if action is allowed, false otherwise
     */
    public function isAllowed ($sType, $iProfileId = false)
    {
        if ('convert-links' == $sType) {
            return isLogged();
        }

        // translate isn't allowed when only one language on the site
        if ('translate' == $sType) {
            $aLangs = BxDolLanguages::getInstance()->getLanguages(false, true);
            if (count($aLangs) < 2)
                return false;
        }

        // add page isn't implemented for the system
        if ('add-page' == $sType && 'system' == $this->_aObject['module'])
            return false;

        // any action is allowed for admin(operator)
        if (isAdmin())
            return true;

        // map 'action' to 'acl action'
        $aTypes = array(
            'add-page' => 'add page',
            'add' => 'add block',
            'edit' => 'edit block',
            'translate' => 'translate block',
            'delete-version' => 'delete version',
            'delete-block' => 'delete block',
            'get-traaslation' => 'translate block',
            'history' => 'history',
            'unsafe' => 'unsafe',
        );

        // not listed actions aren't allowed
        if (!isset($aTypes[$sType]))
            return false;

        // hardcoded actions (not implemented for now)
        if (true === $aTypes[$sType] || false === $aTypes[$sType])
            return $aTypes[$sType];

        // all system actions starts with special prefix
        $sAction = ('system' == $this->_aObject['module'] ? $this->_sACLprefix : '') . $aTypes[$sType];
        if (!$iProfileId)
            $iProfileId = bx_get_logged_profile_id();
        $aCheck = checkActionModule($iProfileId, $sAction, $this->_aObject['module']);
        return $aCheck[CHECK_ACTION_RESULT] === CHECK_ACTION_RESULT_ALLOWED;
    }

    public function addPage ($sPageUri, $sTitleLangKey)
    {
        $sUrl = $this->getPageUrl($sPageUri, false, false);
        return $this->_oQuery->insertPage ($sPageUri, $sUrl, $sTitleLangKey);
    }

    public function actionGetTranslation ()
    {
        $aWikiVer = $this->_oQuery->getBlockContent ((int)bx_get('block_id'), bx_get('language'), false, false);
        if (!$aWikiVer)
            return array('code' => 1, 'actions' => 'ShowMsg', 'msg' => 'no translation was found');
        else
            return array('code' => 0, 'language' => $aWikiVer['language'], 'content' => $aWikiVer['content'], 'block_id' => $aWikiVer['block_id']);
    }

    public function actionDeleteVersion ($iBlockId = 0, $mixedParams = false)
    {
        if(!$iBlockId && ($_iBlockId = bx_get('block_id')) !== false)
            $iBlockId = (int)$_iBlockId;

        $sLang = bx_lang_name();
        $oLang = BxDolLanguages::getInstance();

        $aVars = $this->getVarsForHistory($iBlockId, $sLang);
        $aVars['select_all'] = _t('_Select_all');

        if (!$aVars['bx_repeat:revisions'])
            return ($sMsg = _t('_sys_wiki_error_no_revs')) && $this->_bIsApi ? [bx_api_get_msg($sMsg)] : BxDolTemplate::getInstance()->parseHtmlByName('wiki_msg.html', array(
                'close' => _t('_sys_close'),
                'msg' => $sMsg,
            ));

        if($this->_bIsApi) {
            if($mixedParams && is_string($mixedParams)) {
                $i = $this->_oQuery->deleteRevisions ($iBlockId, $sLang, explode(',', $mixedParams));
                return [bx_api_get_msg(_t('_sys_wiki_revisions_deleted', $i), ['ext' => ['code' => 0, 'block_id' => $iBlockId]])];
            }

            return [bx_api_get_block('wiki_history',  $aVars['bx_repeat:revisions'], ['ext' => [
                'mode' => 'edit', 
                'request_url' => 'system/wiki_action/TemplServiceWiki&params[]=' . $this->getUri() . '&params[]=delete-version&params[]=' . $iBlockId . '&params[]=',
            ]])];
        }

        $aForm = array(
            'form_attrs' => array(
                'name' => 'bx-wiki-del-rev',
                'method' => 'post',
            ),
            'params' => array (
                'db' => array(
                    'submit_name' => 'do_submit',
                ),
            ),
            'inputs' => array(
                'block_id' => array(
                    'type' => 'hidden',
                    'name' => 'block_id',
                    'value' => $iBlockId,
                ),
                'language' => array(
                    'type' => 'hidden',
                    'name' => 'language',
                    'value' => $sLang,
                ),
                'revision' => array(
                    'type' => 'custom',
                    'name' => 'revision',
                    'caption' => '',
                    'content' => BxDolTemplate::getInstance()->parseHtmlByName('wiki_delete_version.html', $aVars),
                ),
                'buttons' => array(
                    'type' => 'input_set',
                    array(
                        'type' => 'submit',
                        'name' => 'do_submit',
                        'value' => _t('_Submit'),
                    ),
                    array(
                        'type' => 'reset',
                        'name' => 'close',
                        'value' => _t('_sys_close'),
                        'attrs' => array(
                            'onclick' => "$('.bx-popup-applied:visible').dolPopupHide();",
                            'class' => "bx-def-margin-sec-left",
                        ),
                    ),
                ),
            ),
        );

        $oForm = new BxTemplFormView ($aForm);
        $oForm->initChecker();

        if ($oForm->isSubmittedAndValid ()) {
            $i = $this->_oQuery->deleteRevisions ($iBlockId, $sLang, bx_get('revision'));
            return ['code' => 0, 'actions' => ['Reload', 'ClosePopup', 'ShowMsg'], 'block_id' => $iBlockId, 'msg' => _t('_sys_wiki_revisions_deleted', $i)];
        }
        else {
            return BxDolTemplate::getInstance()->parseHtmlByName('wiki_form.html', array(
                'form' => $oForm->getCode(),
                'block_id' => $iBlockId,
                'wiki_action_uri' => $this->getUri(),
                'action' => 'delete-version',
                'txt_open_editor' => bx_js_string(_t('_sys_wiki_open_in_editor')),
            ));
        }
    }

    public function actionAddPage ($sPageUri = '')
    {
        if(!$sPageUri && ($_sPage = bx_get('page')) !== false)
            $sPageUri = bx_process_input($_sPage);

        // validate page URI
        if(!preg_match("/^[a-z0-9_-]+$/", $sPageUri))
            return ($sMsg = _t('_sys_wiki_error_incorrect_page_uri', bx_process_output($sPageUri))) && $this->_bIsApi ? [bx_api_get_msg($sMsg)] : $sMsg;

        // check if such page exist
        $oPage1 = BxDolPage::getObjectInstanceByUri($sPageUri);
        $oPage2 = BxDolPage::getObjectInstance($this->_aObject['module'] . '_' . str_replace('-', '_', $sPageUri));
        if($oPage1 || $oPage2)
            return ($sMsg = _t('_sys_wiki_error_page_exists', bx_process_output($sPageUri))) && $this->_bIsApi ? [bx_api_get_msg($sMsg)] : $sMsg;

        // get lang category where translations will be added
        $oLang = BxDolStudioLanguagesUtils::getInstance();
        $iLangCat = $oLang->getLanguageCategory($this->_sLangCateg);
        if(!$iLangCat)
            return ($sMsg = _t('_sys_wiki_error_occured', 9)) && $this->_bIsApi ? [bx_api_get_msg($sMsg)] : $sMsg;

        // set default values for the form
        $aValues = array();
        $aLangs = $oLang->getLanguages(false, true);
        foreach ($aLangs as $sKey => $sLang)
            $aValues[$sKey] = ucfirst($sPageUri);

        // init form
        $aForm = array(
            'form_attrs' => array(
                'name' => 'bx-wiki-create-page',
                'method' => 'post',
            ),
            'params' => array (
                'db' => array(
                    'submit_name' => 'do_submit',
                ),
            ),
            'inputs' => array(
                'page' => array(
                    'type' => 'hidden',
                    'name' => 'page',
                    'value' => $sPageUri,
                ),
                'title' => array(
                    'type' => 'text_translatable',
                    'name' => 'title',
                    'caption' => _t('_adm_bp_txt_page_title'),
                    'info' => _t('_adm_bp_dsc_page_title'),
                    'value' => '',
                    'values' => $aValues,
                    'required' => '1',
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                    'checker' => array (
                        'func' => 'LengthTranslatable',
                        'params' => array(3,100, 'title'),
                        'error' => _t('_adm_bp_err_page_title'),
                    ),
                ),
                'buttons' => array(
                    'type' => 'input_set',
                    array(
                        'type' => 'submit',
                        'name' => 'do_submit',
                        'value' => _t('_Submit'),
                    ),
                    array(
                        'type' => 'reset',
                        'name' => 'close',
                        'value' => _t('_sys_close'),
                        'attrs' => array(
                            'onclick' => "$('.bx-popup-applied:visible').dolPopupHide();",
                            'class' => "bx-def-margin-sec-left",
                        ),
                    ),
                ),
            ),
        );

        $oForm = new BxTemplStudioFormView ($aForm);
        $oForm->initChecker();

        if ($oForm->isSubmittedAndValid()) {
            // insert page
            $sLangKey = '_' . $this->_aObject['module'] . '_' . str_replace('-', '_', $sPageUri) . '_' . time();
            $iPageId = $this->addPage ($sPageUri, $sLangKey);
            if (!$iPageId)
                return ($sMsg = _t('_sys_wiki_error_occured', 10)) && $this->_bIsApi ? [bx_api_get_msg($sMsg, ['ext' => ['code' => 10]])] : ['code' => 10, 'actions' => ['ShowMsg'], 'msg' => $sMsg];

            // insert translations
            $aLangs = $oLang->getLanguages(true, true);
            foreach ($aLangs as $iLangId => $sLangTitle) {
                $sLang = $oLang->getLangName($iLangId);
                if(!($sVal = $oForm->getCleanValue('title-' . $sLang)))
                    continue;

                $oLang->addLanguageString($sLangKey, $sVal, $iLangId, $iLangCat);
            }

            $sUrl = $this->getPageUrl($sPageUri, false, false);
            return ['code' => 0, 'url' => BxDolPermalinks::getInstance()->permalink($sUrl)];
        }
        else {
            // display form
            return $this->_bIsApi ? [bx_api_get_block('form', $oForm->getCodeAPI(), [
                'ext' => [
                    'name' => $this->_sObject, 
                    'request' => ['url' => '/api.php?r=system/wiki_action/TemplServiceWiki&params[]=' . $this->getUri() . '&params[]=add-page&params[]=' . $sPageUri, 'immutable' => true]
                ]
            ])] : BxDolTemplate::getInstance()->parseHtmlByName('wiki_create_page_form.html', [
                'form' => $oForm->getCode(),
                'wiki_action_uri' => $this->getUri(),
                'action' => 'add-page',
            ]);
        }
    }

    public function actionAdd($sPage = '', $iCellId = 0)
    {
        if(!$sPage && ($_sPage = bx_get('page')) !== false)
            $sPage = bx_process_input($_sPage);

        if(!$iCellId && ($_iCellId = bx_get('cell_id')) !== false)
            $iCellId = (int)$_iCellId;

        $oPage = BxDolPage::getObjectInstance($sPage);
        if(!$oPage)
            return ($sMsg = _t('_sys_wiki_error_occured', 4)) && $this->_bIsApi ? [bx_api_get_msg($sMsg, ['ext' => ['code' => 4]])] : ['code' => 4, 'actions' => ['ShowMsg'], 'msg' => $sMsg];

        if($this->_aObject['module'] != $oPage->getModule())
            return ($sMsg = _t('_sys_txt_access_denied')) && $this->_bIsApi ? [bx_api_get_msg($sMsg, ['ext' => ['code' => 5]])] : ['code' => 5, 'actions' => ['ShowMsg'], 'msg' => $sMsg];

        $oQueryPageBuilder = new BxDolStudioBuilderPageQuery();
        if(!($iBlockId = $oQueryPageBuilder->insertBlock([
            'object' => $sPage,
            'cell_id' => $iCellId,
            'module' => $this->_aObject['module'],
            'title_system' => '',
            'title' => '',
            'designbox_id' => (int)getParam($this->_aObject['module'] . '_design_box'),
            'visible_for_levels' => 2147483647, 
            'type' => 'wiki',
            'deletable' => 1,
            'copyable' => 0,
            'active' => 1,
            'active_api' => 1,
        ])))
            return ($sMsg = _t('_sys_wiki_error_occured', 6)) && $this->_bIsApi ? [bx_api_get_msg($sMsg, ['ext' => ['code' => 6]])] : ['code' => 6, 'actions' => ['ShowMsg'], 'msg' => $sMsg];

        return ['code' => 0, 'block_id' => $iBlockId, 'cell_id' => $iCellId];
    }

    public function actionDeleteBlock ($iBlockId = 0)
    {
        if(!$iBlockId && ($_iBlockId = bx_get('block_id')) !== false)
            $iBlockId = (int)$_iBlockId;

        $oQueryPageBuilder = new BxDolStudioBuilderPageQuery();
        if (!$oQueryPageBuilder->deleteBlocks(['type' => 'by_id', 'value' => $iBlockId]))
            return ($sMsg = _t('_sys_wiki_error_occured', 3)) && $this->_bIsApi ? [bx_api_get_msg($sMsg, ['ext' => ['code' => 3, 'block_id' => $iBlockId]])] : ['code' => 3, 'actions' => ['ShowMsg'], 'block_id' => $iBlockId, 'msg' => $sMsg];

        self::onBlockDelete($iBlockId);

        return ($sMsg = _t('_sys_wiki_block_deleted')) && $this->_bIsApi ? [bx_api_get_msg($sMsg, ['ext' => ['code' => 0, 'block_id' => $iBlockId]])] : [
            'code' => 0, 
            'actions' => ['DeleteBlock', 'ShowMsg'], 
            'block_id' => $iBlockId, 
            'msg' => $sMsg
        ];
    }
    public function actionHistory ($iBlockId = 0)
    {
        if(!$iBlockId && ($_iBlockId = bx_get('block_id')) !== false)
            $iBlockId = (int)$_iBlockId;

        $sLang = bx_lang_name();
        $oLang = BxDolLanguages::getInstance();

        $aVars = $this->getVarsForHistory($iBlockId, $sLang);

        if($this->_bIsApi)
            return ($aVersions = $aVars['bx_repeat:revisions'] ?: false) ? [bx_api_get_block('wiki_history',  $aVersions)] : [bx_api_get_msg(_t('_sys_wiki_error_no_revs'), ['ext' => ['block_id' => $iBlockId]])];

        $aVars['language'] = $oLang->getLangTitle($oLang->getLangId($sLang));
        $aVars['close'] = _t('_sys_close');
        $aVars['msg'] = $aVars['bx_repeat:revisions'] ? '' : _t('_sys_wiki_error_no_revs');
        return BxDolTemplate::getInstance()->parseHtmlByName('wiki_history.html', $aVars);
    }

    public function actionTranslate ($iBlockId = 0)
    {
        return $this->actionEdit($iBlockId, true);
    }

    public function actionEdit ($iBlockId = 0, $bTranslate = false)
    {
        if(!$iBlockId && ($_iBlockId = bx_get('block_id')) !== false)
            $iBlockId = (int)$_iBlockId;

        $sMainLangLabel = '';
        $aWikiVerMain = [];
        $sLangForTranslate = '';
        $aLangsForInput = $this->getLangsForInput ($iBlockId, $bTranslate, $sMainLangLabel, $aWikiVerMain, $sLangForTranslate);

        // don't allow to translate empty blocks
        if (!$aWikiVerMain && $bTranslate)
            return ($sMsg = _t('_sys_wiki_error_no_revs')) && $this->_bIsApi ? [bx_api_get_msg($sMsg)] : BxDolTemplate::getInstance()->parseHtmlByName('wiki_msg.html', [
                'close' => _t('_sys_close'),
                'msg' => $sMsg,
            ]);

        // get latest revision for block with current lang
        $aWikiVer = call_user_func_array([$this->_oQuery, 'getBlockContent'], $bTranslate ? [$iBlockId, $sLangForTranslate, false, false] : [$iBlockId, bx_lang_name()]);
        if($aWikiVer) // unset notes since we need this field empty in the form
            unset($aWikiVer['notes']);

        if(!$aWikiVer) // check for new block, so initialize with default values
            $aWikiVer = [
                'block_id' => $iBlockId,
                'language' => $bTranslate ? $sLangForTranslate : bx_lang_name()
            ];

        // init form object
        $oForm = BxDolForm::getObjectInstance('sys_wiki', $bTranslate ? 'sys_wiki_translate' : 'sys_wiki_edit');
        if(!$oForm)
            return ($sMsg = _t('_sys_wiki_error_occured', 12)) && $this->_bIsApi ? [bx_api_get_msg($sMsg)] : $sMsg;

        if(isset($oForm->aInputs['language'])) {
            if($this->_bIsApi)
                foreach($aLangsForInput as $sKey => $aLangForInput)
                    $oForm->aInputs['language']['values'][$sKey] = $aLangForInput['title'];
            else
                $oForm->aInputs['language']['values'] = $aLangsForInput;
        }

        if(($sK = 'content_main') && isset($oForm->aInputs[$sK]) && $sMainLangLabel)
            $oForm->aInputs[$sK] = array_merge($oForm->aInputs[$sK], [
                'caption' => $sMainLangLabel,
                'content' => $aWikiVerMain ? BxDolTemplate::getInstance()->parseHtmlByName('wiki_content.html', ['content' => $aWikiVerMain['content']]) : ''
            ]);

        if($this->_bIsApi) {
            if(($sK = 'content_main') && isset($oForm->aInputs[$sK]) && $sMainLangLabel) {
                $oForm->aInputs[$sK] = array_merge($oForm->aInputs[$sK], [
                    'type' => 'markdown',
                    'value' => $aWikiVerMain ? $aWikiVerMain['content'] : '',
                    'attrs' => [
                        'readonly' => true
                    ]
                ]);

                unset($oForm->aInputs[$sK]['content']);
            }

            if(($sK = 'content') && isset($oForm->aInputs[$sK])) {
                $sFieldName = 'translations';

                $aValues = array_flip(array_keys($aLangsForInput));
                array_walk($aValues, function(&$mixedValue, $sKey) use($iBlockId) {
                    $mixedValue = '';
                    if(($aWikiVer = $this->_oQuery->getBlockContent($iBlockId, $sKey, false, false)) && is_array($aWikiVer))
                        $mixedValue = $aWikiVer['content'];
                });

                foreach($aLangsForInput as $sName => $aInfo)
                    $aLangsForInput[$sName]['name'] = $sFieldName . '-' . $aInfo['name'];

                $oForm->aInputs[$sK] = array_merge($oForm->aInputs[$sK], [
                    'type' => 'markdown_translatable',
                    'name' => $sFieldName,
                    'value' => '',
                    'values' => $aValues,
                    'translations' => array_values($aLangsForInput),
                    'db' => null
                ]);
            }

            unset($oForm->aInputs['language']);
        }

        $oForm->initChecker($aWikiVer);
        if (!$oForm->isSubmittedAndValid()) {
            // display form
            return $this->_bIsApi ? [bx_api_get_block('form', $oForm->getCodeAPI(), [
                'ext' => [
                    'name' => $this->_sObject, 
                    'request' => ['url' => '/api.php?r=system/wiki_action/TemplServiceWiki&params[]=' . $this->getUri() . '&params[]=' . ($bTranslate ? 'translate' : 'edit') . '&params[]=' . $iBlockId, 'immutable' => true]
                ]
            ])] : BxDolTemplate::getInstance()->parseHtmlByName('wiki_form.html', [
                'form' => $oForm->getCode(),
                'block_id' => $iBlockId,
                'wiki_action_uri' => $this->getUri(),
                'action' => $bTranslate ? 'translate' : 'edit',
                'txt_open_editor' => bx_js_string(_t('_sys_wiki_open_in_editor')),
            ]);
        } 
        else {
            if(($sLang = $oForm->getCleanValue('language')) !== false && ($sContent = $oForm->getCleanValue('content')) !== false)
                $sId = $this->_addBlockRevision($iBlockId, $sLang, $sContent, $oForm);

            // process translations if available
            $aTranslations = [];
            if(($sTranslations = bx_get('translations')) !== false)
                $aTranslations = json_decode($sTranslations, true);
            else
                foreach($aLangsForInput as $sName => $aInfo)
                    if(($sTranslation = bx_get('translations-' . $sName)) !== false)
                        $aTranslations[$sName] = $sTranslation;

            if($aTranslations && is_array($aTranslations))
                foreach ($aTranslations as $sLang => $sContent) {
                    if($sLang == $oForm->getCleanValue('language'))
                        continue;

                    $sId = $this->_addBlockRevision($iBlockId, $sLang, $sContent, $oForm);
                }

            // update indexing data
            $this->updateBlockIndexingData($iBlockId);

            return $this->_bIsApi ? ['code' => 0, 'block_id' => $iBlockId] : ['code' => 0, 'actions' => ['Reload', 'ClosePopup'], 'block_id' => $iBlockId];
        }
    }

    protected function _addBlockRevision($iBlockId, $sLang, $sContent, &$oForm)
    {
        // get previous revision with priority for current language
        $aWikiVer = $this->_oQuery->getBlockContent ($iBlockId, $sLang);

        $bMainLang = $this->getFieldMainLangFlag ($oForm, $sLang, $aWikiVer);
        $sRev = $this->getFieldRev ($oForm, $sLang, $aWikiVer);
        $bUnsafe = $this->getFieldUnsafeFlag ($oForm, $sLang, $aWikiVer);

        // insert new revision (main lang is NOT allowed for translations)
        $iId = 0;
        if((!$bMainLang || ($bMainLang && $this->isAllowed('edit'))) && $this->isContentChanged($iBlockId, $sLang, $sContent)) {
            $iId =  $oForm->insert([
                'added' => time(), 
                'revision' => $sRev,
                'main_lang' => $bMainLang, 
                'profile_id' => bx_get_logged_profile_id(),
                'unsafe' => $bUnsafe,
                'language' => $sLang,
                'content' => $sContent,
            ]);
        }

        return $iId;
    }

    public function actionConvertLinks ()
    {
        $s = bx_get('s');
        if (!$s)
            return ['s' => ''];

        // convert links to be viewable in external editor
        $s = preg_replace_callback('#\((([a-zA-Z0-9_]+)/([a-zA-Z0-9]+))\)#', function ($aMatches) {
            $oStorage = BxDolStorage::getObjectInstance($aMatches[2]);
            if ($oStorage) {
                $sUrl = $oStorage->getFileUrlByRemoteId($aMatches[3]);
                if ($sUrl)
                    return '(' . $sUrl . ')';
            }

            return '(' . $aMatches[0] . ')';
        }, $s);

        // add references to existing pages, so short references will work in external editor
        $s .= "\n<!-- " . _t("_sys_wiki_external_editor_references_comment") . " -->\n";

        $this->_aPages = $this->_oQuery->getAllPages ();
        if ($this->_aPages) {
            foreach ($this->_aPages as $sUri => $r)
                $s .= "[{$sUri}]: " . BX_DOL_URL_ROOT . BxDolPermalinks::getInstance()->permalink($r['url']) . "\n";
        }        

        return ['s' => $s];
    }

    public function updateBlockIndexingData($iBlockId)
    {
        if (!($aLangs = $this->_oQuery->getBlockLangs ($iBlockId)))
            return false;
        $sText = '';
        foreach ($aLangs as $sLang) {
            $aWikiVer = $this->_oQuery->getBlockContent ($iBlockId, $sLang, false, false);
            $sText .= trim(strip_tags($aWikiVer['content'])) . ' ';
        }
        return $this->_oQuery->updateBlockIndexingData ($iBlockId, $sText);
    }

    protected function getPageUrl ($sPageUri, $bPermalink = true, $bAddRootUrl = true)
    {
        $sUrl = ($bAddRootUrl ? BX_DOL_URL_ROOT : '') . 'r.php?_q=' . $this->_aObject['uri'] . '/' . $sPageUri;
        return $bPermalink ? BxDolPermalinks::getInstance()->permalink($sUrl) : $sUrl;
    }

    protected function isContentChanged ($iBlockId, $sLang, $sContent)
    {
        if (!$sContent) // don't allow revisions with empty content
            return false;

        $aWikiVer = $this->_oQuery->getBlockContent ($iBlockId, $sLang, false, false);
        if (!$aWikiVer) // when no previous revision available
            return true;

        return $sContent != $aWikiVer['content'];
    }

    protected function getFieldRev ($oForm, $sLang, $aWikiVer) {
        // increase revision for particular language or start with first revision
        return $aWikiVer && $sLang == $aWikiVer['language'] ? $aWikiVer['revision'] + 1 : 1;
    }

    protected function getFieldMainLangFlag ($oForm, $sLang, $aWikiVer) {
        // detect main language flag
        if ($aWikiVer && $sLang == $aWikiVer['language']) 
            return $aWikiVer['main_lang']; // when revision is increased (language matches) - copy this flag from previous revision
        elseif (!$aWikiVer) 
            return 1; // when it's first revision and no translations - start as main language
        else
            return 0;
    }

    protected function getFieldUnsafeFlag ($oForm, $sLang, $aWikiVer) {

        if ($aWikiVer && $sLang == $aWikiVer['language'] && !$aWikiVer['unsafe'])
            return 0; // copy 'unsafe' from previous revision only when unsafe = 0
        else
            return $this->isAllowed('unsafe') ? 1 : 0; // in other cases - check permissions
    }

    protected function getLangsForInput ($iBlockId, $bTranslateForm, &$sMainLangLabel, &$aWikiVerMain, &$sLangForTranslate)
    {
        // get main lang update time
        $aWikiVerMain = $this->_oQuery->getBlockContent ($iBlockId, 'neverhood');
        $iUpdatedMainLang = $aWikiVerMain ? $aWikiVerMain['added'] : 0;

        // generate values for radio set
        $aLangs = BxDolLanguages::getInstance()->getLanguages(false, true);
        foreach ($aLangs as $sKey => $sLang) {
            $aWikiVer = $this->_oQuery->getBlockContent ($iBlockId, $sKey, false, false);
            $bWikiVer = $aWikiVer && is_array($aWikiVer);

            $bOutdatedLang = !$bWikiVer || $iUpdatedMainLang > $aWikiVer['added'];
            $bMainLang = $bWikiVer && $aWikiVer['main_lang'];
            $sMainLang = $bMainLang ? '★' : '';
            $sComment = $bWikiVer ? bx_time_js($aWikiVer['added']) : _t('_sys_wiki_lang_missing');

            $aLangs[$sKey] = $this->_bIsApi ? [
                'name' => $sKey,
                'title' => $sLang, 
                'added' => $bWikiVer ? $aWikiVer['added'] : '', 
                'main' => $bMainLang, 
                'outdated' => $bOutdatedLang
            ] : _t('_sys_wiki_lang_mask' . ($bOutdatedLang ? '_warn' : ''), $sLang, $sMainLang, $sComment);

            if($bTranslateForm) {
                if(!$bMainLang && !$sLangForTranslate)
                    $sLangForTranslate = $sKey;

                if($bMainLang) {
                    $sMainLangLabel = $this->_bIsApi ? $aLangs[$sKey]['title'] : $aLangs[$sKey];
                    unset($aLangs[$sKey]);
                    continue;
                }
            }
        }

        return $aLangs;
    }

    public function getVarsForHistory ($iBlockId, $sLang)
    {
        $sUrl = '';
        if(!($aPage = $this->_oQuery->getPageByBlockId($iBlockId))) {
            list($sPageLink, $aPageParams) = bx_get_base_url_popup();
            $sUrl = bx_absolute_url(BxDolPermalinks::getInstance()->permalink(bx_append_url_params($sPageLink, $aPageParams)));
        }
        else
            $sUrl = $this->getPageUrl($aPage['uri']);

        $a = $this->_oQuery->getBlockHistory($iBlockId, $sLang);

        $aVars = [];
        foreach ($a as $r) {
            $oProfile = BxDolProfile::getInstanceMagic($r['profile_id']);

            $sUrlRef = bx_append_url_params($sUrl, [$r['block_id'] . 'rev' => $r['revision']]);

            $aVars[] = array_merge($r, $this->_bIsApi ? [
                'author_data' => BxDolProfile::getData($oProfile),
                'rev_url' => bx_api_get_relative_url($sUrlRef)
            ] : [
                'author_name' => $oProfile->getDisplayName(),
                'author_url' => $oProfile->getUrl(),
                'timejs' => bx_time_js($r['added']),
                'rev_url' => $sUrlRef
            ]);
        }

        return [
            'bx_repeat:revisions' => $aVars
        ];
    }
}

class BxDolParsedown extends Parsedown
{
    protected $_aPages;

    protected function textElements($text)
    {
        $res = parent::textElements($text);

        // add all available pages as references
        $this->_aPages = BxDolWikiQuery::getAllPages ();
        if ($this->_aPages) {
            foreach ($this->_aPages as $sUri => $r) {
                $aData = array(
                    // real link URL is set later when link is referenced
                    'url' => 'bx-internal-page://' . $sUri, 
                    'title' => !empty($r['title']) ? _t($r['title']) : null,
                );
                $this->DefinitionData['Reference'][$sUri] = $aData;
            }
        }

        return $res;
    }

    protected function inlineLink($Excerpt)
    {
        $a = parent::inlineLink($Excerpt);

        if ($a && @isset($a['element']['attributes']['href']) && 0 === strncmp($a['element']['attributes']['href'], 'bx-internal-page://', 19)) {
            $sUri = strtolower(substr($a['element']['attributes']['href'], 19));
            if (isset($this->_aPages[$sUri])) {
                $sHref = BX_DOL_URL_ROOT . BxDolPermalinks::getInstance()->permalink($this->_aPages[$sUri]['url']);
                $a['element']['attributes']['href'] = $sHref;
            }
            else {
                $a['element']['attributes']['href'] = $sUri;
            }
        }

        if ($a && @isset($a['element']['attributes']['title']) && '#' === $a['element']['attributes']['title']) {
            $a['element']['attributes']['class'] = 'bx-def-font-grayed';
        }

        return $a;
    }

    protected function inlineImage($Excerpt)
    {
        $a = parent::inlineImage($Excerpt);

        if (@isset($a['element']['attributes']['src']) && preg_match('#^([a-zA-Z0-9_]+)/([a-zA-Z0-9]+)$#', $a['element']['attributes']['src'], $aMatches) && is_array($aMatches) && 3 == count($aMatches)) {

            $oStorage = BxDolStorage::getObjectInstance($aMatches[1]);
            if ($oStorage) {
                $sUrl = $oStorage->getFileUrlByRemoteId($aMatches[2]);
                if ($sUrl)
                    $a['element']['attributes']['src'] = $sUrl;
            }
        }
        return $a;
    }

	protected function blockHeader($Excerpt) {
		$a = parent::blockHeader($Excerpt);

		if (isset($a)) {
			$sText = trim($a['element']['handler']['argument'], '#');
			$sText = trim($sText, ' ');
			$sLink = preg_replace('/[^\p{L}\p{N}\p{M}-]+/u', '', mb_strtolower(mb_ereg_replace(' ','-', $sText)));
			$aAttr = array();

			if (!empty($sLink)) {
				$aAttr = isset($a['element']['attributes']) ? $a['element']['attributes'] : [];
				$aAttr['id'] = $sLink;

				$aHandler = array(
					'function' => 'lineElements',
					'argument' => $sText . (isset($_SERVER['REQUEST_URI']) ? ' [](' . bx_get_self_url() . '#' . $sLink . ' "#")' : ''),
					'destination' => 'elements',
				);

				$a['element']['attributes'] = $aAttr;
				$a['element']['handler'] = $aHandler;
			}
		} 
        else {
			$a = null;
		}

        return $a;
	}
}

/** @} */
