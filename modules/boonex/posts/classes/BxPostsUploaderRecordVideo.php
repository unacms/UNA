<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Posts Posts
 * @ingroup     UnaModules
 *
 * @{
 */

class BxPostsUploaderRecordVideo extends BxTemplUploaderRecordVideo
{
    protected $_sModule;
    protected $_oModule;

    public function __construct ($aObject, $sStorageObject, $sUniqId, $oTemplate)
    {
        $this->_sModule = 'bx_posts';
        $this->_oModule = BxDolModule::getInstance($this->_sModule);
        
        parent::__construct($aObject, $sStorageObject, $sUniqId, $oTemplate);
    }

    protected function isAdmin ($iContentId = 0)
    {
        return $this->_oModule->_isModerator (false);
    }
}

/** @} */
