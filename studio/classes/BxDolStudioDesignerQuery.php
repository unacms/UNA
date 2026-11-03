<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

class BxDolStudioDesignerQuery extends BxDolStudioPageQuery
{
    function __construct()
    {
        parent::__construct();
    }

    /**
     * A template's style options (<prefix>_*, Studio > the template > Styles) with its mix's values over them.
     * @return array name => value
     */
    public function getTemplateStyles($sPrefix, $iMixId = 0)
    {
        $aResult = $this->getPairs("SELECT `name`, `value` FROM `sys_options` WHERE `name` LIKE :prefix", 'name', 'value', [
            'prefix' => $sPrefix . '\_%'
        ]);

        if((int)$iMixId > 0)
            $aResult = array_merge($aResult, $this->getPairs("SELECT `option`, `value` FROM `sys_options_mixes2options` WHERE `mix_id`=:mix_id", 'option', 'value', [
                'mix_id' => (int)$iMixId
            ]));

        return $aResult;
    }

    public function getMixTitle($iMixId)
    {
        return $this->getOne("SELECT `title` FROM `sys_options_mixes` WHERE `id`=:id", ['id' => (int)$iMixId]);
    }

    public function getInjection($sName)
    {
        return $this->getOne("SELECT `data` FROM `sys_injections` WHERE `name`=:name", [
            'name' => $sName
        ]);
    }

    public function updateInjection($sName, $sValue)
    {
        return $this->query("UPDATE `sys_injections` SET `data`=:data WHERE `name`=:name", [
            'name' => $sName,
            'data' => $sValue
        ]) !== false;
    }
    
}

/** @} */
