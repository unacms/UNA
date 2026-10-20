<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

bx_import('BxDolLanguages');

class BxDolStudioLanguagesUtils extends BxDolLanguages implements iBxDolSingleton
{
    protected function __construct()
    {
        if(isset($GLOBALS['bxDolClasses'][get_class($this)]))
            trigger_error ('Multiple instances are not allowed for the class: ' . get_class($this), E_USER_ERROR);

        parent::__construct();

        $this->oDb = new BxDolStudioLanguagesUtilsQuery();
    }

    /**
     * Prevent cloning the instance
     */
    public function __clone()
    {
        if (isset($GLOBALS['bxDolClasses'][get_class($this)]))
            trigger_error('Clone is not allowed for the class: ' . get_class($this), E_USER_ERROR);
    }

    /**
     * Get singleton instance of the class
     */
    public static function getInstance()
    {
        if(!isset($GLOBALS['bxDolClasses'][__CLASS__]))
            $GLOBALS['bxDolClasses'][__CLASS__] = new BxDolStudioLanguagesUtils();

        return $GLOBALS['bxDolClasses'][__CLASS__];
    }

    function getLanguageInfo($sName)
    {
        $aLanguage = array();
        $this->oDb->getLanguagesBy(array('type' => 'by_name', 'value' => $sName), $aLanguage, false);

        if(!empty($aLanguage))
            $aLanguage['icon'] = genFlag($aLanguage['name'], BxDolStudioTemplate::getInstance());

        return $aLanguage;
    }

    function getLanguagesInfo($bIdAsKey = false, $bActiveOnly = false)
    {
        $aLanguages = array();
        $this->oDb->getLanguagesBy(array('type' => 'all'), $aLanguages, false);
        if(!is_array($aLanguages) || empty($aLanguages))
            return $aLanguages;

        $oTemplate  = BxDolStudioTemplate::getInstance();
        foreach($aLanguages as $iKey => $aLanguage)
            $aLanguages[$iKey]['icon'] = genFlag($aLanguage['name'], $oTemplate);

        return $aLanguages;
    }

    function readLanguage($sPath, $sType = 'restore')
    {
        if(!file_exists($sPath))
            return array();

        $oXmlParser = BxDolXmlParser::getInstance();
        $sXmlContent = file_get_contents($sPath);

        $aResult = array();
        $aResult['name'] = $oXmlParser->getAttribute($sXmlContent, 'resources', 'name');

        $aResult['title'] = $oXmlParser->getAttribute($sXmlContent, 'resources', 'title');
        if($aResult['title'] === false)
			unset($aResult['title']);

        $aResult['category'] = $oXmlParser->getAttribute($sXmlContent, 'resources', 'category');
		if($aResult['category'] === false)
			unset($aResult['category']);

        switch($sType) {
            case 'restore':
                $aResult['strings'] = $oXmlParser->getValues($sXmlContent, 'string');
                break;

            case 'update':
                $aResult['strings_del'] = $oXmlParser->getValues($sXmlContent, 'string_del');
                if(empty($aResult['strings_del']) || !is_array($aResult['strings_del']))
                	unset($aResult['strings_del']);

                $aResult['strings_add'] = $oXmlParser->getValues($sXmlContent, 'string_add');
                if(empty($aResult['strings_add']) || !is_array($aResult['strings_add']))
                	unset($aResult['strings_add']);

                $aResult['strings_upd'] = $oXmlParser->getValues($sXmlContent, 'string_upd');
                if(empty($aResult['strings_upd']) || !is_array($aResult['strings_upd']))
                	unset($aResult['strings_upd']);

                break;
        }

        return $aResult;
    }

