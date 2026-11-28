<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Reviews Reviews
 * @ingroup     UnaModules
 *
 * @{
 */

class BxReviewsUploaderRecordVideoAttach extends BxBaseModTextUploaderRecordVideoAttach
{
    public function __construct ($aObject, $sStorageObject, $sUniqId, $oTemplate)
    {
        $this->_sModule = 'bx_reviews';

        parent::__construct($aObject, $sStorageObject, $sUniqId, $oTemplate);
    }

    protected function isAdmin ($iContentId = 0)
    {
        return $this->_oModule->_isModerator (false);
    }
}

/** @} */
