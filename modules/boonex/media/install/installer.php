<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    MediaManager MediaManager
 * @ingroup     UnaModules
 *
 * @{
 */

class BxMediaInstaller extends BxBaseModTextInstaller
{
    const UPLOADER = 'bx_media_uploader';
    const UPLOADER_ATTACHMENTS = 'bx_media_uploader_attachments';

    public function __construct($aConfig)
    {
        parent::__construct($aConfig);
    }

    public function enable($aParams)
    {
        $aResult = parent::enable($aParams);
        if($aResult['result'])
            $this->_saveSettings();
        return $aResult;
    }

    public function disable($aParams)
    {
        $aResult = parent::disable($aParams);
        if($aResult['result'])
            $this->_restoreSettings();
        return $aResult;
    }

    protected function _getModuleDb()
    {
        $oModule = BxDolModule::getInstance($this->_aConfig['name']);
        return $oModule ? $oModule->_oDb : false;
    }

    /**
     * Offer the module's uploaders in every files field and add them to the attachment menus.
     */
    private function _saveSettings()
    {
        $oDb = $this->_getModuleDb();
        if(!$oDb)
            return;

        $oDb->saveFilesInputs();

        foreach($oDb->getFilesInputs() as $aInput) {
            // the post form's pictures field uses the attachments uploader
            $sUploader = $aInput['name'] == 'pictures' && $aInput['module'] == 'bx_posts' ? self::UPLOADER_ATTACHMENTS : self::UPLOADER;

            $aValues = $aInput['values'] ? unserialize($aInput['values']) : [];
            if(!is_array($aValues))
                $aValues = [];
            $aValues[$sUploader] = _t('_bx_media_uploader_title');

            $oDb->updateInputValues($aInput['id'], serialize($aValues));
        }

        foreach($oDb->getAttachmentMenuSets() as $sSetName) {
            foreach($oDb->getHtml5MenuItems($sSetName) as $aMenu) {
                $oDb->insertMenuItem([
                    'set_name' => $aMenu['set_name'],
                    'module' => $this->_aConfig['name'],
                    'name' => str_replace('html5', 'media manager', $aMenu['name']),
                    'title_system' => str_replace('html5', 'Media manager', _t($aMenu['title_system'])),
                    'title' => $aMenu['title'],
                    'link' => $aMenu['link'],
                    'onclick' => 'javascript:{js_object_bx_media_uploader_attachments}.showUploaderForm();',
                    'target' => $aMenu['target'],
                    'icon' => 'photo-video',
                    'visible_for_levels' => $aMenu['visible_for_levels'],
                    'active' => 0,
                    'copyable' => $aMenu['copyable'],
                    'editable' => $aMenu['editable'],
                    'order' => $aMenu['order'],
                ]);
            }
        }
    }

    /**
     * Put the files fields back as they were before the module was enabled.
     */
    private function _restoreSettings()
    {
        $oDb = $this->_getModuleDb();
        if(!$oDb)
            return;

        foreach($oDb->getSavedFilesInputs() as $aSaved)
            $oDb->restoreFilesInput($aSaved);

        foreach($oDb->getAttachmentMenuSets() as $sSetName)
            $oDb->deleteMenuItems($sSetName, $this->_aConfig['name']);
    }
}

/** @} */