    function compileLanguage($mixedLang = 0, $bForce = false)
    {
        $sType = 'all';
        if(!empty($mixedLang)) {
            if(is_string($mixedLang) && !is_numeric($mixedLang))
                $sType = 'all_by_name';
            else if(is_numeric($mixedLang) || is_int($mixedLang)) {
                $sType = 'all_by_id';
                $mixedLang = (int)$mixedLang;
            }
        }

        $aLanguages = array();
        $iLanguages = $this->oDb->getLanguagesBy(array('type' => $sType, 'value' => $mixedLang), $aLanguages);

        if($iLanguages == 0)
            return false;

        $oFile = BxDolFile::getInstance();

        $sNewLine = "\r\n";
        foreach($aLanguages as $aLanguage) {
            if(!$bForce && (int)$aLanguage['enabled'] != 1)
                continue;

			$aKeys = array();
            $this->oDb->getKeysBy(array('type' => 'by_language_id_key_key', 'value' => $aLanguage['id']), $aKeys);

            if($aLanguage['name'] != BX_DOL_LANGUAGE_DEFAULT && getParam('lang_subst_from_en') == 'on') {
				$aKeysAll = array();
				$this->oDb->getKeysBy(array('type' => 'by_language_name_key_key', 'value' => BX_DOL_LANGUAGE_DEFAULT), $aKeysAll);

	            $aKeys = array_merge($aKeysAll, $aKeys);
            }

            $sLanguageFile = "lang-" . $aLanguage['name'] . ".php";
            $oFile->delete('cache/' . $sLanguageFile);

            $rHandle = fopen( BX_DIRECTORY_PATH_CACHE . $sLanguageFile, 'w');
            if($rHandle === false)
                return false;

            $sContent = "<?php{$sNewLine}\$GLOBALS['LANG'] = array(";
            foreach($aKeys as $aKey) {
                list($sKey, $sString) = str_replace(array("\\", "'"), array("\\\\", "\\'"), array($aKey['key'], $aKey['string']));
                $sContent .= "{$sNewLine}\t'$sKey' => '$sString',";
            }

            $sContent = trim($sContent, ',');

            if(fwrite($rHandle, $sContent."{$sNewLine});?>") === false)
                return false;

            if(fclose($rHandle) === false)
                return false;

            @chmod( BX_DIRECTORY_PATH_CACHE . "lang-{$aLanguage['name']}.php", 0666);

            if (function_exists('opcache_invalidate')) opcache_invalidate(BX_DIRECTORY_PATH_CACHE . "lang-{$aLanguage['name']}.php");
        }

        $this->init();
        BxDolCacheUtilities::getInstance()->clear('template');

        return true;
    }

    function installLanguage($aLanguageModule, $bRecompile = true)
    {
        $aLanguage = array();
        $this->oDb->getLanguagesBy(array('type' => 'by_name', 'value' => $aLanguageModule['uri']), $aLanguage, false);
        if(empty($aLanguage) || !is_array($aLanguage))
            return false;

        $aModulesToProcess = array();
        $oModuleQuery = BxDolModuleQuery::getInstance();

        /*
         * Get modules to be processed from language module.
         */
        $sPath = BX_DIRECTORY_PATH_MODULES . $aLanguageModule['path'] . 'data/langs/';
        if(($rHandler = opendir($sPath)) !== false) {
            while(($sFileName = readdir($rHandler)) !== false) {
                if($sFileName == '.' || $sFileName == '..')
                    continue;

                $aModule = $oModuleQuery->getModuleByName($sFileName);
                if(empty($aModule) || !is_array($aModule))
                    continue;

                $aModulesToProcess[$aModule['name']] = $aModule;
            }

            closedir($rHandler);
        }

        /*
         * Get modules to be processed from a list of already installed modules.
         */
        $aModulesInstalled = $oModuleQuery->getModulesBy(array('type' => 'all_key_name'));
        if(!empty($aModulesInstalled) && is_array($aModulesInstalled))
            $aModulesToProcess = array_merge($aModulesToProcess, $aModulesInstalled);

        /*
         * Add language module itself.
         */
        $aModulesToProcess[$aLanguageModule['name']] = $aLanguageModule;

        $bResult = false;
        foreach($aModulesToProcess as $aModuleToProcess)
            $bResult |= $this->_restoreLanguageByModule($aLanguage, $sPath, $aModuleToProcess);

        return $bResult && ($bRecompile ? $this->compileLanguage($aLanguage['id']) : true);
    }

