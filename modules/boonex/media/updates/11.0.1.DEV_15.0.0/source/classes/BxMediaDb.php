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

/*
 * Module database queries
 */
class BxMediaDb extends BxDolModuleDb
{
    public function __construct(&$oConfig)
    {
        parent::__construct($oConfig);
    }

    /**
     * A member's newest uploaded files that no content uses yet.
     */
    public function getRecentGhosts($iProfileId, $iLimit)
    {
        return $this->getAll("SELECT `id`, `object` FROM `sys_storage_ghosts` WHERE `profile_id` = :profile_id ORDER BY `created` DESC LIMIT " . (int)$iLimit, [
            'profile_id' => (int)$iProfileId
        ]);
    }

    public function getGhostOfProfile($iFileId, $iProfileId)
    {
        return $this->getRow("SELECT `id`, `object`, `profile_id`, `content_id` FROM `sys_storage_ghosts` WHERE `id` = :id AND `profile_id` = :profile_id LIMIT 1", [
            'id' => (int)$iFileId,
            'profile_id' => (int)$iProfileId
        ]);
    }

    /*
     * Enable and disable: the module's uploaders in the files fields of forms and in attachment menus.
     */

    public function saveFilesInputs()
    {
        return $this->query("INSERT INTO `bx_media_input_settings` (`input_id`, `value`, `values`) SELECT `id`, `value`, `values` FROM `sys_form_inputs` WHERE `type` = 'files'");
    }

    public function getFilesInputs()
    {
        return $this->getAll("SELECT `id`, `name`, `module`, `value`, `values` FROM `sys_form_inputs` WHERE `type` = 'files'");
    }

    public function updateInputValues($iInputId, $sValues)
    {
        return $this->query("UPDATE `sys_form_inputs` SET `values` = :values WHERE `id` = :id", [
            'id' => (int)$iInputId,
            'values' => $sValues
        ]);
    }

    public function getSavedFilesInputs()
    {
        return $this->getAll("SELECT `id`, `input_id`, `value`, `values` FROM `bx_media_input_settings`");
    }

    public function restoreFilesInput($aSaved)
    {
        $this->query("UPDATE `sys_form_inputs` SET `value` = :value, `values` = :values WHERE `id` = :id", [
            'id' => (int)$aSaved['input_id'],
            'value' => $aSaved['value'],
            'values' => $aSaved['values']
        ]);

        return $this->query("DELETE FROM `bx_media_input_settings` WHERE `id` = :id", [
            'id' => (int)$aSaved['id']
        ]);
    }

    public function getAttachmentMenuSets()
    {
        return $this->getColumn("SELECT `set_name` FROM `sys_objects_menu` WHERE `override_class_name` LIKE '%MenuAttachment%'");
    }

    public function getHtml5MenuItems($sSetName)
    {
        return $this->getAll("SELECT * FROM `sys_menu_items` WHERE `set_name` = :set_name AND `name` LIKE '%html5'", [
            'set_name' => $sSetName
        ]);
    }

    public function insertMenuItem($aItem)
    {
        return $this->query("INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `visible_for_levels`, `active`, `copyable`, `editable`, `order`) VALUES (:set_name, :module, :name, :title_system, :title, :link, :onclick, :target, :icon, :visible_for_levels, :active, :copyable, :editable, :order)", $aItem);
    }

    public function deleteMenuItems($sSetName, $sModule)
    {
        return $this->query("DELETE FROM `sys_menu_items` WHERE `set_name` = :set_name AND `module` = :module", [
            'set_name' => $sSetName,
            'module' => $sModule
        ]);
    }
}

/** @} */
