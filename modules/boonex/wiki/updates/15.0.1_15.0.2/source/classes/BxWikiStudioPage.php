<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Wiki Wiki
 * @ingroup     UnaModules
 *
 * @{
 */

class BxWikiStudioPage extends BxTemplStudioModule
{
    function __construct($sModule, $mixedPageName, $sPage = "")
    {
        parent::__construct($sModule, $mixedPageName, $sPage);

        $this->aMenuItems = array(
            'settings' => ['name' => 'settings', 'icon' => 'cogs', 'title' => '_adm_lmi_cpt_settings'],
            'import' => ['name' => 'import', 'icon' => 'download', 'title' => '_bx_wiki_import'],
        );
    }

    function getImport ()
    {
        $aForm = array(
            'form_attrs' => array(
                'name' => 'bx-wiki-import',
                'method' => 'post',
            ),
            'params' => array(
                'db' => array(
                    'submit_name' => 'do_submit',
                ),
            ),
            'inputs' => array(
                'repo' => array(
                    'type' => 'text',
                    'name' => 'repo',
                    'caption' => _t('_bx_wiki_repository_url'),
                    'required' => true,
                ),
                'base_url' => array(
                    'type' => 'text',
                    'name' => 'base_url',
                    'caption' => _t('_bx_wiki_base_url'),
                    'required' => true,
                ),
                'lang' => array(
                    'type' => 'select',
                    'name' => 'lang',
                    'caption' => _t('_bx_wiki_lang'),
                    'values' => BxDolLanguages::getInstance()->getLanguages(),
                    'value' => BxDolLanguages::getInstance()->getCurrentLanguage(),
                ),
                'unsafe' => array(
                    'type' => 'checkbox',
                    'name' => 'unsafe',
                    'caption' => _t('_bx_wiki_unsafe'),
                ),
                'add_titles' => array(
                    'type' => 'checkbox',
                    'name' => 'add_titles',
                    'caption' => _t('_bx_wiki_add_titles'),
                ),
                'git' => array(
                    'type' => 'text',
                    'name' => 'git',
                    'caption' => _t('_bx_wiki_repository_git'),
                    'required' => true,
                    'value' => 'git',
                ),
                'ext' => array(
                    'type' => 'text',
                    'name' => 'ext',
                    'caption' => _t('_bx_wiki_ext'),
                    'required' => true,
                    'value' => 'md',
                ),
                'skip_files' => array(
                    'type' => 'textarea',
                    'name' => 'skip_files',
                    'caption' => _t('_bx_wiki_skip_files'),
                    'value' => '["_Footer.md"]',
                ),
                'only_files' => array(
                    'type' => 'textarea',
                    'name' => 'only_files',
                    'caption' => _t('_bx_wiki_only_files'),
                ),
                'page_uri_map' => array(
                    'type' => 'textarea',
                    'name' => 'page_uri_map',
                    'caption' => _t('_bx_wiki_page_uri_map'),
                    'value' => '{"Home": "Index", "Dashboard": "Wiki-Dashboard"}',
                ),
                'submit' => array(
                    'type' => 'submit',
                    'name' => 'do_submit', // the same as key and database field name
                    'value' => _t('_bx_wiki_import'),
                ),
            ),
        );
        $oForm = new BxTemplFormView($aForm);
        $oForm->initChecker();
        if ($oForm->isSubmittedAndValid ()) {
            $sGit = 
            $sRepoUrl = 
            $aParams = [
                'git' => $oForm->getCleanValue('git'),
                'repository' => $oForm->getCleanValue('repo'),
                'base_url' => $oForm->getCleanValue('base_url'),
                'lang' => $oForm->getCleanValue('lang'),
                'unsafe' => (bool)$oForm->getCleanValue('unsafe'),
                'add_titles' => (bool)$oForm->getCleanValue('add_titles'),
                'ext' => $oForm->getCleanValue('ext'),
                'skip_files' => json_decode($oForm->getCleanValue('skip_files'), true),
                'only_files' => json_decode($oForm->getCleanValue('only_files'), true),
                'page_uri_map' => json_decode($oForm->getCleanValue('page_uri_map'), true),
            ];
            $sErrorMsg = '';
            $b = $this->import($aParams, $sErrorMsg);
            self::removeTmpFolder();
            if ($b)
                return _t('_bx_wiki_import_success');
            else
                return $sErrorMsg;
        }
        else {
            return $oForm->getCode();
        }
    }

    static public function import($aParams, &$sErrorMsg) 
    {
        $sGit = $aParams['git'];
        $sRepoUrl = $aParams['repository'];
        $sExt = $aParams['ext'];
        $aSkipFiles = $aParams['skip_files'];
        $aOnlyFiles = $aParams['only_files'];
        $sErrorMsg = '';

        // empty directory to clone repository to
        $sDir = BX_DIRECTORY_PATH_TMP . 'bx_wiki_import';
        if (!self::removeTmpFolder()) {
            $sErrorMsg = "$sDir can't be removed";
            return false;
        }

        // clone repository
        $sCmd = "{$sGit} clone {$sRepoUrl} " . $sDir;
        $aOutput = null;
        $iRetVal = null;
        if (false === exec(escapeshellcmd($sCmd), $aOutput, $iRetVal) || (null !== $iRetVal && $iRetVal)) {
            $sErrorMsg = "Command($sCmd) execution failed: <pre>" . implode("\n", $aOutput) . "</pre>";
            return false;
        }

        if (false === ($h = opendir($sDir))) {
            $sErrorMsg = "Directory($sDir) read failed";
            return false;
        }

        // get list of files to import and check pages for existence
        $aFilesToImport = [];
        while (false !== ($sFile = readdir($h))) {
            if (!empty($aSkipFiles) && in_array($sFile, $aSkipFiles))
                continue;

            if (!empty($aOnlyFiles) && !in_array($sFile, $aOnlyFiles))
                continue;

            $a = pathinfo($sDir . '/' . $sFile);
            if (empty($a['filename']) || empty($a['extension']) || $a['extension'] != $sExt)
                continue;

            $sErrorMsgFile = '';
            if (self::isPageExist($aParams, $sDir . '/' . $sFile, $a['filename'], $sErrorMsgFile)) {
                $sErrorMsg = "File($sFile) import failed: $sErrorMsgFile";
                break;
            }

            $aFilesToImport[$sFile] = $a;
        }
        closedir($h);

        if ($sErrorMsg)
            return false;

        // perform import
        foreach ($aFilesToImport as $sFile => $a) {
            $sErrorMsgFile = '';
            if (!self::importFile($aParams, $sDir . '/' . $sFile, $a['filename'], $sErrorMsgFile)) {
                $sErrorMsg = "File($sFile) import failed: $sErrorMsgFile";
                break;
            }
        }
        if ($sErrorMsg)
            return false;

        return true;
    }

    static protected function isPageExist($aParams, $sPath, $sTitle, &$sErrorMsg)
    {
        $aMapPageUris = $aParams['page_uri_map'];
        $sUri = $sTitle;
        if (isset($aMapPageUris[$sUri]))
            $sUri = $aMapPageUris[$sUri];
        if ($oPage = BxDolPage::getObjectInstanceByURI($sUri)) {
            $sErrorMsg = "Page with such URI($sUri) already exists";
            return true;
        }
        return false;
    }

    static protected function importFile($aParams, $sPath, $sTitle, &$sErrorMsg)
    {
        $sBaseUrlOld = $aParams['base_url'];
        $sLang = $aParams['lang'];
        $bUnsafe = $aParams['unsafe'];
        $bAddTitles = $aParams['add_titles'];
        $aMapPageUris = $aParams['page_uri_map'];

        if (false === ($sContents = file_get_contents($sPath)) || empty($sContents)) {
            $sErrorMsg = "File($sPath) read failed";
            return false;
        }    

        $oWiki = BxDolWiki::getObjectInstance('bx_wiki');

        $sUri = $sTitle;
        if (isset($aMapPageUris[$sUri]))
            $sUri = $aMapPageUris[$sUri];

        $sTitle = str_replace('-', ' ', $sTitle);

        if (!($iPageId = $oWiki->addPage($sUri, $sTitle))) {
            $sErrorMsg = "Page with URI($sUri) add failed";
            return false;
        }
                       
        if (!($oPage = BxDolPage::getObjectInstanceByURI($sUri))) {
            $sErrorMsg = "Page with URI($sUri) wasn't found";
            return false;
        }

        $iDesignBox = getParam('bx_wiki_design_box');
        $aBlock = array(
            'object' => $oPage->getName(),
            'cell_id' => 1,
            'module' => 'bx_wiki',
            'title_system' => '',
            'title' => '',
            'designbox_id' => false === $iDesignBox ? 0 : $iDesignBox,
            'visible_for_levels' => 2147483647, 
            'type' => 'wiki',
            'deletable' => 1,
            'copyable' => 0,
            'active' => 1,
        );
        $oQueryPageBuilder = new BxDolStudioBuilderPageQuery();
        if (!($iBlockId = $oQueryPageBuilder->insertBlock($aBlock))) {
            $sErrorMsg = "Page(" . $oPage->getName() . ") block add failed";
            return false;
        }

        $sContents = self::processImages($sContents, $aMapPageUris, $sBaseUrlOld, $iBlockId);
        $sContents = self::processContents($sContents, $aMapPageUris, $sBaseUrlOld, $iBlockId);

        if ($bAddTitles)
            $sContents = "# $sTitle\n\n" . $sContents;

        $oForm = BxDolForm::getObjectInstance('sys_wiki', 'sys_wiki_edit');
        $sIdRevision = $oForm->insert(array(
            'block_id' => $iBlockId,
            'revision' => 1,
            'language' => $sLang,
            'main_lang' => 1,
            'profile_id' => 0,
            'content' => $sContents,
            'unsafe' => $bUnsafe,
            'notes' => 'Import',
            'added' => time(), 
        ));
        if (!$sIdRevision) {
            $sErrorMsg = "Revision add failed for block ($iBlockId)";
            return false;
        }

        $oWiki->updateBlockIndexingData($iBlockId);

        return true;
    }

    static protected function processContents($sContents, $aMapPageUris, $sBaseUrlOld, $iBlockId)
    {
        // strip base URL
        $sContents = preg_replace("/\(" . preg_quote($sBaseUrlOld, '/') . "([^\)]+)\)/", "[$1]", $sContents);

        // replace special constructions which don't work locally
        $sContents = preg_replace('/\[\[(.+?)\|(.+?)\]\]/', '[$1][$2]', $sContents);
        $sContents = preg_replace('/\[(.+?)\|(.+?)\]/', '[$1][$2]', $sContents);

        // replace old URIs with new ones
        foreach ($aMapPageUris as $sOldUri => $sNewUri)
            $sContents = str_replace("[$sOldUri]", "[$sNewUri]", $sContents);

        // convert links to the proper ones
        $sContents = preg_replace('/\[(.+?)\]\[(http:\/\/.+?)\]/', '[$1]($2)', $sContents);
        $sContents = preg_replace('/\[(.+?)\]\[(https:\/\/.+?)\]/', '[$1]($2)', $sContents);

        return $sContents;
    }

    static protected function processImages($sContents, $aMapPageUris, $sBaseUrlOld, $iBlockId)
    {
        // unify links to images
        $sContents = preg_replace('/\[\[(.+?)\|alt=(.+?)\]\]/', '![$2]($1)', $sContents);

        // process images
        $sContents = preg_replace_callback('/\!\[(.+?)\]\((.+?)\)/', function ($aMatches) use ($sBaseUrlOld, $iBlockId) {
            if (empty($aMatches[2]))
                return $aMatches[0];

            // strip base Wiki URL
            $sImg = str_replace($sBaseUrlOld, "", $aMatches[2]);

            // skip external URLs
            if (0 === strncmp($sImg, 'http://', 7) || 0 === strncmp($sImg, 'https://', 8))
                return $aMatches[0];

            $sImgPath = BX_DIRECTORY_PATH_TMP . 'bx_wiki_import/' . ltrim($sImg, '/');
            if (!file_exists($sImgPath))
                return $aMatches[0];

            $oStorage = BxDolStorage::getObjectInstance('sys_wiki_files');
            if (!$oStorage)
                return $aMatches[0];

            if (!($iFileId = $oStorage->storeFileFromPath($sImgPath, false, 0, $iBlockId)))
                return $aMatches[0];

            if (!($aFile = $oStorage->getFile($iFileId)))
                return $aMatches[0];

            return "![{$aMatches[2]}](" . $oStorage->getObject() . "/" . $aFile['remote_id'] . ")";
 
        }, $sContents);

        return $sContents;
    }

    static public function removeTmpFolder() 
    {
        $sDir = BX_DIRECTORY_PATH_TMP . 'bx_wiki_import';
        return !file_exists($sDir) || bx_rrmdir($sDir);
    }
}

/** @} */
