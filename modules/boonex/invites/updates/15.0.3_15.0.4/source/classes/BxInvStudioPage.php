<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Invites Invites
 * @ingroup     UnaModules
 *
 * @{
 */

class BxInvStudioPage extends BxTemplStudioModule
{
    function __construct($sModule, $mixedPageName, $sPage = "")
    {
        parent::__construct($sModule, $mixedPageName, $sPage);

        $oPermalink = BxDolPermalinks::getInstance();

        $this->aMenuItems += [
            'manage' => ['name' => 'manage', 'icon' => 'edit', 'title' => '_bx_invites_menu_item_title_requests', 'link' => bx_absolute_url($oPermalink->permalink('page.php?i=invites-requests'))],
        ];
    }
}

/** @} */
