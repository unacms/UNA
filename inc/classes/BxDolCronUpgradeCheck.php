<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

class BxDolCronUpgradeCheck extends BxDolCron
{
    public function processing()
    {
        $o = bx_instance('BxDolUpgrader');

        // without auto-update, still ask for the newest version: Studio's launcher shows the Dashboard notice from the kept answer
        if ('on' != getParam('sys_autoupdate')) {
            $o->getVersionUpdateInfo();
            return;
        }

        if (!$o->prepare()) {
            sendMailTemplateSystem('t_UpgradeFailed', array (
                'error_msg' => $o->getError(),
            ));
            setParam('sys_autoupdate', ''); // disable auto-update if it is failed
        }
    }
}

/** @} */
