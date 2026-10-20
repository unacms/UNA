<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 */

class BxTasksUpdater extends BxDolStudioUpdater
{
    public function __construct($aConfig)
    {
        parent::__construct($aConfig);
    }

    public function actionExecuteSql($sOperation)
    {
        if($sOperation == 'install') {
            if(!$this->oDb->isFieldExists('bx_tasks_files', 'dimensions'))
                $this->oDb->query("ALTER TABLE `bx_tasks_files` ADD `dimensions` varchar(24) NOT NULL AFTER `size`");

            $this->oDb->query("ALTER TABLE `bx_tasks_tasks` ALTER `state` SET DEFAULT '2'");
        }

        $iResult = parent::actionExecuteSql($sOperation);

        /**
         * Remove old attachments.
         */
        if($iResult == BX_DOL_STUDIO_INSTALLER_SUCCESS) {
            $oStorage = BxDolStorage::getObjectInstance('sys_cmts_images');
            
            $iCmtsSystemId = (int)$this->oDb->getOne("SELECT `ID` FROM `sys_objects_cmts` WHERE `Name`=:name", ['name' => 'bx_tasks']);
            
            $aAttachments = $this->oDb->getAll("SELECT * FROM `sys_cmts_images2entries` WHERE `system_id`=:system_id", [
                'system_id' => $iCmtsSystemId
            ]);
            
            foreach($aAttachments as $aAttachment) {
                if($oStorage)
                    $oStorage->queueFilesForDeletion($aAttachment['image_id']);
            
                $this->oDb->query("DELETE FROM `sys_cmts_images2entries` WHERE `id`=:id", [
                    'id' => $aAttachment['id']
                ]);
            }
        }

        return $iResult;
    }

    protected function actionUpdateFiles($bInstall = true)
    {
        $iResult = parent::actionUpdateFiles($bInstall);

        if($iResult == BX_DOL_STUDIO_INSTALLER_SUCCESS) {
            $aModuleConfig = BxDolInstallerUtils::getModuleConfig(BX_DIRECTORY_PATH_MODULES . $this->_aConfig['module_dir'] . 'install/config.php');
            if(isset($aModuleConfig['note']))
                $this->oDb->query("UPDATE `sys_modules` SET `note`=:note WHERE `uri`=:uri", [
                    'note' => $aModuleConfig['note'],
                    'uri' => $this->_aConfig['module_uri']
                ]);
        }

        return $iResult;
    }
}