    function restoreLanguage($mixedLang = 0, $mixedModule = 0, $bRecompile = true)
    {
        $aLanguages = array();
        if(!empty($mixedLang)) {
            $sType = is_string($mixedLang) && !is_numeric($mixedLang) ? 'by_name' : 'by_id';
            $this->oDb->getLanguagesBy(array('type' => $sType, 'value' => $mixedLang), $aLanguages[0], false);
        } 
        else
            $this->oDb->getLanguagesBy(array('type' => 'all'), $aLanguages, false);

        $bResult = true;
        foreach($aLanguages as $aLanguage) {
            if(empty($aLanguage) || !is_array($aLanguage))
                continue;

            $oModuleQuery = BxDolModuleQuery::getInstance();

            $aLanguageModule = $oModuleQuery->getModuleByUri($aLanguage['name']);
            if(empty($aLanguageModule) || !is_array($aLanguageModule))
                continue;

            $sPath = BX_DIRECTORY_PATH_MODULES . $aLanguageModule['path'] . 'data/langs/';

            if(!empty($mixedModule))
                $bResult &= $this->_restoreLanguageByModule($aLanguage, $sPath, $mixedModule);
            else {
            	$aModules = $oModuleQuery->getModules();
            	foreach($aModules as $aModule)
            		$bResult &= $this->_restoreLanguageByModule($aLanguage, $sPath, $aModule);
            }

            if($bRecompile)
                $bResult &= $this->compileLanguage($aLanguage['id']);
        }

        return $bResult;
    }

    function fixLanguage($mixedLang = 0, $bRecompile = true)
    {
        $aLanguages = array();
        if(!empty($mixedLang)) {
            $sType = is_string($mixedLang) && !is_numeric($mixedLang) ? 'by_name' : 'by_id';
            $this->oDb->getLanguagesBy(array('type' => $sType, 'value' => $mixedLang), $aLanguages[0], false);
        }
        else
            $this->oDb->getLanguagesBy(array('type' => 'all'), $aLanguages, false);

        foreach($aLanguages as $aLanguage) {
            if(empty($aLanguage) || !is_array($aLanguage))
                continue;

            $iLanguageId = (int)$aLanguage['id'];

            $aKeys = array();
            $this->oDb->getKeysBy(array('type' => 'autogenerated', 'language_id' => $iLanguageId, 'empty' => true), $aKeys);
            if(empty($aKeys) || !is_array($aKeys))
                continue;

            foreach($aKeys as $aKey) {
                $sKey = preg_replace("/_[0-9]{8,10}$/i", '', $aKey['key']);
                if(empty($sKey))
                    continue;

                $sString = '';
                $aString = array();
                $this->oDb->getStringsBy(array('type' => 'by_key_language_id', 'key' => $sKey, 'language_id' => $iLanguageId), $aString, false);
                if(!empty($aString) && is_array($aString) && isset($aString['string']))
                    $sString = $aString['string'];

                $this->addLanguageString($aKey['key'], $sString, $iLanguageId, 0, false);
            }

            if($bRecompile)
                $this->compileLanguage($iLanguageId, true);
        }
    }

    function removeLanguageById($mixedLang = 0, $bRecompile = true)
    {
        $aLanguages = array();
        if(!empty($mixedLang)) {
            $sType = is_string($mixedLang) && !is_numeric($mixedLang) ? 'by_name' : 'by_id';
            $this->oDb->getLanguagesBy(array('type' => $sType, 'value' => $mixedLang), $aLanguages[0], false);
        } else
            $this->oDb->getLanguagesBy(array('type' => 'all'), $aLanguages, false);

        $bResult = true;
        foreach($aLanguages as $aLanguage) {
            if(empty($aLanguage) || !is_array($aLanguage))
                continue;

            $bResult &= (int)$this->oDb->deleteStringsBy(array('type' => 'by_lang', 'language_id' => $aLanguage['id'])) >= 0;

            if($bRecompile)
                $bResult &= $this->compileLanguage($aLanguage['id']);
        }

        return $bResult;
    }

