<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    OpenCV OpenCV integration
 * @ingroup     UnaModules
 *
 * @{
 */

class BxOpencvInstaller extends BxDolStudioInstaller
{
    function __construct($aConfig)
    {
        parent::__construct($aConfig);
    }

    public function install($aParams, $bAutoEnable = false)
    {
        $aResult = parent::install($aParams, $bAutoEnable);
        if ($aResult['result']) {
            if ($this->oDb->isTableExists('bx_persons_data') && !$this->oDb->isFieldExists('bx_persons_data', 'obfuscate_faces'))
                $this->oDb->query("ALTER TABLE `bx_persons_data` ADD `obfuscate_faces` TINYINT NOT NULL DEFAULT '0'");
            if ($this->oDb->isTableExists('bx_organizations_data') && !$this->oDb->isFieldExists('bx_organizations_data', 'obfuscate_faces'))
                $this->oDb->query("ALTER TABLE `bx_organizations_data` ADD `obfuscate_faces` TINYINT NOT NULL DEFAULT '0'");
        }
        return $aResult;
    }

    public function uninstall($aParams, $bAutoDisable = false)
    {
        $aResult = parent::uninstall($aParams, $bAutoDisable);
        if ($aResult['result']) {
            if ($this->oDb->isTableExists('bx_persons_data') && $this->oDb->isFieldExists('bx_persons_data', 'obfuscate_faces'))
                $this->oDb->query("ALTER TABLE `bx_persons_data` DROP `obfuscate_faces`");
            if ($this->oDb->isTableExists('bx_organizations_data') && $this->oDb->isFieldExists('bx_organizations_data', 'obfuscate_faces'))
                $this->oDb->query("ALTER TABLE `bx_organizations_data` DROP `obfuscate_faces`");
        }
        return $aResult;
    }
}

/** @} */