    function removeLanguageByModule($mixedModule, $bRecompile = true)
    {
        $aModule = $mixedModule;
        if(!is_array($mixedModule)) {
            $sMethod = is_string($mixedModule) && !is_numeric($mixedModule) ? 'getModuleByUri' : 'getModuleById';
            $aModule = BxDolModuleQuery::getInstance()->$sMethod($mixedModule);
        }

        if(empty($aModule) || !is_array($aModule) || !$aModule['uri'] || !$aModule['lang_category'])
            return false;

        $aCategory = array();
        $this->oDb->getCategoriesBy(array('type' => 'by_name', 'value' => $aModule['lang_category']), $aCategory, false);
        // No category means its keys are already gone, e.g. an uninstall that stopped half way.
        if(empty($aCategory) || !is_array($aCategory))
            return $bRecompile ? $this->compileLanguage() : true;

        $bResult = (int)$this->oDb->deleteKeysBy(array('type' => 'by_cat_id', 'value' => $aCategory['id'])) >= 0;
        return $bResult && ($bRecompile ? $this->compileLanguage() : true);
    }

    function getLanguageString($sKey, $iLangId = 0)
    {
        if($iLangId == 0) {
            $aStrings = array();
            $this->oDb->getStringsBy(array('type' => 'all_by_key_key_language_id', 'value' => $sKey), $aStrings, false);

            return $aStrings;
        }

        $aString = array();
        $this->oDb->getStringsBy(array('type' => 'by_key_language_id', 'key' => $sKey, 'language_id' => $iLangId), $aString, false);

        return $aString;
    }

    function addLanguageString($sKey, $mixedString, $iLangId = 0, $iCategoryId = 0, $bRecompile = true)
    {
        $iLangId = (int)$iLangId;

        $iCategoryId = (int)$iCategoryId;
        if($iCategoryId == 0)
            $iCategoryId = BX_DOL_LANGUAGE_CATEGORY_CUSTOM;

        $sKey = bx_process_input($sKey);
        $mixedString = bx_process_input($mixedString);

        $aLanguages = array();
        $iLanguages = $this->oDb->getLanguagesBy(($iLangId == 0 ? array('type' => 'all') : array('type' => 'all_by_id', 'value' => $iLangId)), $aLanguages);

        if(($iKeyId = $this->oDb->addKey($iCategoryId, $sKey)) === false)
            return false;

        foreach($aLanguages as $aLanguage) {
            $sString = '';
            if(is_string($mixedString))
                $sString = $mixedString;
            else if(is_array($mixedString))
                $sString = $mixedString[$aLanguage['id']];

            if(!$this->oDb->addString($iKeyId, $aLanguage['id'], $sString))
                return false;

            if($bRecompile)
                $this->compileLanguage($aLanguage['id']);
        }

        return $iKeyId;
    }

    function updateLanguageString($sKey, $mixedString, $iLangId = 0, $iCategoryId = 0, $bRecompile = true)
    {
        $sKey = bx_process_input($sKey);
        $mixedString = bx_process_input($mixedString);
        $iLangId = (int)$iLangId;
        $iCategoryId = (int)$iCategoryId;
        if(empty($iCategoryId))
        	$iCategoryId = BX_DOL_LANGUAGE_CATEGORY_CUSTOM;

        $aKey = array();
        $this->oDb->getKeysBy(array('type' => 'by_name', 'value' => $sKey), $aKey);
        if(empty($aKey))
            return $this->addLanguageString($sKey, $mixedString, $iLangId, $iCategoryId, $bRecompile);

		if((int)$aKey['category_id'] != $iCategoryId)
			$this->oDb->updateKeys(array('IDCategory' => $iCategoryId), array('ID' => $aKey['id']));

        return $this->updateLanguageStringById($aKey['id'], $mixedString, $iLangId, $bRecompile);
    }

    function updateLanguageStringById($iKeyId, $mixedString, $iLangId = 0, $bRecompile = true)
    {
        $iKeyId = (int)$iKeyId;
        $mixedString = bx_process_input($mixedString);
        $iLangId = (int)$iLangId;

        $aLanguages = array();
        $iLanguages = $this->oDb->getLanguagesBy(($iLangId == 0 ? array('type' => 'all') : array('type' => 'all_by_id', 'value' => $iLangId)), $aLanguages);

        $bResult = false;
        foreach($aLanguages as $aLanguage) {
            $sString = '';
            if(is_string($mixedString))
                $sString = $mixedString;
            else if(is_array($mixedString))
                $sString = $mixedString[$aLanguage['id']];

            if(!$this->oDb->updateString($iKeyId, $aLanguage['id'], $sString))
                continue;

            if($bRecompile)
                $this->compileLanguage($aLanguage['id']);

            $bResult = true;
        }

        return $bResult;
    }

    function deleteLanguageString($sKey, $iLangId = 0, $bRecompile = true)
    {
        $iLangId = (int)$iLangId;
        $sKey = bx_process_input($sKey);

        $aKey = array();
        $this->oDb->getKeysBy(array('type' => 'by_name', 'value' => $sKey), $aKey);
        if(empty($aKey))
            return false;

        return $this->deleteLanguageStringById($aKey['id'], $iLangId, $bRecompile);
    }

    function deleteLanguageStringById($iKeyId, $iLangId = 0, $bRecompile = true)
    {
        $iKeyId = (int)$iKeyId;
        $iLangId = (int)$iLangId;

        $aLanguages = array();
        $iLanguages = $this->oDb->getLanguagesBy(($iLangId == 0 ? array('type' => 'all') : array('type' => 'all_by_id', 'value' => $iLangId)), $aLanguages);

        foreach($aLanguages as $aLanguage) {
            if(!$this->oDb->deleteString($iKeyId, $aLanguage['id']))
                continue;

            if($bRecompile)
                $this->compileLanguage($aLanguage['id']);
        }

        return $this->oDb->deleteKey($iKeyId);
    }

    function addLanguageCategory($sName)
    {
        return $this->oDb->addCategory($sName);
    }

    function deleteLanguageCategory($sName)
    {
        return $this->oDb->deleteCategory($sName);
    }

    protected function _restoreLanguageByModule($aLanguage, $sPath, $mixedModule)
    {
        $oXmlParser = BxDolXmlParser::getInstance();

        $aModule = $mixedModule;
        if(!is_array($mixedModule)) {
            $sMethod = is_string($mixedModule) && !is_numeric($mixedModule) ? 'getModuleByUri' : 'getModuleById';
            $aModule = BxDolModuleQuery::getInstance()->$sMethod($mixedModule);
        }

        if(empty($aModule) || !is_array($aModule) || !$aModule['name'] || !$aModule['lang_category'])
            return true;

        $sPath = $sPath . $aModule['name'] . '/' . $aLanguage['name'] . '.xml';
        if(!file_exists($sPath) && isset($aModule['path'])) {
            $sPath = BX_DIRECTORY_PATH_MODULES . $aModule['path'] . 'install/langs/' . $aLanguage['name'] . '.xml';
            if(!file_exists($sPath))
                return true;
        }

        $aLanguageInfo = $this->readLanguage($sPath);
        if(empty($aLanguageInfo['name']) || empty($aLanguageInfo['strings']) || $aLanguageInfo['name'] != $aLanguage['name'])
            return false;

        $aCategory = array();
        $this->oDb->getCategoriesBy(array('type' => 'by_name', 'value' => $aModule['lang_category']), $aCategory, false);

        $iCategoryId = 0;
        if(empty($aCategory) || !is_array($aCategory)) {
        	$iCategoryId = $this->addLanguageCategory($aModule['lang_category']);
        	if(empty($iCategoryId))
        		return false;
        }
        else
        	$iCategoryId = $aCategory['id'];

		$bDeleteStringsByKey = !$this->oDb->deleteStringsBy(array('type' => 'by_cat_and_lang', 'category_id' => $iCategoryId, 'language_id' => $aLanguage['id']));

        $bResult = true;
        foreach($aLanguageInfo['strings'] as $sKey => $sValue)
            if($sKey != '') {
            	if($bDeleteStringsByKey)
            		$this->oDb->deleteStringsBy(array('type' => 'by_key_and_lang', 'key' => $sKey, 'language_id' => $aLanguage['id']));

                $bResult &= $this->addLanguageString($sKey, $sValue, $aLanguage['id'], $iCategoryId, false) > 0;
            }

        return $bResult;
    }
}

/** @} */
